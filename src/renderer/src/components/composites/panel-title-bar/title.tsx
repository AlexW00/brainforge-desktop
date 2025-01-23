import { useDraggable } from '@dnd-kit/core'
import { LucideIcon } from 'lucide-react'
import { ViewName } from '../../../stock/Views'

interface PanelTitleProps {
  viewId: string
  name: ViewName
  Icon: LucideIcon
  isActive?: boolean
}

export function PanelTitle({ viewId, name, Icon, isActive }: PanelTitleProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: viewId
  })

  return (
    <div className="text-sm font-medium flex items-center justify-center">
      <span
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`flex items-center gap-2 cursor-grab select-none px-2 ${isActive ? 'font-bold' : ''}`}
        style={{
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
        }}
      >
        <Icon className="h-4 w-4" />
        {name.charAt(0).toUpperCase() + name.slice(1)}
      </span>
    </div>
  )
}
