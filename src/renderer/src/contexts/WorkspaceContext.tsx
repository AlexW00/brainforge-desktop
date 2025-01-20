/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import type { WorkspaceState } from '../stores/workspace'
import { useNavigationStore } from '../stores/workspace'

type WorkspaceContextType = Pick<
  WorkspaceState,
  | 'setViewProps'
  | 'setViewProp'
  | 'navigate'
  | 'goBack'
  | 'goForward'
  | 'canGoBack'
  | 'canGoForward'
  | 'activeViewId'
  | 'views'
  | 'viewIndices'
  | 'addHomeView'
  | 'removeView'
  | 'setActiveView'
  | 'splitView'
>

export const WorkspaceContext = React.createContext<WorkspaceContextType | null>(null)

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }

  return {
    activeViewId: context.activeViewId,
    views: context.views,
    viewIndices: context.viewIndices,
    setViewProps: context.setViewProps,
    setViewProp: context.setViewProp,
    navigate: context.navigate,
    goBack: context.goBack,
    goForward: context.goForward,
    canGoBack: context.canGoBack,
    canGoForward: context.canGoForward,
    addHomeView: context.addHomeView,
    splitView: context.splitView,
    removeView: context.removeView,
    setActiveView: context.setActiveView
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const store = useNavigationStore()
  const activeViewId = store.activeViewId || 'view1'

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
      views: store.views,
      activeViewId: store.activeViewId,
      viewIndices: store.viewIndices,
      setViewProps: store.setViewProps,
      setViewProp: store.setViewProp,
      navigate: store.navigate,
      goBack: store.goBack,
      goForward: store.goForward,
      canGoBack: store.canGoBack,
      canGoForward: store.canGoForward,
      addHomeView: store.addHomeView,
      splitView: store.splitView,
      removeView: store.removeView,
      setActiveView: store.setActiveView
    }
  }, [store])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
