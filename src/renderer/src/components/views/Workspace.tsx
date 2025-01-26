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
import { HomeView } from './Home'
import { NodeView } from './Node'

const viewComponents = {
  browser: <BrowserView />,
  files: <NodeView />,
  home: <HomeView />
} as const

type GutterPosition = 'left' | 'right' | 'top' | 'bottom'

// gutter direction is the opposite of the split direction (since the gutter is the divider)
const getGutterDirection = (splitDirection: SplitDirection) => {
  return splitDirection === SplitDirection.Horizontal
    ? SplitDirection.Vertical
    : SplitDirection.Horizontal
}

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

  const resetDrag = () => {
    setDraggedViewId(undefined)
    setActiveDropId(undefined)
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDraggedViewId(active.id as string)
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    setActiveDropId(over?.id as string)
  }

  const handleDragEnd = ({ over }: DragEndEvent) => {
    if (!over || !draggedViewId) {
      resetDrag()
      return
    }

    const [targetViewId, position] = (over.id as string).split(':')

    if (targetViewId === draggedViewId) {
      resetDrag()
      return
    }

    const direction =
      position === 'left' || position === 'right'
        ? SplitDirection.Vertical
        : SplitDirection.Horizontal
    const insertAt = position === 'left' || position === 'top' ? 'before' : 'after'

    const draggedViewHistory = views[draggedViewId]
    if (!draggedViewHistory) return

    removeView(draggedViewId)
    splitView(targetViewId, direction, draggedViewHistory, insertAt)
    resetDrag()
  }

  const renderView = (viewId: string, gutterPositions: GutterPosition[]) => {
    const currentIndex = viewIndices[viewId] || 0
    const stack = views[viewId] || []
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

    const gutterClass =
      layout.direction === SplitDirection.Horizontal
        ? 'custom-gutter-vertical'
        : 'custom-gutter-horizontal'
    const getNextGutter = (panel: number, panelsLength: number): GutterPosition[] => {
      if (layout.direction === SplitDirection.Vertical) {
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
        direction={getGutterDirection(layout.direction)}
        minHeights={layout.sizes.map(() => 200)}
        minWidths={layout.sizes.map(() => 200)}
        initialSizes={layout.sizes}
        onResizeStarted={() => {
          document.body.classList.add('no-select')
        }}
        onResizeFinished={(_pairIdx, newSizes) => {
          document.body.classList.remove('no-select')
          updateSplitPanel(layout.id, layout.direction, newSizes)
        }}
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

  const draggedView = draggedViewId
    ? views[draggedViewId]?.[viewIndices[draggedViewId] || 0]
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
