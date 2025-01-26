import { ArrowLeftRight, Brain, FolderOpen, Globe } from 'lucide-react'
import { useView } from '../../contexts/ViewContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { Button } from '../ui/button'

export function HomeView() {
  const { navigate } = useView()
  const { activeViewId, insertRootView } = useWorkspace()

  const handleItemClick = (view: 'files' | 'browser') => {
    if (activeViewId) {
      navigate(view)
    } else {
      insertRootView([{ name: view, props: {} }])
    }
  }

  const handleForgePickerClick = () => {
    window.api.openForgePicker()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <Brain className="w-16 h-16 mb-4 text-primary" />
      <h1 className="text-3xl font-bold mb-2">Welcome to BrainForge</h1>
      <p className="text-muted-foreground mb-6">The IDE for your Brain</p>
      <div className="flex gap-8">
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-2 h-auto py-3 px-4"
          onClick={() => handleItemClick('files')}
        >
          <FolderOpen className="w-6 h-6" />
          <strong>Files</strong>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-2 h-auto py-3 px-4"
          onClick={() => handleItemClick('browser')}
        >
          <Globe className="w-6 h-6" />
          <strong>Browser</strong>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-2 h-auto py-3 px-4"
          onClick={handleForgePickerClick}
        >
          <ArrowLeftRight className="w-6 h-6" />
          <strong>Forge</strong>
        </Button>
      </div>
    </div>
  )
}
