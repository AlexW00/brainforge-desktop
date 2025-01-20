export interface BrowserViewProps {
  url: string
}

export interface FilesViewProps {
  path: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HomeViewProps {}

export type ViewProps = {
  browser: BrowserViewProps
  files: FilesViewProps
  home: HomeViewProps
}

export type ViewName = keyof ViewProps
