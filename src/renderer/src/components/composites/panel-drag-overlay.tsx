import { DragOverlay } from '@dnd-kit/core'
import { LucideIcon } from 'lucide-react'
import { ViewName } from '../../stock/Views'

interface PanelDragOverlayProps {
  name?: ViewName
  Icon?: LucideIcon
}

export function PanelDragOverlay({ name, Icon }: PanelDragOverlayProps) {
  if (!name || !Icon) return null

  return (
    <DragOverlay dropAnimation={null}>
      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg overflow-hidden max-w-[200px]">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm truncate">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
      </div>
    </DragOverlay>
  )
}
