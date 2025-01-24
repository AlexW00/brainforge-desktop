import { useEffect } from 'react'
import { useFileCache } from '../../contexts/FileCacheContext'
import { useView } from '../../contexts/ViewContext'
import { DirectoryComponent } from '../composites/directory'
import { PathBreadcrumbs } from '../composites/path-breadcrumbs'

export function NodeView() {
  const { view, navigate, setViewProp } = useView<'files'>()
  const { isInitialized, listDirectory, getNode } = useFileCache()

  // Initialize with Brainforge path if no path is set
  useEffect(() => {
    if (!view.props.path) {
      const initPath = async () => {
        const homePath = await window.api.getHomePath()
        const brainForgePath = await window.api.joinPath(homePath, 'Documents', 'Brainforge')
        setViewProp('path', brainForgePath)
      }
      initPath()
    }
  }, [])

  const currentPath = view.props.path ?? ''
  const currentNode = isInitialized ? getNode(currentPath) : null

  const files = isInitialized ? listDirectory(currentPath) : []
  const showParentFolder = currentNode !== null && currentNode.path !== currentPath

  const handleItemClick = async (item: { type: string; name: string }) => {
    if (item.type === 'folder') {
      const newPath = await window.api.joinPath(currentPath, item.name)
      navigate('files', { path: newPath })
    }
  }

  const handleParentClick = async () => {
    const segments = currentPath.split('/')
    segments.pop()
    const parentPath = segments.join('/')
    if (parentPath) {
      navigate('files', { path: parentPath })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PathBreadcrumbs
        path={currentPath}
        onBreadcrumbClick={(path) => navigate('files', { path })}
      />
      {isInitialized && !currentNode ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          This file or directory does not exist
        </div>
      ) : (
        <DirectoryComponent
          items={files.map((node) => ({
            name: node.path.split('/').pop()!,
            path: node.path,
            type: node.type,
            lastModified: new Date(node.lastUpdated).toISOString()
          }))}
          showParentFolder={showParentFolder}
          onItemClick={handleItemClick}
          onParentClick={handleParentClick}
          isLoading={!isInitialized}
        />
      )}
    </div>
  )
}
