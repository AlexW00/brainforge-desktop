import { SplitDirection } from '@devbookhq/splitter'
import { PanelActionButtons } from './panel-title-bar/action-buttons'
import { PanelNavButtons } from './panel-title-bar/nav-buttons'

import { LucideIcon } from 'lucide-react'
import { ViewProps } from '../../stock/Views'
import { PanelTitle } from './panel-title-bar/title'

interface PanelTitleBarProps {
  viewId: string
  name: keyof ViewProps
  Icon: LucideIcon
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  isActive: boolean
  canSplitVertical: boolean
  canSplitHorizontal: boolean
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
