import {
  FileIcon,
  FilePlusIcon,
  FolderIcon,
  FolderPlusIcon,
  Pencil,
  SearchIcon,
  Trash2
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '../ui/context-menu'
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
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const [renamingValue, setRenamingValue] = useState('')
  const filterTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setIsCreatingFolder(false)
    setIsCreatingFile(false)
    setNewItemName('')
    setIsRenaming(null)
    setRenamingValue('')
  }, [currentPath])

  useEffect(() => {
    setLocalFilter(filter)
  }, [filter])

  const handleFilterChange = useCallback(
    (value: string) => {
      setLocalFilter(value)
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current)
      }
      filterTimeoutRef.current = setTimeout(() => {
        onFilterChange(value)
      }, 300)
    },
    [onFilterChange]
  )

  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current)
      }
    }
  }, [])

  const handleCreateFolder = useCallback(async () => {
    if (!newItemName) return
    const newPath = await window.api.joinPath(currentPath, newItemName)
    await window.api.mkdir(newPath)
    setIsCreatingFolder(false)
    setNewItemName('')
  }, [currentPath, newItemName])

  const handleCreateFile = useCallback(async () => {
    if (!newItemName) return
    const newPath = await window.api.joinPath(currentPath, newItemName)
    await window.api.writeFile(newPath, '')
    setIsCreatingFile(false)
    setNewItemName('')
  }, [currentPath, newItemName])

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (isCreatingFolder) await handleCreateFolder()
        if (isCreatingFile) await handleCreateFile()
        if (isRenaming) {
          const oldPath = isRenaming
          const newPath = await window.api.joinPath(currentPath, renamingValue)
          try {
            await window.api.rename(oldPath, newPath)
            setIsRenaming(null)
            setRenamingValue('')
          } catch (error) {
            console.error('Failed to rename:', error)
            // TODO: Show error toast
          }
        }
      } else if (e.key === 'Escape') {
        setIsCreatingFolder(false)
        setIsCreatingFile(false)
        setNewItemName('')
        setIsRenaming(null)
        setRenamingValue('')
      }
    },
    [
      isCreatingFolder,
      isCreatingFile,
      isRenaming,
      currentPath,
      renamingValue,
      handleCreateFolder,
      handleCreateFile
    ]
  )

  const handleRename = useCallback((item: FileTableRow) => {
    setIsRenaming(item.path)
    setRenamingValue(item.name)
  }, [])

  const handleDelete = useCallback(async (item: FileTableRow) => {
    try {
      await window.api.deleteFile(item.path)
    } catch (error) {
      console.error('Failed to delete:', error)
      // TODO: Show error toast
    }
  }, [])

  const filteredItems = items
    .filter(
      (item) =>
        !item.name.startsWith('.') && item.name.toLowerCase().includes(localFilter.toLowerCase())
    )
    .sort((a, b) => {
      // Sort folders before files
      if (a.type === 'folder' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'folder') return 1
      // Then sort alphabetically
      return a.name.localeCompare(b.name)
    })

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
                <ContextMenu key={item.path}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => {
                        if (isRenaming !== item.path) {
                          onItemClick(item)
                        }
                      }}
                    >
                      <TableCell className="flex items-center gap-2">
                        {isRenaming === item.path ? (
                          <>
                            {item.type === 'folder' ? (
                              <FolderIcon className="h-4 w-4" />
                            ) : (
                              <FileIcon className="h-4 w-4" />
                            )}
                            <Input
                              value={renamingValue}
                              onChange={(e) => setRenamingValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="h-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </>
                        ) : (
                          <>
                            {item.type === 'folder' ? (
                              <FolderIcon className="h-4 w-4" />
                            ) : (
                              <FileIcon className="h-4 w-4" />
                            )}
                            {item.name}
                          </>
                        )}
                      </TableCell>
                      <TableCell>{item.type === 'folder' ? 'Folder' : 'File'}</TableCell>
                      <TableCell>{item.size || '-'}</TableCell>
                      <TableCell>{item.modified || '-'}</TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleRename(item)} className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => handleDelete(item)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
