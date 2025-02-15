/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import type { WorkspaceState } from '../stores/workspace'
import { useWorkspaceStore } from '../stores/workspace'

export type WorkspaceContextType = WorkspaceState

export const WorkspaceContext = React.createContext<WorkspaceContextType | null>(null)

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }

  return {
    ...context
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const store = useWorkspaceStore()
  const [isHydrated, setIsHydrated] = React.useState(false)
  const activeViewId = store.activeViewId || 'base'

  React.useEffect(() => {
    const hydrate = async () => {
      await useWorkspaceStore.persist.rehydrate()
      setIsHydrated(true)
    }
    hydrate()
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'ArrowLeft' && store.canGoBack(activeViewId)) {
          store.goBack(activeViewId)
        } else if (e.key === 'ArrowRight' && store.canGoForward(activeViewId)) {
          store.goForward(activeViewId)
        }
      }
    }

    const handleMouseButton = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        // Mouse back/forward buttons
        e.preventDefault()
        if (e.button === 3 && store.canGoBack(activeViewId)) {
          console.log('goBack', activeViewId)
          store.goBack(activeViewId)
        } else if (e.button === 4 && store.canGoForward(activeViewId)) {
          store.goForward(activeViewId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mouseup', handleMouseButton)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mouseup', handleMouseButton)
    }
  }, [activeViewId, store])

  const value = React.useMemo(() => {
    return {
      ...store
    }
  }, [store])

  if (!isHydrated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
