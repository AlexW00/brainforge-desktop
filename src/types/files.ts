// File system types
export interface FileEntry {
  name: string
  type: 'file' | 'folder'
  path: string
  mimeType?: string
}

export interface FileWatcherOptions {
  recursive: boolean
  onAdd: (path: string) => void
  onUnlink: (path: string) => void
  onChange: (path: string) => void
}

export interface FileWatcher {
  id: string
  stop: () => Promise<void>
}

export interface FileStats {
  isDirectory: boolean
  isFile: boolean
  mtime: number
  mimeType: string
}

export interface FileSystemAPI {
  getHomePath: () => Promise<string>
  readDir: (
    path: string
  ) => Promise<Array<{ name: string; type: 'file' | 'folder'; path: string; mimeType: string }>>
  joinPath: (...paths: string[]) => Promise<string>
  getStats: (
    path: string
  ) => Promise<{ isDirectory: boolean; isFile: boolean; mtime: number; mimeType: string }>
  getRecentForges: () => Promise<string[]>
  selectForge: (path: string) => Promise<void>
  openForgePicker: () => Promise<void>
  openDirectory: () => Promise<string | null>
  watchFiles: (path: string, options: FileWatcherOptions) => Promise<FileWatcher>
  unwatchFiles: (watcher: string) => Promise<void>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  mkdir: (path: string) => Promise<void>
  rename: (oldPath: string, newPath: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
}

export interface Node {
  path: string
  lastUpdated: number
  lastIndexed: number
}

export interface File extends Node {
  type: 'file'
  mimeType: string
  data: Record<string, unknown>
}

export interface Folder extends Node {
  type: 'folder'
  children: Record<string, FileSystemNode>
}

export type FileSystemNode = File | Folder

export interface FileCache {
  root: Folder | null
  isInitialized: boolean
  getNode: (path: string) => FileSystemNode | null
  listDirectory: (path: string) => FileSystemNode[]
  updateNode: (path: string, updates: Partial<FileSystemNode>) => void
  removeNode: (path: string) => void
  addNode: (node: FileSystemNode) => void
  initialize: (rootPath: string) => Promise<void>
}
