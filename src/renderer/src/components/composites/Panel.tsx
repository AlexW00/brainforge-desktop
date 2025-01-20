import { Card } from '@/components/ui/card'
import { SplitDirection } from '@devbookhq/splitter'
import { LucideIcon } from 'lucide-react'
import { ViewName } from '../../types/navigation'
import { PanelTitleBar } from './panel-title-bar'

interface PanelProps {
  viewId: string
  name: ViewName
  Icon: LucideIcon
  onActivate: (viewId: string) => void
  onClose: () => void
  onSplit: (direction: SplitDirection) => void
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
  return (
    <Card
      className="flex flex-col h-full m-[5px] p-[13px]"
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
      />
      <div className="flex-1 overflow-auto min-h-0">{children}</div>
    </Card>
  )
}
