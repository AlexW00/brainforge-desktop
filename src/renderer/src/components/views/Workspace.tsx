import Splitter from '@devbookhq/splitter'
import { ViewProvider } from '../../contexts/ViewContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { ViewName } from '../../types/navigation'
import { Panel } from '../composites/Panel'
import { BrowserView } from './Browser'
import { NodeView } from './Node'

const viewComponents: Record<ViewName, JSX.Element> = {
  browser: <BrowserView />,
  files: <NodeView />,
  home: <div>Home Page</div>
}

const getViewComponent = (name: ViewName) => viewComponents[name] || viewComponents.home

export function WorkspaceView() {
  const { views, viewIndices, setActiveView, removeView, splitView, activeViewId } = useWorkspace()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <Splitter>
          {Array.from(views.entries()).map(([viewId, stack]) => {
            const currentIndex = viewIndices.get(viewId) || 0
            const currentState = stack[currentIndex]
            const name = currentState.name
            const Icon = currentState.icon

            return (
              <ViewProvider key={viewId} viewId={viewId}>
                <Panel
                  viewId={viewId}
                  name={name}
                  Icon={Icon}
                  onActivate={setActiveView}
                  onClose={removeView}
                  onSplit={() => splitView(viewId, 'horizontal')}
                  isActive={activeViewId === viewId}
                >
                  {getViewComponent(name)}
                </Panel>
              </ViewProvider>
            )
          })}
        </Splitter>
      </div>
    </div>
  )
}
