declare namespace LX {
  namespace Download {
    // 下载任务状态
    type DownloadTaskStatus = 'run'      // 正在下载
    | 'waiting'   // 等待下载
    | 'pause'     // 已暂停
    | 'error'     // 下载错误
    | 'completed' // 已完成

    // 支持的音频文件扩展名
    type FileExt = 'mp3' | 'flac' | 'wav' | 'ape' | 'm4a'

    // 下载进度信息
    interface ProgressInfo {
      progress: number      // 进度百分比 (0-1)
      speed: string         // 下载速度文本 (如 "1.2 MB/s")
      downloaded: number    // 已下载字节数
      total: number         // 总字节数
    }

    // 下载任务动作基类
    interface DownloadTaskActionBase <A> {
      action: A
    }
    interface DownloadTaskActionData<A, D> extends DownloadTaskActionBase<A> {
      data: D
    }
    type DownloadTaskAction<A, D = undefined> = D extends undefined ? DownloadTaskActionBase<A> : DownloadTaskActionData<A, D>

    // 下载任务动作类型集合
    type DownloadTaskActions = DownloadTaskAction<'start'>
    | DownloadTaskAction<'complete'>
    | DownloadTaskAction<'pause'>
    | DownloadTaskAction<'resume'>
    | DownloadTaskAction<'cancel'>
    | DownloadTaskAction<'refreshUrl'>
    | DownloadTaskAction<'statusText', string>
    | DownloadTaskAction<'progress', ProgressInfo>
    | DownloadTaskAction<'error', {
      error?: string
      message?: string
    }>

    // 下载列表项
    interface ListItem {
      id: string                      // 任务唯一ID
      isComplate: boolean             // 是否完成
      status: DownloadTaskStatus      // 任务状态
      statusText: string              // 状态文本描述
      downloaded: number              // 已下载字节数
      total: number                   // 总字节数
      progress: number                // 进度 (0-1)
      speed: string                   // 下载速度文本
      startTime: number               // 开始下载时间戳
      finishTime?: number             // 完成时间戳
      metadata: {
        musicInfo: LX.Music.MusicInfoOnline  // 音乐信息
        url: string | null                   // 下载URL
        quality: LX.Quality                  // 音质
        ext: FileExt                         // 文件扩展名
        fileName: string                     // 文件名
        filePath: string                     // 文件完整路径
      }
      // 下载任务控制
      jobId?: number                  // react-native-fs的任务ID
      retryCount?: number             // 重试次数
    }

    // 保存下载音乐信息
    interface SaveDownloadMusicInfo {
      list: ListItem[]
      addMusicLocationType: LX.AddMusicLocationType
    }

    // 下载配置
    interface DownloadConfig {
      maxDownloadNum: number          // 最大同时下载数量
      savePath: string                // 保存路径
      fileName: '歌名 - 歌手' | '歌手 - 歌名' | '歌名'  // 文件命名格式
      downloadQuality: LX.Quality     // 下载音质
    }
  }
}
