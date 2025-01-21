import { SplitDirection } from '@devbookhq/splitter'
import { enableMapSet, produce } from 'immer'
import { create } from 'zustand'
import { ViewHistory, ViewName, ViewProps } from '../stock/Views'

enableMapSet()

export interface Panel {
  viewId: string
}

export interface SplitPanel {
  id: string
  panels: [Layout, Layout]
  direction: SplitDirection
  size: number // percentage between panels
}

export type Layout = Panel | SplitPanel

export type WorkspaceState = {
  views: Map<string, ViewHistory> // viewId -> view history
  viewIndices: Map<string, number> // viewId -> current view index (= view history index)
  activeViewId: string | undefined // currently active viewId
  layout: Layout | undefined // the workspace layout

  removeView: (viewId: string) => void
  navigate: <T extends ViewName>(viewId: string, view: T, props?: ViewProps[T]) => void
  setViewProps: <T extends ViewName>(viewId: string, props: ViewProps[T], canUndo?: boolean) => void
  setViewProp: <T extends ViewName, K extends keyof ViewProps[T]>(
    viewId: string,
    key: K,
    value: ViewProps[T][K],
    canUndo?: boolean
  ) => void
  canGoBack: (viewId: string) => boolean
  canGoForward: (viewId: string) => boolean
  goBack: (viewId: string) => void
  goForward: (viewId: string) => void
  setActiveView: (viewId: string) => void
  splitView: (viewId: string, direction: SplitDirection, splitView?: ViewHistory) => void
  updateSplitPanel: (panelId: string, direction: SplitDirection, size: number) => void
  insertRootView: (view: ViewHistory) => void
}

const removePanelFromLayout = (layout: Layout, viewId: string): Layout | null => {
  if ('viewId' in layout) {
    return layout.viewId === viewId ? null : layout
  }

  const [left, right] = layout.panels.map((panel) => removePanelFromLayout(panel, viewId))

  if (left === null && right === null) return null
  if (left === null) return right
  if (right === null) return left

  return {
    ...layout,
    panels: [left, right]
  }
}

const updateSplitPanelInLayout = (
  layout: Layout,
  panelId: string,
  direction: SplitDirection,
  size: number
): Layout => {
  if ('panels' in layout) {
    if (layout.id === panelId) {
      return {
        ...layout,
        direction,
        size
      }
    }

    return {
      ...layout,
      panels: [
        updateSplitPanelInLayout(layout.panels[0], panelId, direction, size),
        updateSplitPanelInLayout(layout.panels[1], panelId, direction, size)
      ]
    }
  }

  return layout
}

const splitPanelInLayout = (
  layout: Layout,
  splitViewId: string,
  insertViewId: string,
  direction: SplitDirection
): Layout => {
  if ('viewId' in layout) {
    console.log('splitPanelInLayout', layout.viewId, splitViewId)
    if (layout.viewId === splitViewId) {
      return {
        id: crypto.randomUUID(),
        direction,
        size: 50,
        panels: [layout, { viewId: insertViewId }]
      }
    } else {
      return layout
    }
  }

  if ('panels' in layout) {
    return {
      ...layout,
      panels: [
        splitPanelInLayout(layout.panels[0], splitViewId, insertViewId, direction),
        splitPanelInLayout(layout.panels[1], splitViewId, insertViewId, direction)
      ]
    }
  }

  throw new Error('Invalid layout')
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  views: new Map(),
  viewIndices: new Map(),
  activeViewId: undefined,
  layout: undefined,
  insertRootView: (view: ViewHistory) => {
    const newViewId = crypto.randomUUID()
    set(
      produce((state) => {
        state.views.set(newViewId, view)
        state.viewIndices.set(newViewId, 0)
        state.activeViewId = newViewId
        state.layout = { viewId: newViewId }
      })
    )
  },
  splitView: (viewId: string, direction: SplitDirection, splitView?: ViewHistory) => {
    const view = get().views.get(viewId)
    if (!view) {
      console.error('Could not find view', viewId)
      return
    }
    const newViewId = crypto.randomUUID()

    if (!splitView) {
      splitView = view
    }

    set(
      produce((state) => {
        state.views.set(newViewId, splitView)
        state.viewIndices.set(newViewId, splitView.length - 1)
        state.activeViewId = newViewId
        state.layout = splitPanelInLayout(state.layout, viewId, newViewId, direction)
      })
    )
  },

  removeView: (viewId: string) => {
    set(
      produce((state) => {
        state.views.delete(viewId)
        state.viewIndices.delete(viewId)
        if (state.activeViewId === viewId) {
          state.activeViewId = undefined
        }
        state.layout = removePanelFromLayout(state.layout, viewId)
      })
    )
  },

  updateSplitPanel: (panelId: string, direction: SplitDirection, size: number) => {
    set(
      produce((state) => {
        state.layout = updateSplitPanelInLayout(state.layout, panelId, direction, size)
      })
    )
  },

  navigate: <T extends ViewName>(
    viewId: string,
    view: T,
    props: ViewProps[T] = {} as ViewProps[T]
  ) => {
    console.log('navigate', viewId, view, props)
    set(
      produce((state) => {
        const currentIndex = state.viewIndices.get(viewId) || 0
        const stack = state.views.get(viewId) || []

        const newStack = stack.slice(0, currentIndex + 1)
        newStack.push({ name: view, props })

        state.views.set(viewId, newStack)
        state.viewIndices.set(viewId, newStack.length - 1)
      })
    )
  },

  setViewProps: <T extends ViewName>(viewId: string, props: ViewProps[T], canUndo = false) => {
    const { views, viewIndices } = get()
    const currentIndex = viewIndices.get(viewId) || 0
    const stack = views.get(viewId) || []
    const currentView = stack[currentIndex]

    if (!currentView) return

    set(
      produce((state) => {
        if (canUndo) {
          const newStack = stack.slice(0, currentIndex + 1)
          newStack.push({
            name: currentView.name as T,
            props: { ...props }
          })
          state.views.set(viewId, newStack)
          state.viewIndices.set(viewId, newStack.length - 1)
        } else {
          const newStack = [...stack]
          newStack[currentIndex] = {
            name: currentView.name as T,
            props: { ...props }
          }
          state.views.set(viewId, newStack)
        }
      })
    )
  },

  setViewProp: <T extends ViewName, K extends keyof ViewProps[T]>(
    viewId: string,
    key: K,
    value: ViewProps[T][K],
    canUndo = false
  ) => {
    console.log('setViewProp', viewId, key, value, canUndo)
    const { views, viewIndices } = get()
    const currentIndex = viewIndices.get(viewId) || 0
    const stack = views.get(viewId) || []
    const currentView = stack[currentIndex]

    if (!currentView) return

    const updatedProps = { ...currentView.props, [key]: value }

    set(
      produce((state) => {
        if (canUndo) {
          const newStack = stack.slice(0, currentIndex + 1)
          newStack.push({
            name: currentView.name as T,
            props: updatedProps
          })
          state.views.set(viewId, newStack)
          state.viewIndices.set(viewId, newStack.length - 1)
        } else {
          const newStack = [...stack]
          newStack[currentIndex] = {
            name: currentView.name as T,
            props: updatedProps
          }
          state.views.set(viewId, newStack)
        }
      })
    )
  },

  goBack: (viewId: string) => {
    const { viewIndices } = get()
    const currentIndex = viewIndices.get(viewId) || 0
    if (currentIndex > 0) {
      set(
        produce((state) => {
          state.viewIndices.set(viewId, currentIndex - 1)
        })
      )
    }
  },

  goForward: (viewId: string) => {
    const { views, viewIndices } = get()
    const currentIndex = viewIndices.get(viewId) || 0
    const stack = views.get(viewId) || []
    if (currentIndex < stack.length - 1) {
      set(
        produce((state) => {
          state.viewIndices.set(viewId, currentIndex + 1)
        })
      )
    }
  },

  setActiveView: (viewId: string) => {
    set(
      produce((state) => {
        state.activeViewId = viewId
      })
    )
  },

  canGoBack: (viewId: string) => {
    const { viewIndices } = get()
    const currentIndex = viewIndices.get(viewId) || 0
    return currentIndex > 0
  },

  canGoForward: (viewId: string) => {
    const { views, viewIndices } = get()
    const currentIndex = viewIndices.get(viewId) || 0
    const stack = views.get(viewId) || []
    return currentIndex < stack.length - 1
  }
}))
