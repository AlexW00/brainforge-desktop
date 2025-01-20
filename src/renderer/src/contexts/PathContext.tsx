import * as React from 'react'
import { useLocation } from 'react-router-dom'

type PathContextType = {
  segments: string[]
  basePath: string
  subPath: string
}

const PathContext = React.createContext<PathContextType | null>(null)

export function usePathContext() {
  const context = React.useContext(PathContext)
  if (!context) {
    throw new Error('usePathContext must be used within a PathProvider')
  }
  return context
}

export function PathProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const basePath = pathSegments[0] || ''
  const subPath = pathSegments.slice(1).join('/')

  const value = React.useMemo(
    () => ({
      segments: pathSegments,
      basePath,
      subPath
    }),
    [pathSegments, basePath, subPath]
  )

  return <PathContext.Provider value={value}>{children}</PathContext.Provider>
}
