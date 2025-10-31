git# 下载功能 - 封面和歌词嵌入说明

## 📋 当前实现

### ✅ 已完成功能

当前版本采用**外部文件方式**保存封面和歌词：

```
/storage/emulated/0/Music/LXMusic/
├── 歌曲名 - 歌手.mp3    <- 音频文件
├── 歌曲名 - 歌手.jpg    <- 封面图片（如果启用）
└── 歌曲名 - 歌手.lrc    <- 歌词文件（如果启用）
```

**优点**：
- ✅ 纯 JavaScript 实现，无需原生模块
- ✅ 兼容所有音乐播放器（大多数播放器都会自动加载同名的 `.jpg` 和 `.lrc` 文件）
- ✅ 易于编辑和替换
- ✅ 文件大小不变（音频文件本身不增大）
- ✅ 下载速度快（不需要等待元数据处理）
- ✅ 页面响应流畅（异步处理，不阻塞主线程）

---

## 🚧 直接嵌入到音频文件（需要原生模块）

### 为什么当前无法直接嵌入？

**直接修改音频文件的 ID3 标签**需要：
- Android: Java/Kotlin 的 `jaudiotagger` 库
- iOS: Swift/Objective-C 的 AVFoundation

React Native 的 JavaScript 层**无法直接操作二进制文件的元数据**。

---

### 🔧 实现方案（需要原生开发）

如果你确实需要直接嵌入到音频文件，需要开发原生模块：

#### **Android 原生模块实现步骤**

1. **添加依赖**（`android/app/build.gradle`）：
```gradle
dependencies {
    implementation 'org.jaudiotagger:jaudiotagger:3.0.1'
}
```

2. **创建原生模块**（`android/app/src/main/java/.../ AudioTagModule.java`）：
```java
package cn.toside.music.mobile;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.images.ArtworkFactory;
import java.io.File;

public class AudioTagModule extends ReactContextBaseJavaModule {
    AudioTagModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "AudioTag";
    }

    @ReactMethod
    public void embedMetadata(String audioFilePath, String coverPath, String lyric, Promise promise) {
        try {
            File audioFile = new File(audioFilePath);
            AudioFile f = AudioFileIO.read(audioFile);
            Tag tag = f.getTagOrCreateAndSetDefault();

            // 嵌入封面
            if (coverPath != null && !coverPath.isEmpty()) {
                File coverFile = new File(coverPath);
                if (coverFile.exists()) {
                    tag.setField(ArtworkFactory.createArtworkFromFile(coverFile));
                }
            }

            // 嵌入歌词
            if (lyric != null && !lyric.isEmpty()) {
                tag.setField(FieldKey.LYRICS, lyric);
            }

            f.commit();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("EMBED_ERROR", e.getMessage());
        }
    }
}
```

3. **注册模块**（`android/app/src/main/java/.../MainApplication.java`）：
```java
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new ReactPackage() {
        @Override
        public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
            List<NativeModule> modules = new ArrayList<>();
            modules.add(new AudioTagModule(reactContext));
            return modules;
        }

        @Override
        public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
            return Collections.emptyList();
        }
    });
    return packages;
}
```

4. **在 TypeScript 中调用**：
```typescript
import { NativeModules } from 'react-native'

const { AudioTag } = NativeModules

// 使用
await AudioTag.embedMetadata(
  '/path/to/song.mp3',
  '/path/to/cover.jpg',
  'lyric content here'
)
```

---

### ⚠️ 注意事项

1. **文件格式限制**：
   - MP3: 支持 ID3v2 标签
   - FLAC: 支持 Vorbis Comments
   - M4A/AAC: 支持 iTunes 标签
   - WAV/APE: 支持有限

2. **性能影响**：
   - 嵌入操作需要重写整个音频文件
   - 会增加下载完成的等待时间
   - 可能导致 UI 卡顿（需要在后台线程处理）

3. **文件大小**：
   - 封面图片会增加文件大小（通常 50KB - 500KB）
   - 歌词较小（通常 < 10KB）

---

## 🎯 建议

### 当前实现已经足够好用：
- ✅ 大多数音乐播放器都能识别外部封面和歌词文件
- ✅ 不影响下载速度和性能
- ✅ 易于管理和更新

### 如果确实需要嵌入功能：
1. 可以先使用当前的外部文件方式
2. 后续再开发原生模块作为**可选功能**
3. 在设置中添加选项：
   - ⭕ 保存为独立文件（默认，快速）
   - ⭕ 嵌入到音频文件（需要原生模块）

---

## 📱 测试建议

1. **重启应用**（完全重启）
2. **测试下载**并观察：
   - 下载速度是否正常
   - UI 是否流畅（点击页面有响应）
   - 封面和歌词文件是否生成
3. **用其他播放器打开**下载的文件，验证封面和歌词是否显示

---

## 📞 技术支持

如果需要开发原生模块支持，建议：
1. 先在设置中添加开关选项
2. 保留当前的外部文件方式作为默认
3. 将原生模块作为高级功能（可选）

