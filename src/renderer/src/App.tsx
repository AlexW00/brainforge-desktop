import { TooltipProvider } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'
import { AppSidebar } from './components/app-sidebar'
import { WorkspaceRenderer } from './components/views/WorkspaceRenderer'
import { FileCacheProvider } from './contexts/FileCacheContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'

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

function App() {
  return (
    <TooltipProvider>
      <FileCacheProvider>
        <WorkspaceProvider>
          <div className="relative h-screen">
            <MouseGlow />
            <div className="relative z-10 flex h-full">
              <AppSidebar />
              <div className="flex-1 pl-12">
                <WorkspaceRenderer />
              </div>
            </div>
          </div>
        </WorkspaceProvider>
      </FileCacheProvider>
    </TooltipProvider>
  )
}

export default App
