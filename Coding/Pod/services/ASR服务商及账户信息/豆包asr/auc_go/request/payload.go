package request

type UserMeta struct {
	Uid        string `json:"uid,omitempty"`
	Did        string `json:"did,omitempty"`
	Platform   string `json:"platform,omitempty" `
	SDKVersion string `json:"sdk_version,omitempty"`
	APPVersion string `json:"app_version,omitempty"`
}

type AudioMeta struct {
	Format  string `json:"format,omitempty"`
	Codec   string `json:"codec,omitempty"`
	Rate    int    `json:"rate,omitempty"`
	Bits    int    `json:"bits,omitempty"`
	Channel int    `json:"channel,omitempty"`
	URL     string `json:"url,omitempty"`
}

type CorpusMeta struct {
	BoostingTableName string `json:"boosting_table_name,omitempty"`
	CorrectTableName  string `json:"correct_table_name,omitempty"`
	Context           string `json:"context,omitempty"`
}

type RequestMeta struct {
	ModelName      string     `json:"model_name,omitempty"`
	EnableITN      bool       `json:"enable_itn,omitempty"`
	EnablePUNC     bool       `json:"enable_punc,omitempty"`
	EnableDDC      bool       `json:"enable_ddc,omitempty"`
	ShowUtterances bool       `json:"show_utterances,omitempty"`
	Corpus         CorpusMeta `json:"corpus,omitempty"`
}

type AsrRequestPayload struct {
	User    UserMeta    `json:"user"`
	Audio   AudioMeta   `json:"audio"`
	Request RequestMeta `json:"request"`
}

func DefaultPayload(fileURL string) *AsrRequestPayload {
	return &AsrRequestPayload{
		User: UserMeta{
			Uid: "demo_uid",
		},
		Audio: AudioMeta{
			Format:  "wav",
			Codec:   "raw",
			Rate:    16000,
			Bits:    16,
			Channel: 1,
			URL:     fileURL,
		},
		Request: RequestMeta{
			ModelName:  "bigmodel",
			EnableITN:  true,
			EnablePUNC: true,
			EnableDDC:  true,
		},
	}
}
