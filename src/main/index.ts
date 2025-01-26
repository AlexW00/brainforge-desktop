import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { lookup } from 'mime-types'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { v4 as uuidv4 } from 'uuid'

interface FileWatcher {
  watcher: FSWatcher
  window: BrowserWindow
}

const watchers = new Map<string, FileWatcher>()

let forgePickerWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null
let selectedForgePath: string | null = null

const STATE_DIR = join(homedir(), '.brainforge')
const STATE_FILE = join(STATE_DIR, 'state.json')

interface AppState {
  recentForges: string[]
  lastActiveForge: string | null
}

async function ensureStateDir(): Promise<void> {
  try {
    await mkdir(STATE_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create state directory:', error)
  }
}

async function loadState(): Promise<AppState> {
  try {
    const data = await readFile(STATE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { recentForges: [], lastActiveForge: null }
  }
}

async function saveState(state: AppState): Promise<void> {
  try {
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2))
  } catch (error) {
    console.error('Failed to save state:', error)
  }
}

function createForgePickerWindow(): void {
  forgePickerWindow = new BrowserWindow({
    width: 480,
    height: 400,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#ffffff',
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../build/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  forgePickerWindow.on('ready-to-show', () => {
    forgePickerWindow?.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    forgePickerWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/forge-picker`)
  } else {
    forgePickerWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: 'forge-picker'
    })
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
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
app.whenReady().then(async () => {
  await ensureStateDir()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Register all IPC handlers first
  ipcMain.handle('getHomePath', () => {
    return selectedForgePath || homedir()
  })

  ipcMain.handle('getRecentForges', async () => {
    const state = await loadState()
    return state.recentForges
  })

  ipcMain.handle('selectForge', async (_, path: string) => {
    console.log('Selecting forge path:', path)
    selectedForgePath = path
    const state = await loadState()
    const recentForges = [path, ...state.recentForges.filter((p) => p !== path)].slice(0, 10)
    await saveState({ ...state, recentForges, lastActiveForge: path })

    try {
      await stat(path)
    } catch (error) {
      console.error('Error accessing selected forge path:', error)
      throw new Error(`Cannot access selected directory: ${path}`)
    }

    // Close all existing windows
    BrowserWindow.getAllWindows().forEach((window) => window.close())

    // Create new main window
    createWindow()
  })

  ipcMain.handle('readDir', async (_, path: string) => {
    try {
      const entries = await readdir(path, { withFileTypes: true })
      return entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'folder' : 'file',
        path: join(path, entry.name),
        mimeType: entry.isDirectory() ? 'folder' : lookup(entry.name) || 'application/octet-stream'
      }))
    } catch (error) {
      console.error('Error reading directory:', error)
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Directory not found: ${path}`)
      }
      throw error
    }
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

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!canceled && filePaths.length > 0) {
      return filePaths[0]
    }
    return null
  })

  ipcMain.handle('openForgePicker', () => {
    createForgePickerWindow()
  })

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Now check for last active forge and create appropriate window
  const state = await loadState()
  if (state.lastActiveForge) {
    try {
      await stat(state.lastActiveForge)
      selectedForgePath = state.lastActiveForge
      createWindow()
    } catch {
      console.log('Last active forge no longer accessible')
      createForgePickerWindow()
    }
  } else {
    createForgePickerWindow()
  }
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
