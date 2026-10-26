import { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { useApp } from '../../context/AppContext'

export default function ProtectedImage({ src, alt = '', ...props }) {
  const { t } = useApp()
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!src) return
    let objectUrl
    let active = true
    apiClient.get(src, { responseType: 'blob' }).then(response => {
      objectUrl = URL.createObjectURL(response.data)
      if (active) setUrl(objectUrl)
    }).catch(() => { if (active) setUrl('') })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [src])
  return url ? <img src={url} alt={alt} {...props}/> : <span className="photo-loading" aria-label={t('Loading photo')} />
}
