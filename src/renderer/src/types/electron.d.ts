import type { FileWatcher, FileWatcherOptions } from '../../../types/files'

export interface API {
  getHomePath: () => Promise<string>
  readDir: (path: string) => Promise<Array<{ name: string; type: 'file' | 'folder'; path: string }>>
  joinPath: (...paths: string[]) => Promise<string>
  getStats: (path: string) => Promise<{ isDirectory: boolean; isFile: boolean; mtime: number }>
  getRecentForges: () => Promise<string[]>
  selectForge: (path: string) => Promise<void>
  openForgePicker: () => Promise<void>
  openDirectory: () => Promise<string | null>
  watchFiles: (path: string, options: FileWatcherOptions) => Promise<FileWatcher>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
}

declare global {
  interface Window {
    api: API
  }
}
