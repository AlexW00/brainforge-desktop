import { useCallback } from 'react'

export function useFileSystem() {
  const getHomePath = useCallback(async () => {
    return window.api.getHomePath()
  }, [])

  const readDirectory = useCallback(async (path: string) => {
    return window.api.readDir(path)
  }, [])

  const joinPath = useCallback(async (basePath: string, ...paths: string[]) => {
    return window.api.joinPath(basePath, ...paths)
  }, [])

  return {
    getHomePath,
    readDirectory,
    joinPath
  }
}
