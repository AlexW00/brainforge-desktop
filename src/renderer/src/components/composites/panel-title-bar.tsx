import { SplitDirection } from '@devbookhq/splitter'
import { useDraggable } from '@dnd-kit/core'
import {
  ArrowLeft,
  ArrowRight,
  LucideIcon,
  MoreVertical,
  SplitSquareHorizontal,
  SplitSquareVertical,
  X
} from 'lucide-react'
import { useView } from '../../contexts/ViewContext'
import { ViewName } from '../../stock/Views'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'

interface PanelTitleBarProps {
  viewId: string
  name: ViewName
  Icon: LucideIcon
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  isActive?: boolean
  canSplitVertical?: boolean
  canSplitHorizontal?: boolean
}

function PanelNavButtons() {
  const { canGoBack, canGoForward, goBack, goForward } = useView()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation()
          goBack()
        }}
        className="hover:bg-muted rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!canGoBack()}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          goForward()
        }}
        className="hover:bg-muted rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!canGoForward()}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

interface PanelTitleProps {
  viewId: string
  name: ViewName
  Icon: LucideIcon
  isActive?: boolean
}

function PanelTitle({ viewId, name, Icon, isActive }: PanelTitleProps) {
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

interface PanelActionButtonsProps {
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  canSplitVertical?: boolean
  canSplitHorizontal?: boolean
}

function PanelActionButtons({
  onSplit,
  onClose,
  canSplitVertical,
  canSplitHorizontal
}: PanelActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSplit(SplitDirection.Vertical)
        }}
        disabled={!canSplitVertical}
        className="hover:bg-muted rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SplitSquareHorizontal className="h-4 w-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hover:bg-muted rounded p-1">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onSplit(SplitDirection.Horizontal)
            }}
            disabled={!canSplitHorizontal}
            className="gap-2"
          >
            <SplitSquareVertical className="h-4 w-4" />
            Split Horizontally
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="hover:bg-muted rounded p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function PanelTitleBar({
  viewId,
  name,
  Icon,
  onSplit,
  onClose,
  isActive,
  canSplitVertical,
  canSplitHorizontal
}: PanelTitleBarProps) {
  return (
    <div className="grid grid-cols-3 items-center mb-2 h-6">
      <PanelNavButtons />
      <PanelTitle viewId={viewId} name={name} Icon={Icon} isActive={isActive} />
      <PanelActionButtons
        onSplit={onSplit}
        onClose={onClose}
        canSplitVertical={canSplitVertical}
        canSplitHorizontal={canSplitHorizontal}
      />
    </div>
  )
}
