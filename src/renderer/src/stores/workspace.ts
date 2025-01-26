import { SplitDirection } from '@devbookhq/splitter'
import { enableMapSet, produce } from 'immer'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
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

export type InsertAt = 'before' | 'after'

export type WorkspaceState = {
  views: Record<string, ViewHistory> // viewId -> view history
  viewIndices: Record<string, number> // viewId -> current view index (= view history index)
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
  splitView: (
    viewId: string,
    direction: SplitDirection,
    splitView?: ViewHistory,
    insertAt?: InsertAt
  ) => void
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
  direction: SplitDirection,
  insertAt: InsertAt = 'after'
): Layout => {
  if ('viewId' in layout) {
    if (layout.viewId === splitViewId) {
      return {
        id: crypto.randomUUID(),
        direction,
        sizes: [50, 50],
        panels:
          insertAt === 'before'
            ? [{ viewId: insertViewId }, layout]
            : [layout, { viewId: insertViewId }]
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
      newPanels.splice(panelToSplitIndex + (insertAt === 'before' ? 0 : 1), 0, {
        viewId: insertViewId
      })

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

// Helper function to ensure .brainforge directory exists
const ensureBrainforgeDir = async (homePath: string) => {
  const dirPath = await window.api.joinPath(homePath, '.brainforge')
  try {
    await window.api.getStats(dirPath)
  } catch {
    // Directory doesn't exist, create it
    await window.api.mkdir(dirPath)
  }
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      views: {},
      viewIndices: {},
      activeViewId: undefined,
      layout: undefined,
      insertRootView: (view: ViewHistory) => {
        const newViewId = crypto.randomUUID()
        set(
          produce((state) => {
            state.views[newViewId] = view
            state.viewIndices[newViewId] = 0
            state.activeViewId = newViewId
            state.layout = { viewId: newViewId }
          })
        )
      },
      splitView: (
        viewId: string,
        direction: SplitDirection,
        splitView?: ViewHistory,
        insertAt?: InsertAt
      ) => {
        const view = get().views[viewId]
        if (!view) {
          return
        }
        const newViewId = crypto.randomUUID()

        if (!splitView) {
          splitView = view
        }

        set(
          produce((state) => {
            state.views[newViewId] = splitView
            state.viewIndices[newViewId] = splitView.length - 1
            state.activeViewId = newViewId
            state.layout = splitPanelInLayout(state.layout, viewId, newViewId, direction, insertAt)
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
              const neighbor = state.layout ? getNeighborOfPanel(state.layout, viewId) : null
              const firstPanel = neighbor ? findFirstPanel(neighbor) : null
              if (firstPanel && state.activeViewId === viewId) {
                state.activeViewId = firstPanel.viewId
              }
            }

            // now, remove the view from the layout
            const result = removePanelFromLayout(state.layout!, viewId)
            delete state.views[viewId]
            delete state.viewIndices[viewId]
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
        set(
          produce((state) => {
            const currentIndex = state.viewIndices[viewId] || 0
            const stack = state.views[viewId] || []

            const newStack = stack.slice(0, currentIndex + 1)
            newStack.push({ name: view, props })

            state.views[viewId] = newStack
            state.viewIndices[viewId] = newStack.length - 1
          })
        )
      },

      setViewProps: <T extends ViewName>(viewId: string, props: ViewProps[T], canUndo = false) => {
        const { views, viewIndices } = get()
        const currentIndex = viewIndices[viewId] || 0
        const stack = views[viewId] || []
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
              state.views[viewId] = newStack
              state.viewIndices[viewId] = newStack.length - 1
            } else {
              const newStack = [...stack]
              newStack[currentIndex] = {
                name: currentView.name as T,
                props: { ...props }
              }
              state.views[viewId] = newStack
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
        const { views, viewIndices } = get()
        const currentIndex = viewIndices[viewId] || 0
        const stack = views[viewId] || []
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
              state.views[viewId] = newStack
              state.viewIndices[viewId] = newStack.length - 1
            } else {
              const newStack = [...stack]
              newStack[currentIndex] = {
                name: currentView.name as T,
                props: updatedProps
              }
              state.views[viewId] = newStack
            }
          })
        )
      },

      goBack: (viewId: string) => {
        const { viewIndices } = get()
        const currentIndex = viewIndices[viewId] || 0
        if (currentIndex > 0) {
          set(
            produce((state) => {
              state.viewIndices[viewId] = currentIndex - 1
            })
          )
        }
      },

      goForward: (viewId: string) => {
        const { views, viewIndices } = get()
        const currentIndex = viewIndices[viewId] || 0
        const stack = views[viewId] || []
        if (currentIndex < stack.length - 1) {
          set(
            produce((state) => {
              state.viewIndices[viewId] = currentIndex + 1
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
        const currentIndex = viewIndices[viewId] || 0
        return currentIndex > 0
      },

      canGoForward: (viewId: string) => {
        const { views, viewIndices } = get()
        const currentIndex = viewIndices[viewId] || 0
        const stack = views[viewId] || []
        return currentIndex < stack.length - 1
      }
    }),
    {
      name: 'workspace-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const homePath = await window.api.getHomePath()
          await ensureBrainforgeDir(homePath)
          const workspacePath = await window.api.joinPath(homePath, '.brainforge', 'workspace.json')
          try {
            const content = await window.api.readFile(workspacePath)
            return JSON.parse(content)[name]
          } catch (error) {
            // If file doesn't exist, create it with empty content
            await window.api.writeFile(workspacePath, '{}')
            return null
          }
        },
        setItem: async (name, value) => {
          const homePath = await window.api.getHomePath()
          await ensureBrainforgeDir(homePath)
          const workspacePath = await window.api.joinPath(homePath, '.brainforge', 'workspace.json')
          let parsed = {}
          try {
            const content = await window.api.readFile(workspacePath)
            parsed = JSON.parse(content)
          } catch {
            // File doesn't exist yet, use empty object
          }
          parsed[name] = value
          await window.api.writeFile(workspacePath, JSON.stringify(parsed, null, 2))
        },
        removeItem: async (name) => {
          const homePath = await window.api.getHomePath()
          await ensureBrainforgeDir(homePath)
          const workspacePath = await window.api.joinPath(homePath, '.brainforge', 'workspace.json')
          try {
            const content = await window.api.readFile(workspacePath)
            const parsed = JSON.parse(content)
            delete parsed[name]
            await window.api.writeFile(workspacePath, JSON.stringify(parsed, null, 2))
          } catch {
            // If file doesn't exist, nothing to remove
          }
        }
      })),
      partialize: (state) => ({
        views: state.views,
        viewIndices: state.viewIndices,
        activeViewId: state.activeViewId,
        layout: state.layout
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return {
            views: {},
            viewIndices: {},
            activeViewId: undefined,
            layout: undefined
          }
        }

        // Ensure all properties exist with proper defaults
        return {
          views: state.views || {},
          viewIndices: state.viewIndices || {},
          activeViewId: state.activeViewId || undefined,
          layout: state.layout || undefined
        }
      },
      skipHydration: true // Add this to ensure we wait for async storage
    }
  )
)
