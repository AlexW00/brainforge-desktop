import { Card } from '@/components/ui/card'
import { SplitDirection } from '@devbookhq/splitter'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { LucideIcon } from 'lucide-react'
import { ViewName } from '../../stock/Views'
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
}

export function Panel({
  viewId,
  name,
  Icon,
  onActivate,
  onClose,
  children,
  onSplit,
  isActive
}: PanelProps) {
  const { active } = useDndContext()
  const isDraggingDifferentPanel = active && active.data.current?.viewId !== viewId

  // Drop zones for each region
  const { setNodeRef: setTopRef, isOver: isOverTop } = useDroppable({
    id: `${viewId}-top`,
    data: { targetId: viewId, direction: SplitDirection.Horizontal, insertAt: 'before' } as const,
    disabled: !isDraggingDifferentPanel
  })

  const { setNodeRef: setBottomRef, isOver: isOverBottom } = useDroppable({
    id: `${viewId}-bottom`,
    data: { targetId: viewId, direction: SplitDirection.Horizontal, insertAt: 'after' } as const,
    disabled: !isDraggingDifferentPanel
  })

  const { setNodeRef: setLeftRef, isOver: isOverLeft } = useDroppable({
    id: `${viewId}-left`,
    data: { targetId: viewId, direction: SplitDirection.Vertical, insertAt: 'before' } as const,
    disabled: !isDraggingDifferentPanel
  })

  const { setNodeRef: setRightRef, isOver: isOverRight } = useDroppable({
    id: `${viewId}-right`,
    data: { targetId: viewId, direction: SplitDirection.Vertical, insertAt: 'after' } as const,
    disabled: !isDraggingDifferentPanel
  })

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
        name={name}
        Icon={Icon}
        onSplit={onSplit}
        onClose={onClose}
        isActive={isActive}
        viewId={viewId}
      />
      <div className="flex-1 overflow-auto min-h-0 relative">
        {/* Drop zones - positioned relative to content area only */}
        {isDraggingDifferentPanel && (
          <>
            <div
              ref={setTopRef}
              className={`absolute top-0 left-0 w-full h-[25%] ${
                isOverTop ? 'bg-primary/20' : 'bg-transparent pointer-events-none'
              }`}
            />
            <div
              ref={setBottomRef}
              className={`absolute bottom-0 left-0 w-full h-[25%] ${
                isOverBottom ? 'bg-primary/20' : 'bg-transparent pointer-events-none'
              }`}
            />
            <div
              ref={setLeftRef}
              className={`absolute top-0 left-0 w-[25%] h-full ${
                isOverLeft ? 'bg-primary/20' : 'bg-transparent pointer-events-none'
              }`}
            />
            <div
              ref={setRightRef}
              className={`absolute top-0 right-0 w-[25%] h-full ${
                isOverRight ? 'bg-primary/20' : 'bg-transparent pointer-events-none'
              }`}
            />
          </>
        )}
        {children}
      </div>
    </Card>
  )
}
