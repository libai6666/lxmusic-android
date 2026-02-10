/**
 * 默认音乐源配置
 * 可以在此添加或修改预设的音乐源 URL
 */

export interface DefaultMusicSource {
  name: string
  url: string
}

const defaultMusicSources: DefaultMusicSource[] = [
  {
    name: '音乐源1',
    url: 'https://ghproxy.net/raw.githubusercontent.com/pdone/lx-music-source/main/lx/latest.js',
  },
  {
    name: '音乐源2',
    url: 'https://ghproxy.net/raw.githubusercontent.com/pdone/lx-music-source/main/juhe/latest.js',
  },
  {
    name: '音乐源3',
    url: 'https://raw.githubusercontent.com/pdone/lx-music-source/main/flower/latest.js',
  },
]

export default defaultMusicSources
