import { useState, useMemo, useCallback } from 'react'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/AuthGuard'
import Navbar from './components/Navbar'
import ModelExplorer from './components/ModelExplorer'
import QueryEditor from './components/QueryEditor'
import ResultsPanel from './components/ResultsPanel'
import ResultsDetailsPanel from './components/ResultsDetailsPanel'
import ChatPanel from './components/ChatPanel'
import ResizeHandle from './components/ResizeHandle'
import HorizontalResizeHandle from './components/HorizontalResizeHandle'
import DataService from './services/DataService'

function App() {
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Initialize DataService
  const dataService = useMemo(() => new DataService('http://localhost:8000'), []);

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
  
  // Results details panel state
  const [isResultsDetailsCollapsed, setIsResultsDetailsCollapsed] = useState(true);
  const [resultsDetailsWidth, setResultsDetailsWidth] = useState(600); // pixels
  const minResultsDetailsWidth = 200;
  const maxResultsDetailsWidth = 800;
  
  // Selected row index state (more reliable for highlighting)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Metadata from SQL execution for analysis tab
  const [executionMetadata, setExecutionMetadata] = useState<any>(null);


  // Catalog selection state
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [models, setModels] = useState<any[]>([]);

  const handleExecute = useCallback(async (selectedQuery?: string) => {
    const queryToExecute = selectedQuery || queryText;
    setIsExecuting(true);
    setExecutionError(null);
    
    try {
      const response = await dataService.executeSql(queryToExecute);
      
      if (response.success && response.data) {
        // Update results with the response data
        setResults(response.data.data || []);
        setColumns(response.data.columns || []);
        setRowCount(response.data.row_count || 0);
        setSelectedRowIndex(null); // Clear selected row when new results are loaded
        
        // Store metadata for analysis tab
        if (response.data.metadata) {
          setExecutionMetadata(response.data.metadata);
        }
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
  }, [queryText, dataService]);

  const handleSave = useCallback(() => {
    // TODO: Implement save logic
  }, [queryText]);

  const handleFormat = useCallback(() => {
    // TODO: Implement query formatting logic
  }, [queryText]);

  const handleSqlGenerated = useCallback((sql: string) => {
    // Append SQL to the bottom of the current query
    setQueryText(prev => {
      const newText = prev.trim() ? `${prev}\n\n${sql}` : sql;
      return newText;
    });
  }, []);

  const handleLeftPanelResize = useCallback((deltaX: number) => {
    setLeftPanelWidth(prev => {
      const newWidth = prev + deltaX;
      return Math.max(minPanelWidth, Math.min(maxPanelWidth, newWidth));
    });
  }, [minPanelWidth, maxPanelWidth]);

  const handleRightPanelResize = useCallback((deltaX: number) => {
    setRightPanelWidth(prev => {
      const newWidth = prev - deltaX; // Negative because we're dragging from the left
      return Math.max(minPanelWidth, Math.min(maxPanelWidth, newWidth));
    });
  }, [minPanelWidth, maxPanelWidth]);

  const handleVerticalResize = useCallback((deltaY: number) => {
    setTopPanelHeight(prev => {
      // Convert deltaY to percentage change (approximate)
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      const newHeight = prev + deltaPercent;
      return Math.max(minPanelHeight, Math.min(maxPanelHeight, newHeight));
    });
  }, [minPanelHeight, maxPanelHeight]);

  const handleChatToggle = useCallback(() => {
    setIsChatCollapsed(prev => !prev);
  }, []);

  const handleResultsDetailsToggle = useCallback(() => {
    setIsResultsDetailsCollapsed(prev => !prev);
  }, []);

  const handleResultsDetailsResize = useCallback((deltaX: number) => {
    setResultsDetailsWidth(prev => {
      const newWidth = prev - deltaX; // Negative because we're dragging from the left
      return Math.max(minResultsDetailsWidth, Math.min(maxResultsDetailsWidth, newWidth));
    });
  }, [minResultsDetailsWidth, maxResultsDetailsWidth]);


  const handleTableSelect = useCallback((table: any) => {
    setSelectedTable(table);
    setSelectedSchema(null); // Clear schema selection
  }, []);

  const handleSchemaSelect = useCallback((schema: string) => {
    setSelectedSchema(schema);
    setSelectedTable(null); // Clear table selection
  }, []);

  const handleGenerateSelect = useCallback((table: any) => {
    // Generate a SELECT statement for the table
    const schemaName = table.schema || 'public';
    const tableName = table.name;
    const selectSQL = `SELECT * FROM ${schemaName}.${tableName};`;
    
    // Add a new tab to the QueryEditor with the generated SQL
    // This will be handled by the QueryEditor component's tab management
    setQueryText(prev => {
      const newText = prev.trim() ? `${prev}\n\n-- Generated SELECT for ${tableName}:\n${selectSQL}` : selectSQL;
      return newText;
    });
  }, []);

  // Compute the selected row object for the details panel
  const selectedRow = useMemo(() => {
    return selectedRowIndex !== null ? results[selectedRowIndex] : null;
  }, [selectedRowIndex, results]);

  // Memoize models to prevent unnecessary re-renders
  const memoizedModels = useMemo(() => models, [models]);

  return (
    <AuthProvider>
      <AuthGuard>
        <div className="d-flex flex-column" style={{ height: '100vh', margin: 0, padding: 0 }}>
          <Navbar />
          
          {/* Main Content Area */}
          <div className="flex-grow-1 d-flex" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          {/* Left Panel - Model Explorer */}
          <div style={{ width: `${leftPanelWidth}px`, flexShrink: 0, height: '100%' }}>
            <ModelExplorer 
              onTableSelect={handleTableSelect}
              onColumnSelect={setSelectedColumn}
              onSchemaSelect={handleSchemaSelect}
              onModelsLoaded={setModels}
              onGenerateSelect={handleGenerateSelect}
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
                selectedSchema={selectedSchema || undefined}
                models={memoizedModels}
                className="h-100"
              />
            </div>

            {/* Horizontal Resize Handle */}
            <HorizontalResizeHandle onResize={handleVerticalResize} />

                  {/* Bottom Panel - Results */}
                  <div style={{ height: `${100 - topPanelHeight}%`, flexShrink: 0 }} className="d-flex">
                    {/* Results Panel */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <ResultsPanel 
                        results={results} 
                        columns={columns}
                        rowCount={rowCount}
                        isExecuting={isExecuting}
                        error={executionError}
                        selectedRowIndex={selectedRowIndex}
                        onRowSelect={setSelectedRowIndex}
                        metadata={executionMetadata}
                      />
                    </div>
                    
                    {/* Results Details Resize Handle */}
                    {!isResultsDetailsCollapsed && (
                      <ResizeHandle onResize={handleResultsDetailsResize} />
                    )}
                    
                    {/* Results Details Panel */}
                    <div style={{ 
                      width: isResultsDetailsCollapsed ? '40px' : `${resultsDetailsWidth}px`, 
                      flexShrink: 0, 
                      transition: 'width 0.3s ease' 
                    }}>
                      <ResultsDetailsPanel 
                        results={results} 
                        columns={columns}
                        rowCount={rowCount}
                        isExecuting={isExecuting}
                        error={executionError}
                        selectedRow={selectedRow}
                        isCollapsed={isResultsDetailsCollapsed}
                        onToggle={handleResultsDetailsToggle}
                      />
                    </div>
                  </div>
          </div>

          {/* Right Resize Handle */}
          <ResizeHandle onResize={handleRightPanelResize} />

          {/* Right Panel - Chat */}
          <div style={{ width: isChatCollapsed ? '40px' : `${rightPanelWidth}px`, flexShrink: 0, transition: 'width 0.3s ease' }}>
            <ChatPanel 
              onSqlGenerated={handleSqlGenerated} 
              isCollapsed={isChatCollapsed}
              onToggle={handleChatToggle}
            />
          </div>
        </div>
      </div>
      </AuthGuard>
    </AuthProvider>
  )
}

export default App
