import { memo } from 'react'

import Section from '../../components/Section'
import MaxDownloadNum from './MaxDownloadNum'
import AutoSwitchSource from './AutoSwitchSource'
import FileName from './FileName'
import EmbedContent from './EmbedContent'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_download')}>
      <MaxDownloadNum />
      <AutoSwitchSource />
      <FileName />
      <EmbedContent />
    </Section>
  )
})

