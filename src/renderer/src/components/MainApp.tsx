import { TooltipProvider } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'
import { FileCacheProvider } from '../contexts/FileCacheContext'
import { WorkspaceProvider } from '../contexts/WorkspaceContext'
import { AppSidebar } from './app-sidebar'
import { WorkspaceView } from './views/Workspace'

function MouseGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(200px circle at ${position.x}px ${position.y}px, hsl(var(--accent) / 0.20), transparent 80%)`
      }}
    />
  )
}

export function MainApp(): JSX.Element {
  return (
    <TooltipProvider>
      <FileCacheProvider>
        <WorkspaceProvider>
          <div className="relative h-screen">
            <MouseGlow />
            <div className="relative z-10 flex h-full">
              <AppSidebar />
              <div className="flex-1 pl-12">
                <WorkspaceView />
              </div>
            </div>
          </div>
        </WorkspaceProvider>
      </FileCacheProvider>
    </TooltipProvider>
  )
}
