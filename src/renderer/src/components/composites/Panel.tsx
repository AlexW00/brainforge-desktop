import { Card } from '@/components/ui/card'
import { SplitDirection } from '@devbookhq/splitter'
import { LucideIcon } from 'lucide-react'
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
  console.log('Panel render', viewId, draggedId)
  return (
    <Card
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
