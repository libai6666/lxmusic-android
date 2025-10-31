import { memo } from 'react'

import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import CheckBoxItem from '../../components/CheckBoxItem'
import SubTitle from '../../components/SubTitle'

export default memo(() => {
  const t = useI18n()
  const embedCover = useSettingValue('download.embedCover')
  const embedLyric = useSettingValue('download.embedLyric')
  const embedLyricTranslation = useSettingValue('download.embedLyricTranslation')
  const embedLyricRoma = useSettingValue('download.embedLyricRoma')

  const handleCoverChange = (value: boolean) => {
    updateSetting({ 'download.embedCover': value })
  }

  const handleLyricChange = (value: boolean) => {
    updateSetting({ 'download.embedLyric': value })
  }

  const handleLyricTranslationChange = (value: boolean) => {
    updateSetting({ 'download.embedLyricTranslation': value })
  }

  const handleLyricRomaChange = (value: boolean) => {
    updateSetting({ 'download.embedLyricRoma': value })
  }

  return (
    <SubTitle title={t('download_config_embed_content')}>
      <CheckBoxItem
        check={embedCover}
        onChange={handleCoverChange}
        label={t('download_config_embed_cover')}
      />
      <CheckBoxItem
        check={embedLyric}
        onChange={handleLyricChange}
        label={t('download_config_embed_lyric')}
      />
      {embedLyric && (
        <>
          <CheckBoxItem
            check={embedLyricTranslation}
            onChange={handleLyricTranslationChange}
            label={t('download_config_embed_lyric_translation')}
          />
          <CheckBoxItem
            check={embedLyricRoma}
            onChange={handleLyricRomaChange}
            label={t('download_config_embed_lyric_roma')}
          />
        </>
      )}
    </SubTitle>
  )
})

