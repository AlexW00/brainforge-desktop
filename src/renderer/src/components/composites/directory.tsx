import { FileIcon, FolderIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export interface DirectoryTableRow {
  name: string
  type: 'file' | 'folder'
  path: string
  size?: string
  modified?: string
}

interface DirectoryComponentProps {
  items: DirectoryTableRow[]
  showParentFolder?: boolean
  onItemClick: (item: DirectoryTableRow) => Promise<void> | void
  onParentClick: () => Promise<void> | void
  isLoading?: boolean
}

export function DirectoryComponent({
  items,
  showParentFolder,
  onItemClick,
  onParentClick,
  isLoading
}: DirectoryComponentProps) {
  return (
    <div className="flex-1 overflow-auto">
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
              {items.map((item) => (
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
