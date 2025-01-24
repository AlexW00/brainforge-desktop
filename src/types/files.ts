// File system types
export interface FileEntry {
  name: string
  type: 'file' | 'folder'
  path: string
  mimeType: string
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
}

export interface FileSystemAPI {
  getHomePath: () => Promise<string>
  readDir: (path: string) => Promise<Array<FileEntry>>
  joinPath: (...paths: string[]) => Promise<string>
  watchFiles: (path: string, options: FileWatcherOptions) => Promise<FileWatcher>
  unwatchFiles: (watcher: string) => Promise<void>
  getStats: (path: string) => Promise<FileStats>
  getFileContent: (path: string) => Promise<string>
  readFile: (path: string) => Promise<string>
}

export interface Node {
  path: string
  lastUpdated: number
  lastIndexed: number
}

export interface File extends Node {
  type: 'file'
  data: Record<string, unknown>
  mimeType: string
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
