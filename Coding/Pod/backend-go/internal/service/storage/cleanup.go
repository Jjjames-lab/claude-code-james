package storage

import (
	"context"
	"time"

	"go.uber.org/zap"
)

// CleanupService 文件清理服务
type CleanupService struct {
	client    *MinIOClient
	logger    *zap.Logger
	interval  time.Duration // 清理间隔
	retention time.Duration // 保留时长
}

// CleanupConfig 清理配置
type CleanupConfig struct {
	Client    *MinIOClient
	Logger    *zap.Logger
	Interval  time.Duration // 默认 1 小时
	Retention time.Duration // 默认 7 天
}

// NewCleanupService 创建清理服务
func NewCleanupService(cfg *CleanupConfig) *CleanupService {
	if cfg.Interval == 0 {
		cfg.Interval = 1 * time.Hour
	}
	if cfg.Retention == 0 {
		cfg.Retention = 7 * 24 * time.Hour // 7天
	}

	return &CleanupService{
		client:    cfg.Client,
		logger:    cfg.Logger,
		interval:  cfg.Interval,
		retention: cfg.Retention,
	}
}

// Start 启动定期清理
func (s *CleanupService) Start(ctx context.Context) {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	s.logger.Info("Cleanup service started",
		zap.Duration("interval", s.interval),
		zap.Duration("retention", s.retention))

	// 立即执行一次清理
	s.cleanupOldFiles(ctx)

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("Cleanup service stopped")
			return
		case <-ticker.C:
			s.cleanupOldFiles(ctx)
		}
	}
}

// cleanupOldFiles 清理过期文件
func (s *CleanupService) cleanupOldFiles(ctx context.Context) {
	startTime := time.Now()
	cutoff := startTime.Add(-s.retention)

	s.logger.Info("Starting cleanup",
		zap.Time("cutoff", cutoff))

	buckets := []string{"podcasts-audio", "asr-results"}

	totalDeleted := 0
	totalFailed := 0

	for _, bucket := range buckets {
		deleted, failed, err := s.cleanupBucket(ctx, bucket, cutoff)
		if err != nil {
			s.logger.Error("Failed to cleanup bucket",
				zap.String("bucket", bucket),
				zap.Error(err))
			continue
		}
		totalDeleted += deleted
		totalFailed += failed
	}

	duration := time.Since(startTime)

	s.logger.Info("Cleanup completed",
		zap.Int("total_deleted", totalDeleted),
		zap.Int("total_failed", totalFailed),
		zap.Duration("duration", duration))
}

// cleanupBucket 清理指定存储桶
func (s *CleanupService) cleanupBucket(ctx context.Context, bucket string, cutoff time.Time) (int, int, error) {
	objects, err := s.client.ListFiles(ctx, bucket)
	if err != nil {
		return 0, 0, err
	}

	deleted := 0
	failed := 0

	for _, object := range objects {
		// 检查对象最后修改时间
		if object.LastModified.After(cutoff) {
			// 未过期，跳过
			continue
		}

		// 删除过期对象
		err := s.client.DeleteFile(ctx, bucket, object.Key)
		if err != nil {
			s.logger.Warn("Failed to delete expired object",
				zap.String("bucket", bucket),
				zap.String("object", object.Key),
				zap.Time("last_modified", object.LastModified),
				zap.Error(err))
			failed++
		} else {
			s.logger.Debug("Deleted expired object",
				zap.String("bucket", bucket),
				zap.String("object", object.Key),
				zap.Time("last_modified", object.LastModified))
			deleted++
		}
	}

	return deleted, failed, nil
}

// CleanupObject 清理对象信息
type CleanupObject struct {
	Bucket      string    `json:"bucket"`
	ObjectName  string    `json:"object_name"`
	Size        int64     `json:"size"`
	LastModified time.Time `json:"last_modified"`
	Deleted     bool      `json:"deleted"`
}

// GetExpiredObjects 获取过期对象列表（不删除）
func (s *CleanupService) GetExpiredObjects(ctx context.Context) ([]CleanupObject, error) {
	cutoff := time.Now().Add(-s.retention)

	buckets := []string{"podcasts-audio", "asr-results"}
	var expiredObjects []CleanupObject

	for _, bucket := range buckets {
		objects, err := s.client.ListFiles(ctx, bucket)
		if err != nil {
			s.logger.Error("Failed to list objects",
				zap.String("bucket", bucket),
				zap.Error(err))
			continue
		}

		for _, object := range objects {
			if object.LastModified.Before(cutoff) {
				expiredObjects = append(expiredObjects, CleanupObject{
					Bucket:       bucket,
					ObjectName:   object.Key,
					Size:         object.Size,
					LastModified: object.LastModified,
					Deleted:      false,
				})
			}
		}
	}

	return expiredObjects, nil
}
