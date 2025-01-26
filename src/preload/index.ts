import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { FileWatcher, FileWatcherOptions } from '../types/files'

// Custom APIs for renderer
const api = {
  getHomePath: () => ipcRenderer.invoke('getHomePath'),
  readDir: (path: string) => ipcRenderer.invoke('readDir', path),
  joinPath: (...paths: string[]) => ipcRenderer.invoke('joinPath', ...paths),
  getStats: (path: string) => ipcRenderer.invoke('getStats', path),
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
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => {
          const validChannels = [
            'getHomePath',
            'readDir',
            'joinPath',
            'watchFiles',
            'unwatchFiles',
            'getStats',
            'getRecentForges',
            'selectForge',
            'dialog:openDirectory'
          ]
          if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args)
          }
          throw new Error(`Invalid channel: ${channel}`)
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
