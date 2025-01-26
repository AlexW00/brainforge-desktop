import { FileIcon, FilePlusIcon, FolderIcon, FolderPlusIcon, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export interface FileTableRow {
  name: string
  type: 'file' | 'folder'
  path: string
  size?: string
  modified?: string
}

interface FileGridProps {
  items: FileTableRow[]
  showParentFolder?: boolean
  onItemClick: (item: FileTableRow) => Promise<void> | void
  onParentClick: () => Promise<void> | void
  isLoading?: boolean
  currentPath: string
  filter?: string
  onFilterChange: (filter: string) => void
}

export function FileTable({
  items,
  showParentFolder,
  onItemClick,
  onParentClick,
  isLoading,
  currentPath,
  filter = '',
  onFilterChange
}: FileGridProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [localFilter, setLocalFilter] = useState(filter)
  const filterTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setLocalFilter(filter)
  }, [filter])

  const handleFilterChange = (value: string) => {
    setLocalFilter(value)
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current)
    }
    filterTimeoutRef.current = setTimeout(() => {
      onFilterChange(value)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current)
      }
    }
  }, [])

  const filteredItems = items.filter(
    (item) =>
      !item.name.startsWith('.') && item.name.toLowerCase().includes(localFilter.toLowerCase())
  )

  const handleCreateFolder = async () => {
    if (!newItemName) return
    const newPath = await window.api.joinPath(currentPath, newItemName)
    await window.api.mkdir(newPath)
    setIsCreatingFolder(false)
    setNewItemName('')
  }

  const handleCreateFile = async () => {
    if (!newItemName) return
    const newPath = await window.api.joinPath(currentPath, newItemName)
    await window.api.writeFile(newPath, '')
    setIsCreatingFile(false)
    setNewItemName('')
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isCreatingFolder) await handleCreateFolder()
      if (isCreatingFile) await handleCreateFile()
    } else if (e.key === 'Escape') {
      setIsCreatingFolder(false)
      setIsCreatingFile(false)
      setNewItemName('')
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 flex gap-2 p-2 bg-background border-b items-center z-10">
        <div className="flex-1 flex gap-2 items-center">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            value={localFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder="Filter files..."
            className="h-8"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsCreatingFolder(true)
            setIsCreatingFile(false)
            setNewItemName('')
          }}
          className="h-8 w-8"
        >
          <FolderPlusIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsCreatingFile(true)
            setIsCreatingFolder(false)
            setNewItemName('')
          }}
          className="h-8 w-8"
        >
          <FilePlusIcon className="h-4 w-4" />
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="animate-pulse bg-muted/50" colSpan={4}>
                  &nbsp;
                </TableCell>
              </TableRow>
            ))
          ) : (
            <>
              {showParentFolder && (
                <TableRow className="cursor-pointer" onClick={onParentClick}>
                  <TableCell className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4" />
                    ..
                  </TableCell>
                  <TableCell>Folder</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              )}
              {(isCreatingFolder || isCreatingFile) && (
                <TableRow>
                  <TableCell className="flex items-center gap-2" colSpan={4}>
                    {isCreatingFolder ? (
                      <FolderIcon className="h-4 w-4" />
                    ) : (
                      <FileIcon className="h-4 w-4" />
                    )}
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Enter ${isCreatingFolder ? 'folder' : 'file'} name...`}
                      autoFocus
                      className="h-8"
                    />
                  </TableCell>
                </TableRow>
              )}
              {filteredItems.map((item) => (
                <TableRow
                  key={item.path}
                  className="cursor-pointer"
                  onClick={() => onItemClick(item)}
                >
                  <TableCell className="flex items-center gap-2">
                    {item.type === 'folder' ? (
                      <FolderIcon className="h-4 w-4" />
                    ) : (
                      <FileIcon className="h-4 w-4" />
                    )}
                    {item.name}
                  </TableCell>
                  <TableCell>{item.type === 'folder' ? 'Folder' : 'File'}</TableCell>
                  <TableCell>{item.size || '-'}</TableCell>
                  <TableCell>{item.modified || '-'}</TableCell>
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
