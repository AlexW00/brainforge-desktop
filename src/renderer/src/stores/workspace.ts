import { enableMapSet, produce } from 'immer'
import { FolderOpen, Globe, Home, LucideIcon } from 'lucide-react'
import { create } from 'zustand'
import { ViewName, ViewProps } from '../types/navigation'

enableMapSet()

export type View<T extends ViewName> = {
  name: T
  props: ViewProps[T]
  icon: LucideIcon
}

export const DEFAULT_VIEWS = new Map<ViewName, View<ViewName>>([
  ['home', { name: 'home', props: {}, icon: Home }],
  ['files', { name: 'files', props: {}, icon: FolderOpen }],
  ['browser', { name: 'browser', props: {}, icon: Globe }]
])

export type WorkspaceState = {
  views: Map<string, Array<View<ViewName>>>
  viewIndices: Map<string, number>
  activeViewId: string
  addHomeView: () => void
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
  splitView: (viewId: string, direction: 'horizontal' | 'vertical') => void
}

export const useNavigationStore = create<WorkspaceState>((set, get) => ({
  views: new Map([['base', [DEFAULT_VIEWS.get('home')!]]]),
  viewIndices: new Map([['base', 0]]),
  activeViewId: 'base',

  splitView: (viewId: string, direction: 'horizontal' | 'vertical') => {
    console.log('splitView', viewId, direction)
    const view = get().views.get(viewId)
    if (!view) return
    const newViewId = crypto.randomUUID()
    set(
      produce((state) => {
        state.views.set(newViewId, view)
        state.viewIndices.set(newViewId, view.length - 1)
        state.activeViewId = newViewId
      })
    )
  },

  addHomeView: () => {
    // add empty home view
    const viewId = crypto.randomUUID()
    set(
      produce((state) => {
        state.views.set(viewId, [DEFAULT_VIEWS.get('home')!])
        state.viewIndices.set(viewId, 0)
        state.activeViewId = viewId
      })
    )
  },

  removeView: (viewId: string) => {
    set(
      produce((state) => {
        if (state.views.size === 1 && viewId === 'base') {
          state.views.set('base', [DEFAULT_VIEWS.get('home')])
          state.viewIndices.set('base', 0)
        } else {
          state.views.delete(viewId)
          state.viewIndices.delete(viewId)
          if (state.activeViewId === viewId) {
            state.activeViewId = 'base'
          }
        }
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
        const icon = DEFAULT_VIEWS.get(view)?.icon || Home

        const newStack = stack.slice(0, currentIndex + 1)
        newStack.push({ name: view, props, icon })

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
            props: { ...props },
            icon: currentView.icon
          })
          state.views.set(viewId, newStack)
          state.viewIndices.set(viewId, newStack.length - 1)
        } else {
          const newStack = [...stack]
          newStack[currentIndex] = {
            name: currentView.name as T,
            props: { ...props },
            icon: currentView.icon
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
            props: updatedProps,
            icon: currentView.icon
          })
          state.views.set(viewId, newStack)
          state.viewIndices.set(viewId, newStack.length - 1)
        } else {
          const newStack = [...stack]
          newStack[currentIndex] = {
            name: currentView.name as T,
            props: updatedProps,
            icon: currentView.icon
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
