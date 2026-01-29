package client

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/bytedance/sonic"
	"github.com/google/uuid"

	"byted.org/data-speech/asr-tob-demo/auc/request"
	"byted.org/data-speech/asr-tob-demo/auc/response"
)

type AsrHttpClient struct {
	url string
}

func NewAsrHttpClient(url string) *AsrHttpClient {
	return &AsrHttpClient{
		url: url,
	}
}

func (c *AsrHttpClient) submit(ctx context.Context, reqID string, fileUrl string) (string, error) {
	submitUrl := c.url + "/submit"
	header := request.NewAuthHeader(reqID)
	payload := request.DefaultPayload(fileUrl)

	payloadData, err := sonic.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}
	submitRequest, err := http.NewRequest(http.MethodPost, submitUrl, bytes.NewBuffer(payloadData))
	if err != nil {
		return "", fmt.Errorf("failed to create submit request: %w", err)
	}
	submitRequest.Header = header
	submitRequest.Header.Set("Content-Type", "application/json")
	submitRequest.WithContext(ctx)
	// 使用HTTP客户端发送请求
	client := &http.Client{}
	resp, err := client.Do(submitRequest)
	if err != nil {
		return "", fmt.Errorf("failed to do request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("response failed, status code: %d", resp.StatusCode)
	}
	statusCode := resp.Header.Get("X-Api-Status-Code")
	message := resp.Header.Get("X-Api-Message")
	logID := resp.Header.Get("X-Tt-Logid")
	if statusCode != "20000000" {
		return "", fmt.Errorf("response failed, status code: %s, message: %s", statusCode, message)
	}

	return logID, nil
}

func (c *AsrHttpClient) doQuery(ctx context.Context, reqID string) ([]byte, http.Header, error) {
	queryUrl := c.url + "/query"
	header := request.NewAuthHeader(reqID)
	queryRequest, err := http.NewRequest(http.MethodPost, queryUrl, bytes.NewBuffer([]byte("{}")))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create query request: %w", err)
	}
	queryRequest.Header = header
	queryRequest.Header.Set("Content-Type", "application/json")
	queryRequest.WithContext(ctx)
	// 使用HTTP客户端发送请求
	client := &http.Client{}
	resp, err := client.Do(queryRequest)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to do request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, nil, fmt.Errorf("response failed, status code: %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read response body: %w", err)
	}
	return body, resp.Header, nil
}

func (c *AsrHttpClient) query(ctx context.Context, reqID string) (*response.AsrResponse, error) {
	for {
		body, header, err := c.doQuery(ctx, reqID)
		if err != nil {
			return nil, fmt.Errorf("failed to do query: %w", err)
		}
		code := header.Get("X-Api-Status-Code")
		message := header.Get("X-Api-Message")
		if code == "20000000" {
			var resp response.AsrResponse
			if err := sonic.Unmarshal(body, &resp); err != nil {
				return nil, fmt.Errorf("failed to unmarshal response: %w", err)
			}
			return &resp, nil
		}
		if code != "20000001" && code != "20000002" {
			return nil, fmt.Errorf("response failed, status code: %s, message: %s", code, message)
		}
		time.Sleep(time.Second * 3)
	}
}

func (c *AsrHttpClient) Excute(ctx context.Context, fileURL string) (*response.AsrResponse, error) {
	if c.url == "" {
		return nil, errors.New("url is empty")
	}
	// reqID 代表一个任务
	reqID := uuid.New().String()
	// submit，logID 代表一个请求
	logID, err := c.submit(ctx, reqID, fileURL)
	if err != nil {
		return nil, fmt.Errorf("failed to submit request: %w", err)
	}
	log.Printf("tast submited, logID: %s", logID)
	// for loop do query
	resp, err := c.query(ctx, reqID)
	if err != nil {
		return nil, fmt.Errorf("task failed: %w", err)
	}

	return resp, nil
}
