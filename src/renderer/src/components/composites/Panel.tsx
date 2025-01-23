import { Card } from '@/components/ui/card'
import { SplitDirection } from '@devbookhq/splitter'
import { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ViewName } from '../../stock/Views'
import { PanelDropZones } from './panel-drop-zones'
import { PanelTitleBar } from './panel-title-bar'

interface PanelProps {
  viewId: string
  name: ViewName
  Icon: LucideIcon
  onActivate: (viewId: string) => void
  onClose: () => void
  onSplit: (direction: SplitDirection, insertAt?: 'before' | 'after') => void
  children: React.ReactNode
  isActive: boolean
  isDragging?: boolean
  activeDropId?: string
  draggedId?: string
}

export function Panel({
  viewId,
  name,
  Icon,
  onActivate,
  onClose,
  children,
  onSplit,
  isActive,
  isDragging,
  activeDropId,
  draggedId
}: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        console.log('Panel resize', entry.contentRect.width, entry.contentRect.height)
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })

    resizeObserver.observe(panel)
    return () => resizeObserver.disconnect()
  }, [])

  console.log('Panel render', viewId, draggedId)
  return (
    <Card
      ref={panelRef}
      className="flex flex-col h-full p-[13px] relative"
      onClick={() => onActivate(viewId)}
      style={{
        borderColor: 'hsl(var(--border))',
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      <PanelTitleBar
        viewId={viewId}
        name={name}
        Icon={Icon}
        onSplit={onSplit}
        onClose={onClose}
        isActive={isActive}
        canSplitHorizontal={dimensions.height >= 400}
        canSplitVertical={dimensions.width >= 400}
      />
      <div className="flex-1 overflow-auto min-h-0">{children}</div>
      <PanelDropZones
        viewId={viewId}
        activeDropId={activeDropId}
        isDragging={Boolean(isDragging || activeDropId)}
        draggedId={draggedId}
      />
    </Card>
  )
}
