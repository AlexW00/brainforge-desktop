import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { app, BrowserWindow, ipcMain } from 'electron'
import { lookup } from 'mime-types'
import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { v4 as uuidv4 } from 'uuid'

interface FileWatcher {
  watcher: FSWatcher
  window: BrowserWindow
}

const watchers = new Map<string, FileWatcher>()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../build/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('will-attach-webview', (_e, webPreferences) => {
    webPreferences.preload = join(__dirname, '../preload/webviewPreload.js')
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers
  ipcMain.handle('getHomePath', () => {
    return homedir()
  })

  ipcMain.handle('readDir', async (_, path: string) => {
    const entries = await readdir(path, { withFileTypes: true })
    return entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'folder' : 'file',
      path: join(path, entry.name),
      mimeType: entry.isDirectory()
        ? 'inode/directory'
        : lookup(entry.name) || 'application/octet-stream'
    }))
  })

  ipcMain.handle('joinPath', (_, ...paths: string[]) => {
    return join(...paths)
  })

  ipcMain.handle('watchFiles', async (event, path: string) => {
    const watcherId = uuidv4()
    const window = BrowserWindow.fromWebContents(event.sender)!

    const watcher = chokidar.watch(path, {
      persistent: true,
      ignoreInitial: true
    })

    watcher
      .on('add', (path) => {
        window.webContents.send('fileEvent', { type: 'add', watcherId, path })
      })
      .on('addDir', (path) => {
        window.webContents.send('fileEvent', { type: 'add', watcherId, path })
      })
      .on('change', (path) => {
        window.webContents.send('fileEvent', { type: 'change', watcherId, path })
      })
      .on('unlink', (path) => {
        window.webContents.send('fileEvent', { type: 'unlink', watcherId, path })
      })
      .on('unlinkDir', (path) => {
        window.webContents.send('fileEvent', { type: 'unlink', watcherId, path })
      })

    watchers.set(watcherId, { watcher, window })
    return watcherId
  })

  ipcMain.handle('unwatchFiles', async (_, watcherId: string) => {
    const watcher = watchers.get(watcherId)
    if (watcher) {
      await watcher.watcher.close()
      watchers.delete(watcherId)
    }
  })

  ipcMain.handle('getStats', async (_, path: string) => {
    const stats = await stat(path)
    return {
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      mtime: stats.mtime.getTime()
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up file watchers when quitting
app.on('before-quit', async () => {
  for (const { watcher } of watchers.values()) {
    await watcher.close()
  }
  watchers.clear()
})
