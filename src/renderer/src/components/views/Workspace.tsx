import Splitter from '@devbookhq/splitter'
import { useEffect } from 'react'
import { ViewProvider } from '../../contexts/ViewContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { ViewIcons, ViewName } from '../../stock/Views'
import { Layout } from '../../stores/workspace'
import { Panel } from '../composites/Panel'
import { BrowserView } from './Browser'
import { NodeView } from './Node'

const viewComponents: Record<ViewName, JSX.Element> = {
  browser: <BrowserView />,
  files: <NodeView />,
  home: <div></div>
}

type GutterPosition = 'left' | 'right' | 'top' | 'bottom'

const getViewComponent = (name: ViewName) => viewComponents[name] || viewComponents.home

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
  }, [activeViewId, layout, insertRootView])

  const renderLayout = (
    layout: Layout,
    parentGutterPositions: GutterPosition[] = []
  ): React.ReactNode => {
    if ('viewId' in layout) {
      return renderView(layout.viewId, parentGutterPositions)
    }

    return (
      <Splitter
        gutterClassName={
          layout.direction === 'Horizontal' ? 'custom-gutter-horizontal' : 'custom-gutter-vertical'
        }
        direction={layout.direction}
        initialSizes={[layout.size, 100 - layout.size]}
        onResizeFinished={(_pairIdx, newSizes) =>
          updateSplitPanel(layout.id, layout.direction, newSizes[0])
        }
      >
        {renderLayout(
          layout.panels[0],
          layout.direction === 'Horizontal'
            ? [...parentGutterPositions, 'right']
            : [...parentGutterPositions, 'bottom']
        )}
        {renderLayout(
          layout.panels[1],
          layout.direction === 'Horizontal'
            ? [...parentGutterPositions, 'left']
            : [...parentGutterPositions, 'top']
        )}
      </Splitter>
    )
  }

  const renderView = (viewId: string, gutterPositions: GutterPosition[]) => {
    const currentIndex = viewIndices.get(viewId) || 0
    const stack = views.get(viewId) ?? []
    const currentState = stack[currentIndex]
    const name = currentState.name
    const Icon = ViewIcons[name]
    let padding = ''
    if (!gutterPositions.includes('left')) {
      padding += ' pl-[5px]'
    }
    if (!gutterPositions.includes('right')) {
      padding += ' pr-[5px]'
    }
    if (!gutterPositions.includes('top')) {
      padding += ' pt-[5px]'
    }
    if (!gutterPositions.includes('bottom')) {
      padding += ' pb-[5px]'
    }

    return (
      <ViewProvider key={viewId} viewId={viewId}>
        <div className={`flex flex-col h-full ${padding}`}>
          <Panel
            viewId={viewId}
            name={name}
            Icon={Icon}
            onActivate={setActiveView}
            onClose={() => removeView(viewId)}
            onSplit={(direction) => splitView(viewId, direction)}
            isActive={activeViewId === viewId}
          >
            {getViewComponent(name)}
          </Panel>
        </div>
      </ViewProvider>
    )
  }

  return <div className="flex flex-col h-full">{layout ? renderLayout(layout) : null}</div>
}
