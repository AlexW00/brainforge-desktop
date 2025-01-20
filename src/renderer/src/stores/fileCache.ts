import { create } from 'zustand'
import type { File, FileCache, FileSystemNode, FileWatcher, Folder } from '../../../types/files'

interface FileCacheState extends FileCache {
  watcher: FileWatcher | null
}

export const useFileCacheStore = create<FileCacheState>((set, get) => ({
  root: null,
  isInitialized: false,
  watcher: null,

  getNode: (path: string) => {
    const { root } = get()
    if (!root) return null
    if (path === '') return null
    if (path === root.path) return root
    if (path.startsWith(root.path)) {
      const pathWithoutRoot = path.replace(root.path, '')
      const segments = pathWithoutRoot.split('/').filter(Boolean)
      let current: FileSystemNode = root
      for (const segment of segments) {
        if (current.type !== 'folder') return null
        const next = current.children[segment]
        if (!next) return null
        current = next
      }
      return current
    }
    return null
  },

  listDirectory: (path: string) => {
    console.log('listDirectory', path)
    const node = get().getNode(path)
    console.log('node', node)
    if (!node || node.type !== 'folder') return []
    return Object.values(node.children)
  },

  updateNode: (path: string, updates: Partial<FileSystemNode>) => {
    const { root } = get()
    if (!root) return

    const parentPath = path.split('/').slice(0, -1).join('/')
    const fileName = path.split('/').pop()!

    const parent = get().getNode(parentPath)
    if (!parent || parent.type !== 'folder') return

    const existingNode = parent.children[fileName]
    if (!existingNode) return

    parent.children[fileName] = { ...existingNode, ...updates } as typeof existingNode
    set({ root: { ...root } })
    console.log('updateNode', path, updates)
  },

  removeNode: (path: string) => {
    const { root } = get()
    if (!root) return

    const parentPath = path.split('/').slice(0, -1).join('/')
    const fileName = path.split('/').pop()!

    const parent = get().getNode(parentPath)
    if (!parent || parent.type !== 'folder') return

    delete parent.children[fileName]
    set({ root: { ...root } })
    console.log('removeNode', path)
  },

  addNode: (node: FileSystemNode) => {
    const { root } = get()
    if (!root) return

    const parentPath = node.path.split('/').slice(0, -1).join('/')
    const fileName = node.path.split('/').pop()!

    const parent = get().getNode(parentPath)
    if (!parent || parent.type !== 'folder') return

    parent.children[fileName] = node
    set({ root: { ...root } })
    console.log('addNode', node)
  },

  initialize: async (rootPath: string) => {
    // Stop existing watcher if any
    const currentWatcher = get().watcher
    if (currentWatcher) {
      await currentWatcher.stop()
    }

    // Initialize root folder
    const now = Date.now()
    const root: Folder = {
      type: 'folder',
      path: rootPath,
      lastUpdated: now,
      lastIndexed: now,
      children: {}
    }

    // Start recursive file watching
    const watcher = await window.api.watchFiles(rootPath, {
      recursive: true,
      onAdd: async (path) => {
        const stats = await window.api.getStats(path)
        get().addNode(
          stats.isDirectory
            ? ({
                type: 'folder',
                path,
                lastUpdated: Date.now(),
                lastIndexed: Date.now(),
                children: {}
              } as Folder)
            : ({
                type: 'file',
                path,
                lastUpdated: Date.now(),
                lastIndexed: Date.now(),
                data: {}
              } as File)
        )
      },
      onChange: (path) =>
        get().updateNode(path, {
          lastUpdated: Date.now()
        }),
      onUnlink: (path) => get().removeNode(path)
    })

    // Initial file scan
    const scan = async (folder: Folder) => {
      const files = await window.api.readDir(folder.path)
      for (const file of files) {
        const fullPath = await window.api.joinPath(folder.path, file.name)
        if (file.type === 'folder') {
          const subFolder: Folder = {
            type: 'folder',
            path: fullPath,
            lastUpdated: now,
            lastIndexed: now,
            children: {}
          }
          folder.children[file.name] = subFolder
          await scan(subFolder)
        } else {
          folder.children[file.name] = {
            type: 'file',
            path: fullPath,
            lastUpdated: now,
            lastIndexed: now,
            data: {}
          } as File
        }
      }
    }

    await scan(root)
    console.log('root', root)
    set({ root, isInitialized: true, watcher })
  }
}))
