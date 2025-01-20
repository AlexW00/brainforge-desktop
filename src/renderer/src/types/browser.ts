export interface BrowserNavigationProps {
  url: string
  onNavigate: (url: string) => void
  onRefresh: () => void
}

export interface BrowserViewProps {
  url: string
  webviewRef: React.RefObject<Electron.WebviewTag>
}
