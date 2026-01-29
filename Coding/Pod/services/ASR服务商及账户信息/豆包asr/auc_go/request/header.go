package request

import (
	"net/http"

	"byted.org/data-speech/asr-tob-demo/auc/config"
)

func NewAuthHeader(reqID string) http.Header {
	header := http.Header{}

	header.Add("X-Api-Resource-Id", "volc.bigasr.auc")
	header.Add("X-Api-Request-Id", reqID)
	header.Add("X-Api-Access-Key", config.AccessKey())
	header.Add("X-Api-App-Key", config.AppKey())
	return header
}
