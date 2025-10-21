import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import ModelExplorer from './components/ModelExplorer'
import QueryEditor from './components/QueryEditor'
import ResultsPanel from './components/ResultsPanel'
import ChatPanel from './components/ChatPanel'
import ResizeHandle from './components/ResizeHandle'
import HorizontalResizeHandle from './components/HorizontalResizeHandle'
import DataService from './services/DataService'

function App() {
  const [queryText, setQueryText] = useState('SELECT * FROM users WHERE active = true;');
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Initialize DataService
  const dataService = new DataService('http://localhost:8000');

  // Panel width state
  const [leftPanelWidth, setLeftPanelWidth] = useState(312); // pixels (250 * 1.25)
  const [rightPanelWidth, setRightPanelWidth] = useState(437); // pixels (250 * 1.75)
  const minPanelWidth = 150;
  const maxPanelWidth = 500;

  // Panel height state for center panels
  const [topPanelHeight, setTopPanelHeight] = useState(50); // percentage
  const minPanelHeight = 20; // minimum 20% of available height
  const maxPanelHeight = 80; // maximum 80% of available height

  // Chat panel collapse state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Catalog selection state
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const handleExecute = async (selectedQuery?: string) => {
    const queryToExecute = selectedQuery || queryText;
    console.log('Executing query:', queryToExecute);
    setIsExecuting(true);
    setExecutionError(null);
    
    try {
      const response = await dataService.executeSql(queryToExecute);
      
      if (response.success && response.data) {
        // Update results with the response data
        setResults(response.data.data || []);
        setColumns(response.data.columns || []);
        setRowCount(response.data.row_count || 0);
        console.log('Query executed successfully:', response.data);
      } else {
        setExecutionError(response.error || 'Failed to execute query');
        console.error('Query execution failed:', response.error);
      }
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Query execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = () => {
    console.log('Saving query:', queryText);
    // TODO: Implement save logic
  };

  const handleFormat = () => {
    console.log('Formatting query:', queryText);
    // TODO: Implement query formatting logic
  };

  const handleSqlGenerated = (sql: string) => {
    console.log('handleSqlGenerated called with:', sql);
    // Append SQL to the bottom of the current query
    setQueryText(prev => {
      const newText = prev.trim() ? `${prev}\n\n-- Generated SQL:\n${sql}` : sql;
      console.log('Query text updated to:', newText);
      return newText;
    });
  };

  const handleLeftPanelResize = (deltaX: number) => {
    setLeftPanelWidth(prev => {
      const newWidth = prev + deltaX;
      return Math.max(minPanelWidth, Math.min(maxPanelWidth, newWidth));
    });
  };

  const handleRightPanelResize = (deltaX: number) => {
    setRightPanelWidth(prev => {
      const newWidth = prev - deltaX; // Negative because we're dragging from the left
      return Math.max(minPanelWidth, Math.min(maxPanelWidth, newWidth));
    });
  };

  const handleVerticalResize = (deltaY: number) => {
    setTopPanelHeight(prev => {
      // Convert deltaY to percentage change (approximate)
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      const newHeight = prev + deltaPercent;
      return Math.max(minPanelHeight, Math.min(maxPanelHeight, newHeight));
    });
  };

  const handleChatToggle = () => {
    setIsChatCollapsed(prev => !prev);
  };

  const handleValidationResult = (result: string) => {
    // Documentation is now handled by the CatalogInfo component
    // This function can be used for other validation results if needed
    console.log('Validation result:', result);
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', margin: 0, padding: 0 }}>
      <Navbar />
      
      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* Left Panel - Model Explorer */}
        <div style={{ width: `${leftPanelWidth}px`, flexShrink: 0, height: '100%' }}>
          <ModelExplorer 
            onValidationResult={handleValidationResult}
            onTableSelect={(table) => {
              console.log('App: onTableSelect called with:', table);
              setSelectedTable(table);
            }}
            onColumnSelect={setSelectedColumn}
          />
        </div>

        {/* Left Resize Handle */}
        <ResizeHandle onResize={handleLeftPanelResize} />

        {/* Center Panels */}
        <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
          {/* Top Panel - Query Editor */}
          <div style={{ height: `${topPanelHeight}%`, flexShrink: 0 }}>
            <QueryEditor
              queryText={queryText}
              onQueryChange={setQueryText}
              onExecute={handleExecute}
              onSave={handleSave}
              onFormat={handleFormat}
              selectedTable={selectedTable}
              selectedColumn={selectedColumn || undefined}
              className="h-100"
            />
          </div>

          {/* Horizontal Resize Handle */}
          <HorizontalResizeHandle onResize={handleVerticalResize} />

                {/* Bottom Panel - Results */}
                <div style={{ height: `${100 - topPanelHeight}%`, flexShrink: 0 }}>
                  <ResultsPanel 
                    results={results} 
                    columns={columns}
                    rowCount={rowCount}
                    isExecuting={isExecuting}
                    error={executionError}
                  />
                </div>
        </div>

        {/* Right Resize Handle */}
        <ResizeHandle onResize={handleRightPanelResize} />

        {/* Right Panel - Chat */}
        <div style={{ width: isChatCollapsed ? '60px' : `${rightPanelWidth}px`, flexShrink: 0, transition: 'width 0.3s ease' }}>
          <ChatPanel 
            onSqlGenerated={handleSqlGenerated} 
            isCollapsed={isChatCollapsed}
            onToggle={handleChatToggle}
          />
        </div>
      </div>
    </div>
  )
}

export default App
