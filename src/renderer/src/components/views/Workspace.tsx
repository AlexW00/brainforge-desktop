import Splitter from '@devbookhq/splitter'
import { useEffect } from 'react'
import { ViewProvider } from '../../contexts/ViewContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { ViewIcons, ViewName } from '../../stock/Views'
import { Layout } from '../../stores/workspace'
import { Panel } from '../composites/Panel'
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

  useEffect(() => {
    if (!activeViewId || !layout) {
      insertRootView([{ name: 'home', props: {} }])
    }
    console.log('layout:', JSON.stringify(layout, null, 2))
  }, [activeViewId, layout, insertRootView])

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
            onSplit={(direction) => splitView(viewId, direction)}
            isActive={activeViewId === viewId}
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

  return <div className="flex flex-col h-full">{layout && renderLayout(layout)}</div>
}
