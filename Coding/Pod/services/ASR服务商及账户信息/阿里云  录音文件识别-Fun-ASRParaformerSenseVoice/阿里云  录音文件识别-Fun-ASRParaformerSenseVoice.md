# 阿里云  录音文件识别-Fun-ASR/Paraformer/SenseVoice  
  
  
  
Fun-ASR/Paraformer/SenseVoice的录音文件识别模型能将录制好的音频转换为文本，支持单个文件识别和批量文件识别，适用于处理不需要即时返回结果的场景。  
  
  
## 核心功能  
* **多语种识别**：支持识别中文（含多种方言）、英、日、韩、德、法、俄等多种语言。  
* **广泛格式兼容**：支持任意采样率，并兼容aac、wav、mp3等多种主流音视频格式。  
* **长音频文件处理**：支持对单个时长不超过12小时、体积不超过2GB的音频文件进行异步转写。  
* **歌唱识别**：即使在伴随背景音乐（BGM）的情况下，也能实现整首歌曲的转写（仅fun-asr和fun-asr-2025-11-07模型支持该功能）。  
* **丰富识别功能**：提供说话人分离、敏感词过滤、句子/词语级时间戳、热词增强等可配置功能，满足个性化需求  
  
  
## 适用范围  
**支持的模型：**中国内地  
  
  
在[中国内地部署模式](https://help.aliyun.com/zh/model-studio/regions/#080da663a75xh)下，接入点与数据存储均位于**北京地域**，模型推理计算资源仅限于中国内地。  
调用以下模型时，请选择北京地域的[API Key](https://bailian.console.aliyun.com/?tab=model#/api-key)：  
* **Fun-ASR**：fun-asr（稳定版，当前等同fun-asr-2025-11-07）、fun-asr-2025-11-07（快照版）、fun-asr-2025-08-25（快照版）、fun-asr-mtl（稳定版，当前等同fun-asr-mtl-2025-08-25）、fun-asr-mtl-2025-08-25（快照版）  
* **Paraformer**：paraformer-v2、paraformer-8k-v2、paraformer-v1、paraformer-8k-v1、paraformer-mtl-v1  
* **SenseVoice（即将下线）**：sensevoice-v1  
  
  
国际：在[国际部署模式](https://help.aliyun.com/zh/model-studio/regions/#080da663a75xh)下，接入点与数据存储均位于**新加坡地域**，模型推理计算资源在全球范围内动态调度（不含中国内地）。  
调用以下模型时，请选择新加坡地域的[API Key](https://modelstudio.console.aliyun.com/?tab=dashboard#/api-key)：  
* **Fun-ASR**：fun-asr（稳定版，当前等同fun-asr-2025-11-07）、fun-asr-2025-11-07（快照版）、fun-asr-2025-08-25（快照版）、fun-asr-mtl（稳定版，当前等同fun-asr-mtl-2025-08-25）、fun-asr-mtl-2025-08-25（快照版）  
  
  
模型选型：  

| 场景 | 推荐模型 | 理由 |
| ----------- | ------------------------- | ---------------------------------------------------- |
| 中文识别（会议/直播） | fun-asr | 针对中文深度优化，覆盖多种方言；远场VAD和噪声鲁棒性强，适合嘈杂或多人远距离发言的真实场景，准确率更高 |
| 多语种识别（国际会议） | fun-asr-mtl、paraformer-v2 | 一个模型即可应对多语言需求，简化开发和部署 |
| 文娱内容分析与字幕生成 | fun-asr | 具备独特的歌唱识别能力，能有效转写歌曲、直播中的演唱片段；结合其噪声鲁棒性，非常适合处理复杂的媒体音频 |
| 新闻/访谈节目字幕生成 | fun-asr、paraformer-v2 | 长音频+标点预测+时间戳，直接生成结构化字幕 |
| 智能硬件远场语音交互 | fun-asr | 远场VAD（语音活动检测）经过专门优化，能在家庭、车载等嘈杂环境下，更准确地捕捉和识别用户的远距离指令 |
  
  
  
快速开始：  
下面是调用API的示例代码。  
您需要已[获取API Key](https://help.aliyun.com/zh/model-studio/get-api-key)并[配置API Key到环境变量](https://help.aliyun.com/zh/model-studio/configure-api-key-through-environment-variables)。如果通过SDK调用，还需要[安装DashScope SDK](https://help.aliyun.com/zh/model-studio/install-sdk)。  
  
  
## Fun-ASR：  
由于音视频文件的尺寸通常较大，文件传输和语音识别处理均需要时间，文件转写API通过异步调用方式来提交任务。开发者需要通过查询接口，在文件转写完成后获得语音识别结  
  
python：  
```
from http import HTTPStatus
from dashscope.audio.asr import Transcription
from urllib import request
import dashscope
import os
import json

# 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：https://dashscope-intl.aliyuncs.com/api/v1
dashscope.base_http_api_url = 'https://dashscope.aliyuncs.com/api/v1'

# 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
# 若没有配置环境变量，请用百炼API Key将下行替换为：dashscope.api_key = "sk-xxx"
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

task_response = Transcription.async_call(
    model='fun-asr',
    file_urls=['https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav',
               'https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_male2.wav'],
    language_hints=['zh', 'en']  # language_hints为可选参数，用于指定待识别音频的语言代码。取值范围请参见API参考文档。
)

transcription_response = Transcription.wait(task=task_response.output.task_id)

if transcription_response.status_code == HTTPStatus.OK:
    for transcription in transcription_response.output['results']:
        if transcription['subtask_status'] == 'SUCCEEDED':
            url = transcription['transcription_url']
            result = json.loads(request.urlopen(url).read().decode('utf8'))
            print(json.dumps(result, indent=4,
                            ensure_ascii=False))
        else:
            print('transcription failed!')
            print(transcription)
else:
    print('Error: ', transcription_response.output.message)

```
  
  
Java：  
```
import com.alibaba.dashscope.audio.asr.transcription.*;
import com.alibaba.dashscope.utils.Constants;
import com.google.gson.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        // 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：https://dashscope-intl.aliyuncs.com/api/v1
        Constants.baseHttpApiUrl = "https://dashscope.aliyuncs.com/api/v1";
        // 创建转写请求参数。
        TranscriptionParam param =
                TranscriptionParam.builder()
                        // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
                        // 若没有配置环境变量，请用百炼API Key将下行替换为：.apiKey("sk-xxx")
                        .apiKey(System.getenv("DASHSCOPE_API_KEY"))
                        .model("fun-asr")
                        // language_hints为可选参数，用于指定待识别音频的语言代码。取值范围请参见API参考文档。
                        .parameter("language_hints", new String[]{"zh", "en"})
                        .fileUrls(
                                Arrays.asList(
                                        "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav",
                                        "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_male2.wav"))
                        .build();
        try {
            Transcription transcription = new Transcription();
            // 提交转写请求
            TranscriptionResult result = transcription.asyncCall(param);
            System.out.println("RequestId: " + result.getRequestId());
            // 阻塞等待任务完成并获取结果
            result = transcription.wait(
                    TranscriptionQueryParam.FromTranscriptionParam(param, result.getTaskId()));
            // 获取转写结果
            List<TranscriptionTaskResult> taskResultList = result.getResults();
            if (taskResultList != null && taskResultList.size() > 0) {
                for (TranscriptionTaskResult taskResult : taskResultList) {
                    String transcriptionUrl = taskResult.getTranscriptionUrl();
                    HttpURLConnection connection =
                            (HttpURLConnection) new URL(transcriptionUrl).openConnection();
                    connection.setRequestMethod("GET");
                    connection.connect();
                    BufferedReader reader =
                            new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    Gson gson = new GsonBuilder().setPrettyPrinting().create();
                    JsonElement jsonResult = gson.fromJson(reader, JsonObject.class);
                    System.out.println(gson.toJson(jsonResult));
                }
            }
        } catch (Exception e) {
            System.out.println("error: " + e);
        }
        System.exit(0);
    }
}

```
## Paraformer  
  
由于音视频文件的尺寸通常较大，文件传输和语音识别处理均需要时间，文件转写API通过异步调用方式来提交任务。开发者需要通过查询接口，在文件转写完成后获得语音识别结果。  
python：  
  
```
from http import HTTPStatus
from dashscope.audio.asr import Transcription
from urllib import request
import dashscope
import os
import json


# 获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
# 若没有配置环境变量，请用百炼API Key将下行替换为：dashscope.api_key = "sk-xxx"
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

task_response = Transcription.async_call(
    model='paraformer-v2',
    file_urls=['https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav',
               'https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_male2.wav'],
    language_hints=['zh', 'en']  # language_hints为可选参数，用于指定待识别音频的语言代码。仅Paraformer系列的paraformer-v2模型支持该参数，取值范围请参见API参考文档。
)

transcription_response = Transcription.wait(task=task_response.output.task_id)

if transcription_response.status_code == HTTPStatus.OK:
    for transcription in transcription_response.output['results']:
        if transcription['subtask_status'] == 'SUCCEEDED':
            url = transcription['transcription_url']
            result = json.loads(request.urlopen(url).read().decode('utf8'))
            print(json.dumps(result, indent=4,
                            ensure_ascii=False))
        else:
            print('transcription failed!')
            print(transcription)
else:
    print('Error: ', transcription_response.output.message)

```
Java：  
```
import com.alibaba.dashscope.audio.asr.transcription.*;
import com.google.gson.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        // 创建转写请求参数
        TranscriptionParam param =
                TranscriptionParam.builder()
                        // 获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
                        // 若没有配置环境变量，请用百炼API Key将下行替换为：.apiKey("sk-xxx")
                        .apiKey(System.getenv("DASHSCOPE_API_KEY"))
                        .model("paraformer-v2")
                        // language_hints为可选参数，用于指定待识别音频的语言代码。仅Paraformer系列的paraformer-v2模型支持该参数，取值范围请参见API参考文档。
                        .parameter("language_hints", new String[]{"zh", "en"})
                        .fileUrls(
                                Arrays.asList(
                                        "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav",
                                        "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_male2.wav"))
                        .build();
        try {
            Transcription transcription = new Transcription();
            // 提交转写请求
            TranscriptionResult result = transcription.asyncCall(param);
            System.out.println("RequestId: " + result.getRequestId());
            // 阻塞等待任务完成并获取结果
            result = transcription.wait(
                    TranscriptionQueryParam.FromTranscriptionParam(param, result.getTaskId()));
            // 获取转写结果
            List<TranscriptionTaskResult> taskResultList = result.getResults();
            if (taskResultList != null && taskResultList.size() > 0) {
                for (TranscriptionTaskResult taskResult : taskResultList) {
                    String transcriptionUrl = taskResult.getTranscriptionUrl();
                    HttpURLConnection connection =
                            (HttpURLConnection) new URL(transcriptionUrl).openConnection();
                    connection.setRequestMethod("GET");
                    connection.connect();
                    BufferedReader reader =
                            new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    Gson gson = new GsonBuilder().setPrettyPrinting().create();
                    JsonElement jsonResult = gson.fromJson(reader, JsonObject.class);
                    System.out.println(gson.toJson(jsonResult));
                }
            }
        } catch (Exception e) {
            System.out.println("error: " + e);
        }
        System.exit(0);
    }
}

```
## 模型功能特性对比  

| 功能/特性 | Fun-ASR | Paraformer | SenseVoice（即将下线） |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 支持语言 | 因模型而异：
	•	fun-asr、fun-asr-2025-11-07： 中文（普通话、粤语、吴语、闽南语、客家话、赣语、湘语、晋语；并支持中原、西南、冀鲁、江淮、兰银、胶辽、东北、北京、港台等，包括河南、陕西、湖北、四川、重庆、云南、贵州、广东、广西、河北、天津、山东、安徽、南京、江苏、杭州、甘肃、宁夏等地区官话口音）、英文、日语 
	•	fun-asr-2025-08-25： 中文（普通话）、英文 
	•	fun-asr-mtl、fun-asr-mtl-2025-08-25： 中文（普通话、粤语）、英文、日语、韩语、越南语、印尼语、泰语、马来语、菲律宾语、阿拉伯语、印地语、保加利亚语、克罗地亚语、捷克语、丹麦语、荷兰语、爱沙尼亚语、芬兰语、希腊语、匈牙利语、爱尔兰语、拉脱维亚语、立陶宛语、马耳他语、波兰语、葡萄牙语、罗马尼亚语、斯洛伐克语、斯洛文尼亚语、瑞典语 | 因模型而异：
	•	paraformer-v2： 中文（普通话、粤语、吴语、闽南语、东北话、甘肃话、贵州话、河南话、湖北话、湖南话、宁夏话、山西话、陕西话、山东话、四川话、天津话、江西话、云南话、上海话）、英文、日语、韩语、德语、法语、俄语 
	•	paraformer-8k-v2：中文普通话
	•	paraformer-v1：中文普通话、英文
	•	paraformer-8k-v1：中文普通话
	•	paraformer-mtl-v1：中文（普通话、粤语、吴语、闽南语、东北话、甘肃话、贵州话、河南话、湖北话、湖南话、宁夏话、山西话、陕西话、山东话、四川话、天津话）、英文、日语、韩语、西班牙语、印尼语、法语、德语、意大利语、马来语 | •	重点语言：中文、英文、粤语、日语、韩语、俄语、法语、意大利语、德语、西班牙语
	•	更多语言：加泰罗尼亚语、印度尼西亚语、泰语、荷兰语、葡萄牙语、捷克语、波兰语等，详情请参见语言列表 |
| 支持的音频格式 | aac、amr、avi、flac、flv、m4a、mkv、mov、mp3、mp4、mpeg、ogg、opus、wav、webm、wma、wmv | aac、amr、avi、flac、flv、m4a、mkv、mov、mp3、mp4、mpeg、ogg、opus、wav、webm、wma、wmv | aac、amr、avi、flac、flv、m4a、mkv、mov、mp3、mp4、mpeg、ogg、opus、wav、webm、wma、wmv |
| 采样率 | 任意 | 因模型而异：
	•	paraformer-v2、paraformer-v1：任意
	•	paraformer-8k-v2、paraformer-8k-v1：8kHz
	•	paraformer-mtl-v1：16kHz及以上 | 任意 |
| 声道 | 任意 |  |  |
| 输入形式 | 公网可访问的待识别文件URL，最多支持输入100个音频 |  |  |
| 音频大小/时长 | 每个音频文件大小不超过2GB，且时长不超过12小时 |  | 每个音频文件大小不超过2GB，时长无限制 |
| 情感识别 | 不支持 |  | 支持 固定开启 |
| 时间戳 | 支持 固定开启 | 支持 默认关闭，可开启 | 支持 固定开启 |
| 标点符号预测 | 支持 固定开启 |  |  |
| 热词 | 支持 可配置 |  | 不支持 |
| ITN | 支持 固定开启 |  |  |
| 歌唱识别 | 支持 仅fun-asr和fun-asr-2025-11-07支持该功能 | 不支持 |  |
| 噪声拒识 | 支持 固定开启 |  | 不支持 |
| 敏感词过滤 | 支持 默认过滤阿里云百炼敏感词表中的内容，更多内容过滤需自定义 |  | 不支持 |
| 说话人分离 | 支持 默认关闭，可开启 |  | 不支持 |
| 语气词过滤 | 支持 默认关闭，可开启 |  | 不支持 |
| VAD | 支持 固定开启 |  | 不支持 |
| 限流（RPS） | 提交作业接口：10
任务查询接口：20 | 提交作业接口（因模型而异）：
	•	paraformer-v2、paraformer-8k-v2：20
	•	paraformer-v1、paraformer-8k-v1、paraformer-mtl-v1：10
任务查询接口：20 | 提交作业接口：10
任务查询接口：20 |
| 接入方式 | DashScope：Java/Python/Android/iOS SDK、RESTful API |  | DashScope：Java/Python SDK、RESTful API |
| 价格 | 中国内地：0.00022元/秒
国际：0.00026元/秒 | 中国内地：0.00008元/秒 | 中国内地：0.0007 元/秒 |
  
****常见问题****  
## Q：如何提升识别准确率？  
需综合考虑影响因素并采取相应措施。  
主要影响因素：  
1. 声音质量：录音设备、采样率及环境噪声影响清晰度（高质量音频是基础）  
2. 说话人特征：音调、语速、口音和方言差异（尤其少见方言或重口音）增加识别难度  
3. 语言和词汇：多语言混合、专业术语或俚语提升识别难度（热词配置可优化）  
4. 上下文理解：缺乏上下文易导致语义歧义（尤其在依赖前后文才能正确识别的语境中）  
优化方法：  
1. 优化音频质量：使用高性能麦克风及推荐采样率设备；减少环境噪声与回声  
2. 适配说话人：针对显著口音/方言场景，选用支持方言的模型  
3. 配置热词：为专业术语、专有名词等设置热词（参见[定制热词](https://help.aliyun.com/zh/model-studio/custom-hot-words)）  
4. 保留上下文：避免过短音频分段  
  
