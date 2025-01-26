import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    <div className="h-[400px] bg-background overflow-hidden">
      <Card className="w-full h-full shadow-none border-0">
        <CardHeader className="pb-3">
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
              <div className="relative">
                <ScrollArea className="h-[220px] overflow-hidden">
                  <div className="space-y-1 pr-4">
                    {recentForges.map((forge) => (
                      <Button
                        key={forge}
                        variant="ghost"
                        className="w-full justify-start font-normal"
                        onClick={() => handleForgeSelect(forge)}
                        disabled={isLoading}
                      >
                        <span className="truncate">{forge}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
