import { useEffect, useRef, useState } from 'react'
import { useView } from '../../contexts/ViewContext'
import { BrowserNavigation } from '../composites/browser-navigation'

type ScanElement = {
  outerHtml: string
  textContent: string
  preciseText: string
  offset: number
}

const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString)
    return true
  } catch {
    return false
  }
}

const processUrl = (input: string): string => {
  // If it's already a valid URL, return it
  if (isValidUrl(input)) return input

  // If it starts with www. add https://
  if (input.startsWith('www.')) return `https://${input}`

  // If it's not a valid URL, treat it as a search query
  const searchQuery = encodeURIComponent(input)
  return `https://www.google.com/search?q=${searchQuery}`
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

  const handleNavigation = (url: string) => {
    const processedUrl = processUrl(url)
    setViewProp('url', processedUrl, true)
  }

  return (
    <div className="flex h-full flex-col">
      <BrowserNavigation
        url={view.props.url}
        onNavigate={handleNavigation}
        onRefresh={() => webviewRef.current?.reload()}
      />
      <webview ref={webviewRef} src={view.props.url} className="flex-1" />
    </div>
  )
}
