import { Button } from '@/components/ui/button'
import { FolderOpen } from 'lucide-react'

export function ForgePickerButton(): JSX.Element {
  const handleClick = () => {
    window.api.openForgePicker()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      <FolderOpen className="h-4 w-4 mr-2" />
      Change Forge
    </Button>
  )
}
