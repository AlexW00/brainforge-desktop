import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { FolderOpen, History } from 'lucide-react'
import { useEffect, useState } from 'react'
import { create } from 'zustand'

interface ForgeStore {
  recentForges: string[]
  setRecentForges: (forges: string[]) => void
}

const useForgeStore = create<ForgeStore>((set) => ({
  recentForges: [],
  setRecentForges: (forges) => set({ recentForges: forges })
}))

export function ForgePicker(): JSX.Element {
  const { recentForges, setRecentForges } = useForgeStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    window.api.getRecentForges().then(setRecentForges)
  }, [])

  const handleSelectFolder = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.openDirectory()
      if (result) {
        await window.api.selectForge(result)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgeSelect = async (path: string) => {
    setIsLoading(true)
    try {
      await window.api.selectForge(path)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Forge</CardTitle>
          <CardDescription>Choose a folder to open or select from recent forges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg" onClick={handleSelectFolder} disabled={isLoading}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Select Folder
          </Button>

          {recentForges.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <History className="mr-2 h-4 w-4" />
                Recent Forges
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {recentForges.map((forge) => (
                    <Button
                      key={forge}
                      variant="ghost"
                      className="w-full justify-start truncate"
                      onClick={() => handleForgeSelect(forge)}
                      disabled={isLoading}
                    >
                      {forge}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
