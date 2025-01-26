import { SplitDirection } from '@devbookhq/splitter'
import { MoreVertical, SplitSquareHorizontal, SplitSquareVertical, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu'

interface PanelActionButtonsProps {
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  canSplitVertical?: boolean
  canSplitHorizontal?: boolean
}

export function PanelActionButtons({
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
