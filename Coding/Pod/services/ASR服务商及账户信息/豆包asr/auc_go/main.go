package main

import (
	"context"
	"flag"
	"log"

	"byted.org/data-speech/asr-tob-demo/auc/client"
)

var fileURL = flag.String("fileurl", "http://tosv.byted.org/obj/auc-tos-data/16s.wav", "audio file url")
var reqURL = flag.String("url", "https://openspeech.bytedance.com/api/v3/auc/bigmodel", "request url")

func main() {
	flag.Parse()
	ctx := context.Background()
	log.SetFlags(log.Lmicroseconds | log.Lshortfile)

	c := client.NewAsrHttpClient(*reqURL)

	resp, err := c.Excute(ctx, *fileURL)
	if err != nil {
		log.Fatalf("failed to excute: %v", err)
		return
	}
	log.Println(resp)
}
