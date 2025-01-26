import { useEffect } from 'react'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function NavigationListener() {
  const { canGoBack, canGoForward, goBack, goForward, activeViewId } = useWorkspace()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Alt+Left and Alt+Right for back/forward
      if (event.altKey) {
        if (event.key === 'ArrowLeft' && activeViewId && canGoBack(activeViewId)) {
          event.preventDefault()
          goBack(activeViewId)
        } else if (event.key === 'ArrowRight' && activeViewId && canGoForward(activeViewId)) {
          event.preventDefault()
          goForward(activeViewId)
        }
      }

      // Handle browser back/forward buttons (Cmd/Ctrl + [ or ])
      if (event.metaKey || event.ctrlKey) {
        if (event.key === '[' && activeViewId && canGoBack(activeViewId)) {
          event.preventDefault()
          goBack(activeViewId)
        } else if (event.key === ']' && activeViewId && canGoForward(activeViewId)) {
          event.preventDefault()
          goForward(activeViewId)
        }
      }
    }

    // Handle mouse back/forward buttons
    const handleMouseBack = (event: MouseEvent) => {
      if (event.button === 4 || event.button === 8) {
        // Forward button
        event.preventDefault()
        if (activeViewId && canGoForward(activeViewId)) {
          goForward(activeViewId)
        }
      } else if (event.button === 3) {
        // Back button
        event.preventDefault()
        if (activeViewId && canGoBack(activeViewId)) {
          goBack(activeViewId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mouseup', handleMouseBack)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mouseup', handleMouseBack)
    }
  }, [canGoBack, canGoForward, goBack, goForward])

  return null
}
