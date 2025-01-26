import { ArrowLeftRight, FolderOpen, Globe, LucideIcon } from 'lucide-react'

import { useWorkspace } from '../contexts/WorkspaceContext'
import { cn } from '../lib/utils'
import { ViewName } from '../stock/Views'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface NavItem {
  title: string
  view: ViewName
  icon: LucideIcon
}

export function AppSidebar(): JSX.Element {
  const { navigate, activeViewId, insertRootView } = useWorkspace()
  const navItems: NavItem[] = [
    {
      title: 'Files',
      view: 'files',
      icon: FolderOpen
    },
    {
      title: 'Browser',
      view: 'browser',
      icon: Globe
    }
  ]

  const handleItemClick = (view: ViewName) => {
    if (activeViewId) {
      navigate(activeViewId, view)
    } else {
      insertRootView([{ name: view, props: {} }])
    }
  }

  const handleForgePickerClick = () => {
    window.api.openForgePicker()
  }

  return (
    <div className="fixed left-0 h-full flex flex-col justify-between items-center w-12 pt-2 border-r z-10 bg-background">
      <div className="flex flex-col items-center gap-2">
        {navItems.map((item) => (
          <Tooltip key={item.view}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7 hover:bg-accent hover:text-accent-foreground')}
                onClick={() => handleItemClick(item.view)}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.title}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="pb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7 hover:bg-accent hover:text-accent-foreground')}
              onClick={handleForgePickerClick}
            >
              <ArrowLeftRight className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Change Forge</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
