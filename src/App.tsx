import { useCallback } from 'react'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import Navbar from './components/layout/Navbar'
import ModelExplorer from './components/catalog/ModelExplorer'
import SimpleTabManager from './components/query/SimpleTabManager'
import ChatPanel from './components/chat/ChatPanel'
import ResizeHandle from './components/layout/ResizeHandle'
import ToastManager from './components/common/ToastManager'
import { useGlobalState } from './hooks/useGlobalState'

function App() {
  const { 
    uiState, 
    updateUIState, 
    showSuccess
  } = useGlobalState();

  const minPanelWidth = 150;
  const maxPanelWidth = 500;

  // Panel resize handlers
  const handleLeftPanelResize = useCallback((deltaX: number) => {
    const newWidth = Math.max(minPanelWidth, Math.min(maxPanelWidth, uiState.leftPanelWidth + deltaX));
    updateUIState({ leftPanelWidth: newWidth });
  }, [uiState.leftPanelWidth, updateUIState]);

  const handleRightPanelResize = useCallback((deltaX: number) => {
    const newWidth = Math.max(minPanelWidth, Math.min(maxPanelWidth, uiState.rightPanelWidth - deltaX));
    updateUIState({ rightPanelWidth: newWidth });
  }, [uiState.rightPanelWidth, updateUIState]);

  const handleChatToggle = useCallback(() => {
    updateUIState({ isChatCollapsed: !uiState.isChatCollapsed });
  }, [uiState.isChatCollapsed, updateUIState]);

  const handleQuerySaved = useCallback(() => {
    showSuccess('Query saved successfully!');
  }, [showSuccess]);


  return (
    <AuthProvider>
      <AuthGuard>
        <div className="d-flex flex-column" style={{ height: '100vh', margin: 0, padding: 0 }}>
          <Navbar />
          
          {/* Main Content Area */}
          <div className="flex-grow-1 d-flex" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
            {/* Left Panel - Model Explorer */}
            <div style={{ width: `${uiState.leftPanelWidth}px`, flexShrink: 0, height: '100%' }}>
              <ModelExplorer />
            </div>

            {/* Left Resize Handle */}
            <ResizeHandle onResize={handleLeftPanelResize} />

            {/* Center Panel - Query Editor and Results */}
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <SimpleTabManager
                  onQuerySaved={handleQuerySaved}
                  className="h-100"
                />
            </div>

            {/* Right Resize Handle */}
            <ResizeHandle onResize={handleRightPanelResize} />

            {/* Right Panel - Chat */}
            <div style={{ 
              width: uiState.isChatCollapsed ? '40px' : `${uiState.rightPanelWidth}px`, 
              flexShrink: 0, 
              transition: 'width 0.3s ease' 
            }}>
              <ChatPanel 
                isCollapsed={uiState.isChatCollapsed}
                onToggle={handleChatToggle}
              />
            </div>
          </div>
        </div>
        
        {/* Toast Manager */}
        <ToastManager />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
