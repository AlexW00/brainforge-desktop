import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { FileWatcher, FileWatcherOptions } from '../types/files'

// Custom APIs for renderer
const api = {
  getHomePath: () => ipcRenderer.invoke('getHomePath'),
  readDir: (path: string) => ipcRenderer.invoke('readDir', path),
  joinPath: (...paths: string[]) => ipcRenderer.invoke('joinPath', ...paths),
  getStats: (path: string) => ipcRenderer.invoke('getStats', path),
  getRecentForges: () => ipcRenderer.invoke('getRecentForges'),
  selectForge: (path: string) => ipcRenderer.invoke('selectForge', path),
  openForgePicker: () => ipcRenderer.invoke('openForgePicker'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readFile: (path: string) => ipcRenderer.invoke('readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('writeFile', path, content),
  mkdir: (path: string) => ipcRenderer.invoke('mkdir', path),
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename', oldPath, newPath),
  deleteFile: (path: string) => ipcRenderer.invoke('deleteFile', path),
  watchFiles: async (path: string, options: FileWatcherOptions): Promise<FileWatcher> => {
    const watcherId = await ipcRenderer.invoke('watchFiles', path)

    // Set up event listeners for this watcher
    const eventHandler = (
      _event: IpcRendererEvent,
      data: { type: 'add' | 'change' | 'unlink'; watcherId: string; path: string }
    ) => {
      if (data.watcherId !== watcherId) return

      if (data.type === 'add') options.onAdd(data.path)
      else if (data.type === 'change') options.onChange(data.path)
      else if (data.type === 'unlink') options.onUnlink(data.path)
    }

    ipcRenderer.on('fileEvent', eventHandler)

    return {
      id: watcherId,
      stop: async () => {
        ipcRenderer.removeListener('fileEvent', eventHandler)
        await ipcRenderer.invoke('unwatchFiles', watcherId)
      }
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
