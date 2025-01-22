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
  panels: Layout[]
  direction: SplitDirection
  sizes: number[] // percentage between panels
}

export type Layout = Panel | SplitPanel

export type WorkspaceState = {
  views: Map<string, ViewHistory> // viewId -> view history
  viewIndices: Map<string, number> // viewId -> current view index (= view history index)
  activeViewId?: string // currently active viewId
  layout?: Layout // the workspace layout

  removeView: (viewId: string, newActiveViewId?: string) => void
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
  updateSplitPanel: (panelId: string, direction: SplitDirection, sizes: number[]) => void
  insertRootView: (view: ViewHistory) => void
}

// Helper functions for panel layout management
const normalizeSizes = (sizes: number[]): number[] => {
  if (sizes.length === 0) return sizes
  const total = sizes.reduce((sum, size) => sum + size, 0)
  return sizes.map((size) => (size / total) * 100)
}

const removeItemAtIndex = <T>(array: T[], index: number): T[] => {
  const newArray = [...array]
  newArray.splice(index, 1)
  return newArray
}

const findPanelIndex = (layout: SplitPanel, viewId: string): number => {
  return layout.panels.findIndex((panel) => 'viewId' in panel && panel.viewId === viewId)
}

const handlePanelReduction = (panels: Layout[]): Layout | null => {
  if (panels.length === 0) return null
  if (panels.length === 1) return panels[0]
  return null // Signal to keep existing structure
}

const removePanelFromLayout = (
  layout: Layout,
  viewId: string
): { layout: Layout | null; removedIndex: number | null } => {
  // Handle single view panel
  if ('viewId' in layout) {
    return {
      layout: layout.viewId === viewId ? null : layout,
      removedIndex: null
    }
  }

  // Handle split panel
  const panelIndex = findPanelIndex(layout, viewId)

  if (panelIndex !== -1) {
    const newPanels = removeItemAtIndex(layout.panels, panelIndex)
    const newSizes = normalizeSizes(removeItemAtIndex(layout.sizes, panelIndex))

    const reducedLayout = handlePanelReduction(newPanels)
    if (reducedLayout !== null) {
      return { layout: reducedLayout, removedIndex: panelIndex }
    }

    return {
      layout: {
        ...layout,
        panels: newPanels,
        sizes: newSizes
      },
      removedIndex: panelIndex
    }
  }

  // Recursively search nested panels
  for (let i = 0; i < layout.panels.length; i++) {
    const result = removePanelFromLayout(layout.panels[i], viewId)
    if (result.layout !== layout.panels[i]) {
      if (result.layout === null) {
        const newPanels = removeItemAtIndex(layout.panels, i)
        const newSizes = normalizeSizes(removeItemAtIndex(layout.sizes, i))
        const reducedLayout = handlePanelReduction(newPanels)

        return {
          layout:
            reducedLayout !== null
              ? reducedLayout
              : {
                  ...layout,
                  panels: newPanels,
                  sizes: newSizes
                },
          removedIndex: result.removedIndex
        }
      }

      const newPanels = [...layout.panels]
      newPanels[i] = result.layout
      return {
        layout: {
          ...layout,
          panels: newPanels
        },
        removedIndex: result.removedIndex
      }
    }
  }

  return { layout, removedIndex: null }
}

const updateSplitPanelInLayout = (
  layout: Layout,
  panelId: string,
  direction: SplitDirection,
  sizes: number[]
): Layout => {
  if ('panels' in layout) {
    if (layout.id === panelId) {
      return {
        ...layout,
        direction,
        sizes
      }
    }

    return {
      ...layout,
      panels: [
        ...layout.panels.map((panel) => updateSplitPanelInLayout(panel, panelId, direction, sizes))
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
    if (layout.viewId === splitViewId) {
      return {
        id: crypto.randomUUID(),
        direction,
        sizes: [50, 50],
        panels: [layout, { viewId: insertViewId }]
      }
    }
    return layout
  }

  if ('panels' in layout) {
    const panelToSplitIndex = layout.panels.findIndex(
      (panel) => 'viewId' in panel && panel.viewId === splitViewId
    )

    if (panelToSplitIndex !== -1 && layout.direction === direction) {
      const newSizes = layout.sizes.map(
        (size) => size * (layout.panels.length / (layout.panels.length + 1))
      )
      newSizes.splice(panelToSplitIndex + 1, 0, 100 / (layout.panels.length + 1))

      const newPanels = [...layout.panels]
      newPanels.splice(panelToSplitIndex + 1, 0, { viewId: insertViewId })

      return {
        ...layout,
        sizes: newSizes,
        panels: newPanels
      }
    }

    return {
      ...layout,
      panels: layout.panels.map((panel) =>
        splitPanelInLayout(panel, splitViewId, insertViewId, direction)
      )
    }
  }

  throw new Error('Invalid layout')
}

const getNeighborOfPanel = (layout: Layout, panelId: string): Layout | null => {
  if ('viewId' in layout) {
    return null
  }

  // Find the index of the panel with the given ID
  const panelIndex = layout.panels.findIndex(
    (panel) => 'viewId' in panel && panel.viewId === panelId
  )

  if (panelIndex !== -1) {
    // Try to get the next panel, if not available get the previous one
    return layout.panels[panelIndex + 1] || layout.panels[panelIndex - 1] || null
  }

  // Recursively search in nested panels
  for (const panel of layout.panels) {
    const neighbor = getNeighborOfPanel(panel, panelId)
    if (neighbor) return neighbor
  }

  return null
}

const findFirstPanel = (layout: Layout): Panel | null => {
  if ('viewId' in layout) {
    return layout
  }
  return layout.panels.map((panel) => findFirstPanel(panel)).find((panel) => panel !== null) || null
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

  removeView: (viewId: string, newActiveViewId?: string) => {
    set(
      produce((state) => {
        if (newActiveViewId) {
          state.activeViewId = newActiveViewId
        } else {
          // by default, set active view to the panel next to the removed view
          const neighbor = get().layout ? getNeighborOfPanel(get().layout!, viewId) : null
          const firstPanel = neighbor ? findFirstPanel(neighbor) : null
          if (firstPanel && state.activeViewId === viewId) {
            state.activeViewId = firstPanel.viewId
          }
        }

        // now, remove the view from the layout
        const result = removePanelFromLayout(state.layout!, viewId)
        state.views.delete(viewId)
        state.viewIndices.delete(viewId)
        state.layout = result.layout
      })
    )
  },

  updateSplitPanel: (panelId: string, direction: SplitDirection, sizes: number[]) => {
    set(
      produce((state) => {
        state.layout = updateSplitPanelInLayout(state.layout, panelId, direction, sizes)
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
