import { createContext, useContext, useEffect } from 'react'
import type { FileSystemNode } from '../../../types/files'
import { useFileCacheStore } from '../stores/fileCache'

interface FileCacheContextType {
  isInitialized: boolean
  listDirectory: (path: string) => FileSystemNode[]
  getNode: (path: string) => FileSystemNode | null
}

const FileCacheContext = createContext<FileCacheContextType | null>(null)

export function useFileCache() {
  const context = useContext(FileCacheContext)
  if (!context) {
    throw new Error('useFileCache must be used within a FileCacheProvider')
  }
  return context
}

export function FileCacheProvider({ children }: { children: React.ReactNode }) {
  const store = useFileCacheStore()

  useEffect(() => {
    const init = async () => {
      const documentsPath = await window.api.joinPath(
        await window.api.getHomePath(),
        'Documents',
        'Brainforge'
      )
      await store.initialize(documentsPath)
    }
    init()
  }, [])

  return (
    <FileCacheContext.Provider
      value={{
        isInitialized: store.isInitialized,
        listDirectory: store.listDirectory,
        getNode: store.getNode
      }}
    >
      {children}
    </FileCacheContext.Provider>
  )
}
