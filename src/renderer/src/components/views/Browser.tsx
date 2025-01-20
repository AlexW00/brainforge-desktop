import { useEffect, useRef, useState } from 'react'
import { useView } from '../../contexts/ViewContext'
import { BrowserNavigation } from '../composites/browser-navigation'

type ScanElement = {
  outerHtml: string
  textContent: string
  preciseText: string
  offset: number
}

export function BrowserView() {
  const { view, setViewProp, goBack, goForward } = useView<'browser'>()
  const webviewRef = useRef<Electron.WebviewTag>(null)
  const [scanElement, setScanElement] = useState<ScanElement | null>(null)

  useEffect(() => {
    if (!view.props.url) {
      setViewProp('url', 'https://google.com', false)
    }
  }, [])

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleWillNavigate = (e: { preventDefault: () => void; url: string }) => {
      e.preventDefault()
      const targetUrl = e.url
      if (targetUrl !== webview.src) {
        webview.src = targetUrl
        setViewProp('url', targetUrl, true)
      }
    }

    const handleIpcMessage = (event: Electron.IpcMessageEvent) => {
      // Handle messages from the webview
      console.log('Received ipc message:', event.channel, event.args)
      if (event.channel === 'navigation-event') {
        const { type } = event.args[0]
        if (type === 'back') {
          goBack()
        } else if (type === 'forward') {
          goForward()
        }
      } else if (event.channel === 'scan-element') {
        const newScanElement = event.args[0] as ScanElement
        if (newScanElement !== scanElement) {
          alert(JSON.stringify(newScanElement))
          setScanElement(newScanElement)
        }
      }
    }

    webview.addEventListener('will-navigate', handleWillNavigate)
    webview.addEventListener('ipc-message', handleIpcMessage)

    return () => {
      webview.removeEventListener('will-navigate', handleWillNavigate)
      webview.removeEventListener('ipc-message', handleIpcMessage)
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      <BrowserNavigation
        url={view.props.url}
        onNavigate={(url) => setViewProp('url', url, true)}
        onRefresh={() => webviewRef.current?.reload()}
      />
      <webview ref={webviewRef} src={view.props.url} className="flex-1" />
    </div>
  )
}
