import { useState, useMemo, useCallback } from 'react'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import Navbar from './components/layout/Navbar'
import ModelExplorer from './components/catalog/ModelExplorer'
import QueryEditor from './components/query/QueryEditor'
import ResultsPanel from './components/results/ResultsPanel'
import ResultsDetailsPanel from './components/results/ResultsDetailsPanel'
import ChatPanel from './components/chat/ChatPanel'
import ResizeHandle from './components/layout/ResizeHandle'
import HorizontalResizeHandle from './components/layout/HorizontalResizeHandle'
import DataService from './services/DataService'
import type { TabResults } from './types'

function App() {
  const [queryText, setQueryText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Per-tab results management
  const [tabResults, setTabResults] = useState<{ [tabId: string]: TabResults }>({});
  const [activeTabId, setActiveTabId] = useState('1');
  const [queryEditorActiveTabId, setQueryEditorActiveTabId] = useState('1');

  // Initialize DataService
  const dataService = useMemo(() => new DataService(), []);

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


  // Catalog selection state
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [spatialColumns, setSpatialColumns] = useState<string[]>([]);

  const handleExecute = useCallback(async (selectedQuery?: string, tabId?: string) => {
    const queryToExecute = selectedQuery || queryText;
    const targetTabId = tabId || activeTabId;
    setIsExecuting(true);
    
    // Initialize tab results if they don't exist
    setTabResults(prev => {
      if (!prev[targetTabId]) {
        return {
          ...prev,
          [targetTabId]: {
            results: [],
            columns: [],
            rowCount: 0,
            executionError: null,
            executionMetadata: null,
            selectedRowIndex: null,
            chartConfig: null
          }
        };
      }
      return prev;
    });
    
    try {
      const response = await dataService.executeSql(queryToExecute);
      
      if (response.success && response.data) {
        // Update results for the specific tab
        setTabResults(prev => ({
          ...prev,
          [targetTabId]: {
            results: response.data.data || [],
            columns: response.data.columns || [],
            rowCount: response.data.row_count || 0,
            executionError: null,
            executionMetadata: response.data.metadata || null,
            selectedRowIndex: null, // Reset selection for new results
            chartConfig: prev[targetTabId]?.chartConfig || null // Preserve existing chart config
          }
        }));
      } else {
        // Update error for the specific tab
        setTabResults(prev => ({
          ...prev,
          [targetTabId]: {
            ...prev[targetTabId],
            executionError: response.error || 'Failed to execute query',
            results: [],
            columns: [],
            rowCount: 0,
            selectedRowIndex: null
          }
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTabResults(prev => ({
        ...prev,
        [targetTabId]: {
          ...prev[targetTabId],
          executionError: errorMessage,
          results: [],
          columns: [],
          rowCount: 0,
          selectedRowIndex: null
        }
      }));
    } finally {
      setIsExecuting(false);
    }
  }, [queryText, dataService, activeTabId]);

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

  const handleTableDocumentationSelect = useCallback((table: any) => {
    setSelectedTable(table);
    setSelectedSchema(table.schema || table.schema_name || table.database_schema || 'default');
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

  const handleSpatialColumnsLoaded = useCallback((spatialColumns: string[]) => {
    setSpatialColumns(spatialColumns);
  }, []);

  // Initialize tab results when switching to a new tab
  const initializeTabResults = useCallback((tabId: string) => {
    setTabResults(prev => {
      if (!prev[tabId]) {
        return {
          ...prev,
          [tabId]: {
            results: [],
            columns: [],
            rowCount: 0,
            executionError: null,
            executionMetadata: null,
            selectedRowIndex: null,
            chartConfig: null
          }
        };
      }
      return prev;
    });
  }, []);

  // Handle tab switching from QueryEditor
  const handleTabSwitch = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    initializeTabResults(tabId);
  }, [initializeTabResults]);

  // Handle active tab change from QueryEditor
  const handleQueryEditorActiveTabChange = useCallback((tabId: string) => {
    setQueryEditorActiveTabId(tabId);
  }, []);

  // Handle row selection for the active tab
  const handleRowSelect = useCallback((rowIndex: number) => {
    setTabResults(prev => ({
      ...prev,
      [activeTabId]: {
        ...prev[activeTabId],
        selectedRowIndex: rowIndex
      }
    }));
  }, [activeTabId]);

  // Handle chart config changes for the active tab
  const handleChartConfigChange = useCallback((chartConfig: any) => {
    setTabResults(prev => ({
      ...prev,
      [activeTabId]: {
        ...prev[activeTabId],
        chartConfig: chartConfig ? { ...chartConfig } : null // Create a copy to avoid reference sharing
      }
    }));
  }, [activeTabId]);

  // Get current tab results
  const currentTabResults = tabResults[activeTabId] || {
    results: [],
    columns: [],
    rowCount: 0,
    executionError: null,
    executionMetadata: null,
    selectedRowIndex: null,
    chartConfig: null
  };


  // Compute the selected row object for the details panel
  const selectedRow = useMemo(() => {
    return currentTabResults.selectedRowIndex !== null ? currentTabResults.results[currentTabResults.selectedRowIndex] : null;
  }, [currentTabResults.selectedRowIndex, currentTabResults.results]);

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
              onSchemaSelect={handleSchemaSelect}
              onModelsLoaded={setModels}
              onGenerateSelect={handleGenerateSelect}
              onSpatialColumnsLoaded={handleSpatialColumnsLoaded}
              onTableDocumentationSelect={handleTableDocumentationSelect}
            />
          </div>

          {/* Left Resize Handle */}
          <ResizeHandle onResize={handleLeftPanelResize} />

          {/* Center Panels */}
          <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
            {/* Top Panel - Query Editor */}
            <div style={{ 
              height: queryEditorActiveTabId === 'docs' ? '100%' : `${topPanelHeight}%`, 
              flexShrink: 0 
            }}>
              <QueryEditor
                queryText={queryText}
                onQueryChange={setQueryText}
                onExecute={handleExecute}
                onSave={handleSave}
                onFormat={handleFormat}
                selectedTable={selectedTable}
                selectedSchema={selectedSchema || undefined}
                models={memoizedModels}
                onTabSwitch={handleTabSwitch}
                onActiveTabChange={handleQueryEditorActiveTabChange}
                className="h-100"
              />
            </div>

            {/* Horizontal Resize Handle - only show when not in models tab */}
            {queryEditorActiveTabId !== 'docs' && (
              <HorizontalResizeHandle onResize={handleVerticalResize} />
            )}

            {/* Bottom Panel - Results - only show when not in models tab */}
            {queryEditorActiveTabId !== 'docs' && (
              <div style={{ height: `calc(100vh - ${topPanelHeight}vh)`, flexShrink: 0 }} className="d-flex">
                {/* Results Panel */}
                <div className="flex-grow-1" style={{ minWidth: 0, height: '100%' }}>
                  <ResultsPanel 
                    results={currentTabResults.results} 
                    columns={currentTabResults.columns}
                    rowCount={currentTabResults.rowCount}
                    isExecuting={isExecuting}
                    error={currentTabResults.executionError}
                    selectedRowIndex={currentTabResults.selectedRowIndex}
                    onRowSelect={handleRowSelect}
                    metadata={currentTabResults.executionMetadata}
                    spatialColumns={spatialColumns}
                    chartConfig={currentTabResults.chartConfig}
                    onChartConfigChange={handleChartConfigChange}
                    tabId={activeTabId}
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
                    results={currentTabResults.results} 
                    columns={currentTabResults.columns}
                    rowCount={currentTabResults.rowCount}
                    isExecuting={isExecuting}
                    error={currentTabResults.executionError}
                    selectedRow={selectedRow}
                    isCollapsed={isResultsDetailsCollapsed}
                    onToggle={handleResultsDetailsToggle}
                  />
                </div>
              </div>
            )}
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
