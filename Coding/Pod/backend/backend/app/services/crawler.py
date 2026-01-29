"""
小宇宙爬虫服务
使用 Playwright 处理反爬虫，提取音频和元数据
"""
import asyncio
import re
from typing import Dict, Optional
from playwright.async_api import async_playwright, Browser, Page
from app.utils.logger import logger
from app.utils.errors import Error403Exception, Error404Exception, Error504Exception, InvalidURLException


class XiaoyuzhouCrawler:
    """小宇宙爬虫"""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None

    async def init_browser(self):
        """初始化浏览器"""
        if self.browser is None:
            playwright = await async_playwright().start()
            # 使用 Chromium 浏览器
            self.browser = await playwright.chromium.launch(
                headless=True,  # 无头模式
                args=['--disable-blink-features=AutomationControlled']  # 反爬虫对策
            )
            logger.info("Playwright 浏览器初始化成功")

    async def close_browser(self):
        """关闭浏览器"""
        if self.browser:
            await self.browser.close()
            self.browser = None
            logger.info("Playwright 浏览器已关闭")

    def _validate_url(self, url: str) -> bool:
        """验证 URL 格式（支持 episode 和 podcast 两种链接）"""
        # 支持单集链接: /episode/[id]
        # 支持播客主页: /podcast/[id]
        episode_pattern = r'https?://(www\.)?xiaoyuzhoufm\.com/episode/[a-zA-Z0-9]+'
        podcast_pattern = r'https?://(www\.)?xiaoyuzhoufm\.com/podcast/[a-zA-Z0-9]+'

        if not (re.match(episode_pattern, url) or re.match(podcast_pattern, url)):
            return False
        return True

    def _extract_episode_id(self, url: str) -> str:
        """从 URL 中提取节目 ID"""
        match = re.search(r'/episode/([a-zA-Z0-9]+)', url)
        if match:
            return match.group(1)
        raise InvalidURLException(f"无法从 URL 中提取节目 ID: {url}")

    def _extract_podcast_id(self, url: str) -> str:
        """从 URL 中提取播客 ID"""
        match = re.search(r'/podcast/([a-zA-Z0-9]+)', url)
        if match:
            return match.group(1)
        raise InvalidURLException(f"无法从 URL 中提取播客 ID: {url}")

    def _is_podcast_url(self, url: str) -> bool:
        """判断是否为播客主页链接"""
        return bool(re.search(r'/podcast/[a-zA-Z0-9]+', url))

    def _is_playback_page(self, url: str) -> bool:
        """判断URL是否为播放页面而非音频文件

        Returns:
            True: 播放页面（需要进一步提取）
            False: 音频文件直接链接
        """
        # 检查是否包含音频文件扩展名
        audio_extensions = ('.mp3', '.m4a', '.mp4', '.wav', '.ogg', '.opus', '.aac')
        if url.lower().endswith(audio_extensions):
            return False  # 是音频文件

        # 检查是否是已知的播放页面域名
        playback_domains = ['ximalaya.com', 'jt.ximalaya.com', 'qingting.fm', 'lizhi.fm']
        if any(domain in url for domain in playback_domains):
            # 如果URL路径不包含音频扩展名，很可能是播放页面
            return True

        # 检查URL路径模式
        if any(pattern in url for pattern in ['/episode/', '/audio/', '/play/', '/player/']):
            return True

        return False

    async def parse_episode(self, url: str) -> Dict:
        """
        解析小宇宙节目链接

        Args:
            url: 小宇宙节目链接

        Returns:
            包含音频和元数据的字典

        Raises:
            InvalidURLException: URL 格式无效
            Error403Exception: 反爬虫拦截
            Error404Exception: 节目不存在
            Error504Exception: 请求超时
        """
        try:
            # 1. 验证 URL
            if not self._validate_url(url):
                raise InvalidURLException(f"无效的小宇宙链接格式: {url}")

            episode_id = self._extract_episode_id(url)
            logger.info(f"开始解析节目 {episode_id}")

            # 2. 初始化浏览器
            await self.init_browser()

            # 3. 创建页面
            if self.page is None:
                self.page = await self.browser.new_page(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )

            # 4. 设置超时（增加到60秒）
            timeout_ms = 60000  # 60 秒

            # 5. 访问页面（使用 domcontentloaded 而不是 networkidle，更快）
            try:
                await self.page.goto(url, timeout=timeout_ms, wait_until="domcontentloaded")
                logger.debug(f"页面加载成功: {url}")
            except asyncio.TimeoutError:
                logger.error(f"访问页面超时: {url}")
                raise Error504Exception(f"访问页面超时: {url}")

            # 6. 检查是否被反爬虫拦截
            page_content = await self.page.content()
            if "访问过于频繁" in page_content or "请先登录" in page_content:
                logger.warning(f"被反爬虫拦截: {url}")
                raise Error403Exception("被反爬虫机制拦截，请稍后重试")

            # 7. 检查页面是否存在（404）
            if "页面不存在" in page_content or "404" in await self.page.title():
                logger.warning(f"节目不存在: {url}")
                raise Error404Exception(f"节目链接已失效或不存在: {url}")

            # 8. 提取数据
            # 等待页面完全加载（不等待特定元素）
            await self.page.wait_for_load_state("networkidle", timeout=timeout_ms)

            # 尝试从页面 JSON 数据中提取
            data = await self._extract_data_from_page()

            logger.info(f"节目解析成功: {episode_id}")
            return data

        except (InvalidURLException, Error403Exception, Error404Exception, Error504Exception):
            raise
        except Exception as e:
            logger.error(f"解析节目时发生未知错误: {str(e)}", exc_info=True)
            raise Error504Exception(f"解析失败: {str(e)}")

    async def parse_podcast_homepage(self, url: str, limit: int = 5, offset: int = 0) -> Dict:
        """
        解析小宇宙播客主页链接

        Args:
            url: 小宇宙播客主页链接

        Returns:
            包含播客信息和最新节目列表的字典

        Raises:
            InvalidURLException: URL 格式无效
            Error403Exception: 反爬虫拦截
            Error404Exception: 播客不存在
            Error504Exception: 请求超时
        """
        try:
            # 1. 验证 URL
            if not self._validate_url(url):
                raise InvalidURLException(f"无效的小宇宙链接格式: {url}")

            if not self._is_podcast_url(url):
                raise InvalidURLException(f"该链接不是播客主页链接: {url}")

            podcast_id = self._extract_podcast_id(url)
            logger.info(f"开始解析播客主页 {podcast_id}")

            # 2. 初始化浏览器
            await self.init_browser()

            # 3. 创建页面
            if self.page is None:
                self.page = await self.browser.new_page(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )

            # 4. 设置超时
            timeout_ms = 60000

            # 5. 访问页面
            try:
                await self.page.goto(url, timeout=timeout_ms, wait_until="domcontentloaded")
                logger.debug(f"播客主页加载成功: {url}")
            except asyncio.TimeoutError:
                logger.error(f"访问播客主页超时: {url}")
                raise Error504Exception(f"访问播客主页超时: {url}")

            # 6. 检查反爬虫
            page_content = await self.page.content()
            if "访问过于频繁" in page_content or "请先登录" in page_content:
                logger.warning(f"被反爬虫拦截: {url}")
                raise Error403Exception("被反爬虫机制拦截，请稍后重试")

            # 7. 检查页面是否存在
            if "页面不存在" in page_content or "404" in await self.page.title():
                logger.warning(f"播客不存在: {url}")
                raise Error404Exception(f"播客链接已失效或不存在: {url}")

            # 8. 等待页面完全加载
            await self.page.wait_for_load_state("networkidle", timeout=timeout_ms)

            # 9. 提取播客信息
            podcast_data = await self._extract_podcast_data_from_page(limit, offset)

            logger.info(f"播客主页解析成功: {podcast_id}")
            return podcast_data

        except (InvalidURLException, Error403Exception, Error404Exception, Error504Exception):
            raise
        except Exception as e:
            logger.error(f"解析播客主页时发生未知错误: {str(e)}", exc_info=True)
            raise Error504Exception(f"解析失败: {str(e)}")

    async def _extract_podcast_data_from_page(self, limit: int = 5, offset: int = 0) -> Dict:
        """从播客主页提取数据

        Args:
            limit: 每页数量
            offset: 偏移量
        """
        try:
            # 从 __NEXT_DATA__ 中提取
            js_code = """
            () => {
                const nextDataScript = document.getElementById('__NEXT_DATA__');
                if (nextDataScript) {
                    try {
                        const data = JSON.parse(nextDataScript.textContent);
                        return { source: '__NEXT_DATA__', data };
                    } catch (e) {
                        console.error('解析 __NEXT_DATA__ 失败:', e);
                    }
                }
                return { source: 'failed', data: null };
            }
            """
            result = await self.page.evaluate(js_code)

            if result.get('source') == '__NEXT_DATA__':
                return await self._parse_podcast_next_data(result['data'], limit, offset)
            else:
                raise ValueError("无法从页面提取数据")

        except Exception as e:
            logger.error(f"提取播客数据失败: {str(e)}", exc_info=True)
            raise

    async def _parse_podcast_next_data(self, data: dict, limit: int = 5, offset: int = 0) -> Dict:
        """解析播客主页的 Next.js 数据

        Args:
            data: __NEXT_DATA__ 对象
            limit: 每页数量
            offset: 偏移量
        """
        try:
            # 从 __NEXT_DATA__ 中提取播客信息
            # 路径: props.pageProps.podcast
            podcast_info = data.get('props', {}).get('pageProps', {}).get('podcast', {})

            if not podcast_info:
                # 尝试其他可能的路径
                podcast_info = data.get('props', {}).get('pageProps', {}).get('podcastData', {})

            if not podcast_info:
                raise ValueError("播客数据为空")

            # 提取播客基本信息
            podcast_id = podcast_info.get('id') or podcast_info.get('pid', '')
            podcast_name = podcast_info.get('title') or podcast_info.get('name', '')
            podcast_description = podcast_info.get('description') or podcast_info.get('intro', '')

            # 提取主播信息
            host_name = ""
            if 'podcasters' in podcast_info and podcast_info['podcasters']:
                host_name = podcast_info['podcasters'][0].get('name') or podcast_info['podcasters'][0].get('nickname', '')
            elif 'author' in podcast_info:
                host_name = podcast_info['author']

            # 提取封面图（logo）
            logo_field = podcast_info.get('image') or podcast_info.get('cover') or podcast_info.get('logo')
            if isinstance(logo_field, dict):
                podcast_logo = (
                    logo_field.get('picUrl') or
                    logo_field.get('largePicUrl') or
                    logo_field.get('middlePicUrl') or
                    logo_field.get('smallPicUrl') or
                    ''
                )
            elif isinstance(logo_field, str):
                podcast_logo = logo_field
            else:
                podcast_logo = ''

            # 提取最新 N 集节目（支持分页）
            episodes_data = podcast_info.get('episodes', [])
            latest_episodes = []

            # 应用分页
            start_idx = offset
            end_idx = min(offset + limit, len(episodes_data))

            for ep in episodes_data[start_idx:end_idx]:
                episode_info = {
                    "episode_id": ep.get('id') or ep.get('eid') or ep.get('episode_id', ''),
                    "episode_title": ep.get('title') or ep.get('episode_title', ''),
                    "audio_url": ep.get('enclosure', {}).get('url') or ep.get('audio_url') or ep.get('url', ''),
                    "duration": ep.get('duration') or 0,
                    "cover_image": "",
                    "show_notes": ep.get('shownotes') or ep.get('show_notes') or ep.get('description', ''),
                    "created_at": ep.get('created_at') or ep.get('pubdate') or ep.get('publish_date', ''),
                }

                # 提取单集封面图
                episode_image = ep.get('image') or ep.get('cover')
                if isinstance(episode_image, dict):
                    episode_info["cover_image"] = (
                        episode_image.get('picUrl') or
                        episode_image.get('largePicUrl') or
                        episode_image.get('middlePicUrl') or
                        podcast_logo  # 如果单集没有封面，使用播客logo
                    )
                elif isinstance(episode_image, str):
                    episode_info["cover_image"] = episode_image
                else:
                    episode_info["cover_image"] = podcast_logo

                latest_episodes.append(episode_info)

            logger.info(f"从 __NEXT_DATA__ 成功提取播客数据: {podcast_name}")
            logger.info(f"提取到第 {offset + 1}-{end_idx} 集，共 {len(latest_episodes)} 集")

            return {
                "podcast_id": podcast_id,
                "podcast_name": podcast_name,
                "host_name": host_name,
                "description": podcast_description,
                "logo": podcast_logo,
                "episodes": latest_episodes,
                "total_episodes": len(episodes_data)
            }

        except Exception as e:
            logger.error(f"解析播客 __NEXT_DATA__ 失败: {str(e)}")
            raise

    async def _extract_data_from_page(self) -> Dict:
        """从页面提取数据"""
        try:
            # 方法1: 从 Next.js 的 __NEXT_DATA__ 中提取（小宇宙使用 Next.js）
            js_code = """
            () => {
                // 1. 尝试从 __NEXT_DATA__ 获取
                const nextDataScript = document.getElementById('__NEXT_DATA__');
                if (nextDataScript) {
                    try {
                        const data = JSON.parse(nextDataScript.textContent);
                        return { source: '__NEXT_DATA__', data };
                    } catch (e) {
                        console.error('解析 __NEXT_DATA__ 失败:', e);
                    }
                }

                // 2. 从 meta 标签获取
                const metaTags = {};
                document.querySelectorAll('meta').forEach(tag => {
                    const property = tag.getAttribute('property') || tag.getAttribute('name');
                    const content = tag.getAttribute('content');
                    if (property && content) {
                        metaTags[property] = content;
                    }
                });

                return { source: 'metaTags', data: metaTags };
            }
            """
            result = await self.page.evaluate(js_code)
            logger.debug(f"数据提取来源: {result.get('source')}")

            # 根据数据来源解析
            if result.get('source') == '__NEXT_DATA__':
                return await self._parse_next_data(result['data'])
            else:
                return await self._parse_meta_tags(result['data'])

        except Exception as e:
            logger.error(f"提取页面数据失败: {str(e)}", exc_info=True)
            # 使用最后的备用方案
            return await self._extract_data_fallback()

    async def _parse_next_data(self, data: dict) -> Dict:
        """解析 Next.js 数据"""
        try:
            # 从 __NEXT_DATA__ 中提取节目信息
            # 路径: props.pageProps.episode
            episode = data.get('props', {}).get('pageProps', {}).get('episode', {})

            if not episode:
                raise ValueError(" episode 数据为空")

            # 🔍 调试：打印所有可用字段
            logger.info(f"📊 episode 对象的所有键: {list(episode.keys())}")
            logger.info(f"📊 episode.get('enclosure'): {episode.get('enclosure')}")
            logger.info(f"📊 episode.get('audio_url'): {episode.get('audio_url')}")
            logger.info(f"📊 episode.get('url'): {episode.get('url')}")

            # 检查是否有其他可能包含音频URL的字段
            for key in episode.keys():
                value = episode.get(key)
                if isinstance(value, str) and ('http' in value and ('mp3' in value or 'm4a' in value or 'mp4' in value)):
                    logger.info(f"✅ 发现可能包含音频URL的字段: {key} = {value}")

            # 提取音频 URL（从多个可能的字段中查找）
            audio_url = (
                episode.get('enclosure', {}).get('url') or  # 新的数据结构
                episode.get('audio_url') or
                episode.get('url')
            )
            if not audio_url:
                raise ValueError("无法找到音频 URL")

            # 🔍 检测是否是播放页面而非音频文件
            if self._is_playback_page(audio_url):
                logger.warning(f"⚠️ audio_url 指向播放页面而非音频文件: {audio_url}")
                logger.info(f"🔄 尝试从播放页面提取真实音频URL...")

                # 尝试从当前页面中直接提取音频URL
                real_audio_url = await self._extract_audio_url_from_scripts()
                if real_audio_url and not self._is_playback_page(real_audio_url):
                    logger.info(f"✅ 成功提取真实音频URL: {real_audio_url}")
                    audio_url = real_audio_url
                else:
                    logger.warning(f"❌ 无法从页面提取音频URL，使用原URL（可能导致转录失败）")
            else:
                logger.info(f"✅ audio_url 是有效的音频文件URL: {audio_url}")

            # 提取其他信息
            title = episode.get('title') or episode.get('episode_title', '')
            podcast_name = episode.get('podcast', {}).get('title') or episode.get('podcast_name', '')

            # 提取 podcast_id - 尝试多个可能的字段
            podcast_obj = episode.get('podcast', {})
            podcast_id = (
                podcast_obj.get('id') or
                podcast_obj.get('pid') or
                podcast_obj.get('podcast_id') or
                podcast_obj.get('base_id') or
                episode.get('podcast_id') or
                episode.get('pid') or
                ''
            )

            # 调试日志
            logger.info(f"提取 podcast_id: {podcast_id}")
            if podcast_obj:
                logger.info(f"episode.get('podcast') keys: {list(podcast_obj.keys())}")
                logger.info(f"podcast_obj 内容: {podcast_obj}")

            # 提取封面图（image 可能是字典或字符串）
            image_field = episode.get('image')
            if isinstance(image_field, dict):
                # 优先使用原图，其次大图、中图、缩略图
                cover_image = (
                    image_field.get('picUrl') or
                    image_field.get('largePicUrl') or
                    image_field.get('middlePicUrl') or
                    image_field.get('smallPicUrl') or
                    image_field.get('thumbnailUrl') or
                    ''
                )
            elif isinstance(image_field, str):
                cover_image = image_field
            else:
                cover_image = (
                    episode.get('image_url') or
                    episode.get('cover_image') or
                    episode.get('coverUrl') or
                    episode.get('cover') or
                    episode.get('thumbnail') or
                    ''
                )

            # ✅ 优先使用 shownotes（HTML格式），其次使用 description（纯文本）
            show_notes = episode.get('shownotes') or episode.get('show_notes') or episode.get('description', '')

            duration = episode.get('duration') or 0

            logger.info(f"从 __NEXT_DATA__ 成功提取数据: {title}")
            logger.info(f"shownotes 长度: {len(show_notes)}, 包含HTML: {'<' in show_notes}, 前50字符: {show_notes[:50]}")

            episode_id = self._extract_episode_id(self.page.url)
            return {
                "episode_id": episode_id,
                "podcast_id": podcast_id,  # 添加 podcast_id
                "audio_url": audio_url,
                "duration": duration,
                "cover_image": cover_image,
                "show_notes": show_notes,
                "episode_title": title,
                "podcast_name": podcast_name
            }

        except Exception as e:
            logger.error(f"解析 __NEXT_DATA__ 失败: {str(e)}")
            raise

    async def _parse_meta_tags(self, meta: dict) -> Dict:
        """解析 meta 标签数据"""
        try:
            # 从 meta 标签提取
            audio_url = meta.get('og:audio') or meta.get('audio')
            title = meta.get('og:title') or ''
            image = meta.get('og:image') or ''
            description = meta.get('og:description') or meta.get('description') or ''

            # 如果还是没有音频URL，尝试从 script 标签中查找
            if not audio_url:
                audio_url = await self._extract_audio_url_from_scripts()

            if not audio_url:
                raise ValueError("无法提取音频 URL")

            episode_id = self._extract_episode_id(self.page.url)

            return {
                "episode_id": episode_id,
                "audio_url": audio_url,
                "duration": 0,  # meta 标签可能不提供时长
                "cover_image": image,
                "show_notes": description,
                "episode_title": title,
                "podcast_name": ""  # meta 标签可能不提供播客名称
            }
        except Exception as e:
            logger.error(f"解析 meta 标签失败: {str(e)}")
            raise

    async def _extract_audio_url_from_scripts(self) -> Optional[str]:
        """从 script 标签中提取音频 URL"""
        try:
            # 获取所有 script 标签的内容
            scripts = await self.page.query_selector_all('script')
            for script in scripts:
                text = await script.inner_text()
                # 查找包含 .mp3 的 URL
                match = re.search(r'https?://[^\s"\'<>]+\.mp3[^\s"\'<>]*', text)
                if match:
                    return match.group(0)
            return None
        except Exception as e:
            logger.debug(f"从 scripts 提取音频 URL 失败: {str(e)}")
            return None

    async def _extract_data_fallback(self) -> Dict:
        """备用数据提取方法"""
        logger.warning("使用备用数据提取方法")

        # 提取页面标题
        title = await self.page.title()
        # 提取描述
        description = await self.page.evaluate("""
            () => {
                const desc = document.querySelector('meta[name="description"]');
                return desc ? desc.getAttribute('content') : '';
            }
        """)

        # 提取封面图
        image = await self.page.evaluate("""
            () => {
                const img = document.querySelector('meta[property="og:image"]');
                return img ? img.getAttribute('content') : '';
            }
        """)

        # 提取音频 URL（最关键）
        audio_url = await self._extract_audio_url_from_scripts()

        if not audio_url:
            # 尝试从 audio 标签获取
            audio_url = await self.page.evaluate("""
                () => {
                    const audio = document.querySelector('audio');
                    return audio ? audio.src : '';
                }
            """)

        if not audio_url:
            raise ValueError("无法提取音频 URL")

        episode_id = self._extract_episode_id(self.page.url)

        return {
            "episode_id": episode_id,
            "audio_url": audio_url,
            "duration": 0,  # 默认值，后续可能需要从音频文件本身获取
            "cover_image": image,
            "show_notes": description,
            "episode_title": title,
            "podcast_name": ""  # 备用方法可能无法获取
        }


# 全局爬虫实例
crawler = XiaoyuzhouCrawler()
