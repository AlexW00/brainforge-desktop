/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { View } from '../stores/workspace'
import { ViewName, ViewProps } from '../types/navigation'
import { useWorkspace } from './WorkspaceContext'

// view context = like navigation context
// but requires a view id when calling the hook
// making method calls easier to use
type ViewContextType<T extends ViewName> = {
  view: View<T>
  viewId: string
  setViewProps: (props: ViewProps[T], canUndo?: boolean) => void
  setViewProp: (
    key: keyof ViewProps[T],
    value: ViewProps[T][keyof ViewProps[T]],
    canUndo?: boolean
  ) => void
  navigate: (view: ViewName, props?: ViewProps[ViewName]) => void
  goBack: () => void
  goForward: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  setActive: () => void
}

const ViewContext = React.createContext<ViewContextType<any> | null>(null)

export function useView<T extends ViewName>() {
  const context = React.useContext(ViewContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }

  return context as ViewContextType<T>
}

export function ViewProvider<T extends ViewName>({
  children,
  viewId
}: {
  children: React.ReactNode
  viewId: string
}) {
  const workspace = useWorkspace()
  const viewIndex = workspace.viewIndices.get(viewId)!
  const view = workspace.views.get(viewId)![viewIndex]

  const value = React.useMemo(() => {
    return {
      view,
      viewId,
      setViewProps: (props: ViewProps[T], canUndo?: boolean) => {
        workspace.setViewProps(viewId, props, canUndo)
      },
      setViewProp: (
        key: keyof ViewProps[T],
        value: ViewProps[T][keyof ViewProps[T]],
        canUndo?: boolean
      ) => {
        workspace.setViewProp(viewId, key, value, canUndo)
      },
      navigate: (view: ViewName, props?: ViewProps[ViewName]) => {
        workspace.navigate(viewId, view, props)
      },
      goBack: () => {
        workspace.goBack(viewId)
      },
      goForward: () => {
        workspace.goForward(viewId)
      },
      canGoBack: () => {
        return workspace.canGoBack(viewId)
      },
      canGoForward: () => {
        return workspace.canGoForward(viewId)
      },
      setActive: () => {
        workspace.setActiveView(viewId)
      }
    } as ViewContextType<T>
  }, [workspace, view])

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
}
