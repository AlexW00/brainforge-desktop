import { FolderOpenIcon, Globe, HomeIcon } from 'lucide-react'

export type View<T extends ViewName> = {
  name: T
  props: ViewProps[T]
}

export type ViewHistory = Array<View<ViewName>>

export const DEFAULT_VIEWS = new Map<ViewName, View<ViewName>>([
  ['home', { name: 'home', props: {} }],
  ['files', { name: 'files', props: { path: '~' } }],
  ['browser', { name: 'browser', props: { url: 'https://google.com' } }]
])

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

export const ViewIcons = {
  browser: Globe,
  files: FolderOpenIcon,
  home: HomeIcon
}
