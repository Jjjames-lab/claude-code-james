package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
)

// MinIOClient MinIO 客户端
type MinIOClient struct {
	client    *minio.Client
	logger    *zap.Logger
	endpoint  string
	accessKey string
	secretKey string
	useSSL    bool
}

// MinIOConfig MinIO 配置
type MinIOConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	UseSSL    bool
	Logger    *zap.Logger
}

// NewMinIOClient 创建 MinIO 客户端
func NewMinIOClient(cfg *MinIOConfig) (*MinIOClient, error) {
	// 初始化 MinIO 客户端
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	// 检查连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = client.ListBuckets(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MinIO: %w", err)
	}

	cfg.Logger.Info("MinIO client initialized",
		zap.String("endpoint", cfg.Endpoint),
		zap.Bool("ssl", cfg.UseSSL))

	return &MinIOClient{
		client:    client,
		logger:    cfg.Logger,
		endpoint:  cfg.Endpoint,
		accessKey: cfg.AccessKey,
		secretKey: cfg.SecretKey,
		useSSL:    cfg.UseSSL,
	}, nil
}

// UploadAudio 上传音频文件
func (m *MinIOClient) UploadAudio(
	ctx context.Context,
	objectName string,
	reader io.Reader,
	contentSize int64,
) (string, error) {
	bucket := "podcasts-audio"

	// 上传文件
	_, err := m.client.PutObject(ctx, bucket, objectName, reader, contentSize, minio.PutObjectOptions{
		ContentType: "audio/mpeg",
	})
	if err != nil {
		m.logger.Error("Failed to upload audio",
			zap.String("object", objectName),
			zap.Error(err))
		return "", fmt.Errorf("failed to upload audio: %w", err)
	}

	// 生成 URL
	url := m.generateURL(bucket, objectName)

	m.logger.Info("Audio uploaded successfully",
		zap.String("object", objectName),
		zap.String("url", url))

	return url, nil
}

// UploadTranscript 上传转录结果
func (m *MinIOClient) UploadTranscript(
	ctx context.Context,
	objectName string,
	data []byte,
) (string, error) {
	bucket := "asr-results"

	// 上传数据
	_, err := m.client.PutObject(ctx, bucket, objectName, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType: "application/json",
	})
	if err != nil {
		m.logger.Error("Failed to upload transcript",
			zap.String("object", objectName),
			zap.Error(err))
		return "", fmt.Errorf("failed to upload transcript: %w", err)
	}

	// 生成 URL
	url := m.generateURL(bucket, objectName)

	m.logger.Info("Transcript uploaded successfully",
		zap.String("object", objectName),
		zap.String("url", url))

	return url, nil
}

// DownloadFile 下载文件
func (m *MinIOClient) DownloadFile(ctx context.Context, bucket, objectName string) ([]byte, error) {
	obj, err := m.client.GetObject(ctx, bucket, objectName, minio.GetObjectOptions{})
	if err != nil {
		m.logger.Error("Failed to get object",
			zap.String("bucket", bucket),
			zap.String("object", objectName),
			zap.Error(err))
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		m.logger.Error("Failed to read object",
			zap.String("bucket", bucket),
			zap.String("object", objectName),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read object: %w", err)
	}

	m.logger.Info("File downloaded successfully",
		zap.String("bucket", bucket),
		zap.String("object", objectName),
		zap.Int("size", len(data)))

	return data, nil
}

// DeleteFile 删除文件
func (m *MinIOClient) DeleteFile(ctx context.Context, bucket, objectName string) error {
	err := m.client.RemoveObject(ctx, bucket, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		m.logger.Error("Failed to delete file",
			zap.String("bucket", bucket),
			zap.String("object", objectName),
			zap.Error(err))
		return fmt.Errorf("failed to delete file: %w", err)
	}

	m.logger.Info("File deleted successfully",
		zap.String("bucket", bucket),
		zap.String("object", objectName))

	return nil
}

// ListFiles 列出文件
func (m *MinIOClient) ListFiles(ctx context.Context, bucket string) ([]minio.ObjectInfo, error) {
	var objects []minio.ObjectInfo

	for object := range m.client.ListObjects(ctx, bucket, minio.ListObjectsOptions{}) {
		if object.Err != nil {
			m.logger.Error("Failed to list objects",
				zap.String("bucket", bucket),
				zap.Error(object.Err))
			return nil, fmt.Errorf("failed to list objects: %w", object.Err)
		}
		objects = append(objects, object)
	}

	m.logger.Info("Files listed successfully",
		zap.String("bucket", bucket),
		zap.Int("count", len(objects)))

	return objects, nil
}

// GetObjectInfo 获取对象信息
func (m *MinIOClient) GetObjectInfo(ctx context.Context, bucket, objectName string) (minio.ObjectInfo, error) {
	info, err := m.client.StatObject(ctx, bucket, objectName, minio.StatObjectOptions{})
	if err != nil {
		m.logger.Error("Failed to get object info",
			zap.String("bucket", bucket),
			zap.String("object", objectName),
			zap.Error(err))
		return minio.ObjectInfo{}, fmt.Errorf("failed to get object info: %w", err)
	}

	return info, nil
}

// generateURL 生成文件访问 URL
func (m *MinIOClient) generateURL(bucket, objectName string) string {
	protocol := "http"
	if m.useSSL {
		protocol = "https"
	}
	return fmt.Sprintf("%s://%s/%s/%s", protocol, m.endpoint, bucket, objectName)
}

// GetEndpoint 获取 MinIO 端点
func (m *MinIOClient) GetEndpoint() string {
	return m.endpoint
}
