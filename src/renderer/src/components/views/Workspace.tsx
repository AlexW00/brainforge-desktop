import Splitter, { SplitDirection } from '@devbookhq/splitter'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { ViewProvider } from '../../contexts/ViewContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { ViewIcons, ViewName } from '../../stock/Views'
import { Layout } from '../../stores/workspace'
import { Panel } from '../composites/Panel'
import { PanelDragOverlay } from '../composites/panel-drag-overlay'
import { BrowserView } from './Browser'
import { NodeView } from './Node'

const viewComponents = {
  browser: <BrowserView />,
  files: <NodeView />,
  home: <div />
} as const

type GutterPosition = 'left' | 'right' | 'top' | 'bottom'

const getPadding = (gutterPositions: GutterPosition[]) => {
  const classes: string[] = []
  !gutterPositions.includes('left') && classes.push('pl-[5px]')
  !gutterPositions.includes('right') && classes.push('pr-[5px]')
  !gutterPositions.includes('top') && classes.push('pt-[5px]')
  !gutterPositions.includes('bottom') && classes.push('pb-[5px]')
  return classes.join(' ')
}

export function WorkspaceView() {
  const {
    layout,
    viewIndices,
    activeViewId,
    views,
    setActiveView,
    removeView,
    splitView,
    updateSplitPanel,
    insertRootView
  } = useWorkspace()

  const [draggedViewId, setDraggedViewId] = useState<string>()
  const [activeDropId, setActiveDropId] = useState<string>()

  useEffect(() => {
    if (!activeViewId || !layout) {
      insertRootView([{ name: 'home', props: {} }])
    }
  }, [activeViewId, layout, insertRootView])

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDraggedViewId(active.id as string)
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    setActiveDropId(over?.id as string)
  }

  const handleDragEnd = ({ over }: DragEndEvent) => {
    if (!over || !draggedViewId) {
      setDraggedViewId(undefined)
      setActiveDropId(undefined)
      return
    }

    const [targetViewId, position] = (over.id as string).split(':')
    if (targetViewId === draggedViewId) {
      setDraggedViewId(undefined)
      setActiveDropId(undefined)
      return
    }

    const direction =
      position === 'left' || position === 'right'
        ? SplitDirection.Horizontal
        : SplitDirection.Vertical
    const insertAt = position === 'left' || position === 'top' ? 'before' : 'after'

    // Get the dragged view's history
    const draggedViewHistory = views.get(draggedViewId)
    if (!draggedViewHistory) return

    // Split the target view and insert the dragged view
    splitView(targetViewId, direction, draggedViewHistory, insertAt)

    // Remove the original dragged view
    removeView(draggedViewId)

    setDraggedViewId(undefined)
    setActiveDropId(undefined)
  }

  const renderView = (viewId: string, gutterPositions: GutterPosition[]) => {
    const currentIndex = viewIndices.get(viewId) || 0
    const stack = views.get(viewId) ?? []
    const { name } = stack[currentIndex]
    const Icon = ViewIcons[name]

    return (
      <ViewProvider key={viewId} viewId={viewId}>
        <div className={`flex flex-col h-full ${getPadding(gutterPositions)}`}>
          <Panel
            viewId={viewId}
            name={name}
            Icon={Icon}
            onActivate={setActiveView}
            onClose={() => removeView(viewId)}
            onSplit={(direction, insertAt) => splitView(viewId, direction, undefined, insertAt)}
            isActive={activeViewId === viewId}
            isDragging={draggedViewId !== undefined}
            activeDropId={activeDropId}
            draggedId={draggedViewId}
          >
            {viewComponents[name as ViewName] || viewComponents.home}
          </Panel>
        </div>
      </ViewProvider>
    )
  }

  const renderLayout = (
    layout: Layout,
    parentGutterPositions: GutterPosition[] = []
  ): React.ReactNode => {
    if ('viewId' in layout) {
      return renderView(layout.viewId, parentGutterPositions)
    }

    const isHorizontal = layout.direction === 'Horizontal'
    const gutterClass = isHorizontal ? 'custom-gutter-horizontal' : 'custom-gutter-vertical'
    const getNextGutter = (panel: number, panelsLength: number): GutterPosition[] => {
      if (isHorizontal) {
        if (panel === 0) return ['right']
        if (panel === panelsLength - 1) return ['left']
        return ['left', 'right']
      } else {
        if (panel === 0) return ['bottom']
        if (panel === panelsLength - 1) return ['top']
        return ['top', 'bottom']
      }
    }

    return (
      <Splitter
        key={layout.id}
        gutterClassName={gutterClass}
        direction={layout.direction}
        initialSizes={layout.sizes}
        onResizeFinished={(_pairIdx, newSizes) =>
          updateSplitPanel(layout.id, layout.direction, newSizes)
        }
      >
        {layout.panels.map((panel, index) =>
          renderLayout(panel, [
            ...parentGutterPositions,
            ...getNextGutter(index, layout.panels.length)
          ])
        )}
      </Splitter>
    )
  }

  // Get the dragged view's name and icon for the overlay
  const draggedView = draggedViewId
    ? views.get(draggedViewId)?.[viewIndices.get(draggedViewId) || 0]
    : undefined
  const draggedViewName = draggedView?.name
  const DraggedViewIcon = draggedViewName ? ViewIcons[draggedViewName] : undefined

  return (
    <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">{layout && renderLayout(layout)}</div>
      <PanelDragOverlay name={draggedViewName} Icon={DraggedViewIcon} />
    </DndContext>
  )
}
