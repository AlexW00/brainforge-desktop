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

  const renderLayout = (layout: Layout): React.ReactNode => {
    if ('viewId' in layout) {
      return renderView(layout.viewId)
    }

    return (
      <Splitter
        direction={layout.direction}
        initialSizes={[layout.size, 100 - layout.size]}
        onResizeFinished={(_pairIdx, newSizes) =>
          updateSplitPanel(layout.id, layout.direction, newSizes[0])
        }
      >
        {renderLayout(layout.panels[0])}
        {renderLayout(layout.panels[1])}
      </Splitter>
    )
  }

  const renderView = (viewId: string) => {
    const currentIndex = viewIndices.get(viewId) || 0
    const stack = views.get(viewId) ?? []
    const currentState = stack[currentIndex]
    const name = currentState.name
    const Icon = ViewIcons[name]

    return (
      <ViewProvider key={viewId} viewId={viewId}>
        <div className="flex flex-col h-full p-[5px]">
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
