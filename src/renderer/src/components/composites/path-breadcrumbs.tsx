import { Brain } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from '../ui/breadcrumb'

interface PathBreadcrumbsProps {
  path: string
  onBreadcrumbClick: (path: string) => Promise<void> | void
}

export function PathBreadcrumbs({ path, onBreadcrumbClick }: PathBreadcrumbsProps) {
  const [homePath, setHomePath] = useState<string>('')
  const [homeFolderName, setHomeFolderName] = useState<string>('')

  useEffect(() => {
    const initHomePath = async () => {
      const home = await window.api.getHomePath()
      setHomePath(home)
      // Extract the last folder name from the path
      const folderName = home.split('/').filter(Boolean).pop() || ''
      setHomeFolderName(folderName)
    }
    initHomePath()
  }, [])

  // Get segments relative to home path
  const getRelativeSegments = () => {
    if (!homePath || !path.startsWith(homePath)) return []
    const relativePath = path.slice(homePath.length)
    return relativePath.split(/[/\\]/).filter(Boolean)
  }

  const segments = getRelativeSegments()

  const getPathUpToSegment = async (index: number) => {
    const segmentsUpToIndex = segments.slice(0, index + 1)
    return window.api.joinPath(homePath, ...segmentsUpToIndex)
  }

  return (
    <Breadcrumb className="p-2 select-none">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            className="cursor-pointer flex items-center gap-1"
            onClick={() => onBreadcrumbClick(homePath)}
          >
            <Brain className="w-4 h-4" />
            <span>{homeFolderName}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={async () => {
                const path = await getPathUpToSegment(index)
                onBreadcrumbClick(path)
              }}
            >
              {segment}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
