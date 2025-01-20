import { useEffect } from 'react'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function NavigationListener() {
  const { canGoBack, canGoForward, goBack, goForward } = useWorkspace()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Alt+Left and Alt+Right for back/forward
      if (event.altKey) {
        if (event.key === 'ArrowLeft' && canGoBack()) {
          event.preventDefault()
          goBack()
        } else if (event.key === 'ArrowRight' && canGoForward()) {
          event.preventDefault()
          goForward()
        }
      }

      // Handle browser back/forward buttons (Cmd/Ctrl + [ or ])
      if (event.metaKey || event.ctrlKey) {
        if (event.key === '[' && canGoBack()) {
          event.preventDefault()
          goBack()
        } else if (event.key === ']' && canGoForward()) {
          event.preventDefault()
          goForward()
        }
      }
    }

    // Handle mouse back/forward buttons
    const handleMouseBack = (event: MouseEvent) => {
      if (event.button === 4 || event.button === 8) {
        // Forward button
        event.preventDefault()
        if (canGoForward()) {
          goForward()
        }
      } else if (event.button === 3) {
        // Back button
        event.preventDefault()
        if (canGoBack()) {
          goBack()
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
