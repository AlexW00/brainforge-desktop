import { SplitDirection } from '@devbookhq/splitter'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '../../lib/utils'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

interface DropZoneProps {
  id: string
  isOver: boolean
  className?: string
  roundedCorners?: Corner[]
}

function DropZone({ id, isOver, className, roundedCorners = [] }: DropZoneProps) {
  const { setNodeRef } = useDroppable({ id })

  const roundedClasses = {
    'rounded-tl-lg': roundedCorners.includes('tl'),
    'rounded-tr-lg': roundedCorners.includes('tr'),
    'rounded-bl-lg': roundedCorners.includes('bl'),
    'rounded-br-lg': roundedCorners.includes('br')
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute backdrop-blur-sm bg-primary/10 transition-opacity',
        isOver ? 'opacity-100' : 'opacity-0',
        roundedClasses,
        className
      )}
    />
  )
}

interface PanelDropZonesProps {
  viewId: string
  activeDropId?: string
  isDragging?: boolean
  draggedId?: string
}

export function PanelDropZones({
  viewId,
  activeDropId,
  isDragging,
  draggedId
}: PanelDropZonesProps) {
  // Don't render anything if:
  // - nothing is being dragged
  // - or if we're dragging over ourselves
  if (!isDragging || draggedId === viewId) return null

  const dropZones = [
    {
      id: `${viewId}:left`,
      className: 'left-0 top-0 w-1/2 h-full',
      direction: SplitDirection.Horizontal,
      insertAt: 'before' as const,
      roundedCorners: ['tl', 'bl'] as Corner[]
    },
    {
      id: `${viewId}:right`,
      className: 'right-0 top-0 w-1/2 h-full',
      direction: SplitDirection.Horizontal,
      insertAt: 'after' as const,
      roundedCorners: ['tr', 'br'] as Corner[]
    },
    {
      id: `${viewId}:top`,
      className: 'left-0 top-0 w-full h-1/2',
      direction: SplitDirection.Vertical,
      insertAt: 'before' as const,
      roundedCorners: ['tl', 'tr'] as Corner[]
    },
    {
      id: `${viewId}:bottom`,
      className: 'left-0 bottom-0 w-full h-1/2',
      direction: SplitDirection.Vertical,
      insertAt: 'after' as const,
      roundedCorners: ['bl', 'br'] as Corner[]
    }
  ]

  return (
    <div className="absolute inset-0">
      {dropZones.map((zone) => (
        <DropZone
          key={zone.id}
          id={zone.id}
          isOver={activeDropId === zone.id}
          className={zone.className}
          roundedCorners={zone.roundedCorners}
        />
      ))}
    </div>
  )
}
