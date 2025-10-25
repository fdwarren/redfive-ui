import { useState, useCallback } from 'react'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import Navbar from './components/layout/Navbar'
import ModelExplorer from './components/catalog/ModelExplorer'
import SimpleTabManager from './components/query/SimpleTabManager'
import ChatPanel from './components/chat/ChatPanel'
import ResizeHandle from './components/layout/ResizeHandle'

function App() {
  // Panel width state
  const [leftPanelWidth, setLeftPanelWidth] = useState(312); // pixels (250 * 1.25)
  const [rightPanelWidth, setRightPanelWidth] = useState(437); // pixels (250 * 1.75)
  const minPanelWidth = 150;
  const maxPanelWidth = 500;


  // Model and table state
  const [models, setModels] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [spatialColumns, setSpatialColumns] = useState<string[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [refreshQueriesFn, setRefreshQueriesFn] = useState<(() => void) | null>(null);
  // Debug logging
  if (selectedSchema) {
    console.log('App state - selectedSchema:', selectedSchema);
  }


  // Panel resize handlers
  const handleLeftPanelResize = useCallback((deltaX: number) => {
    setLeftPanelWidth(prev => Math.max(minPanelWidth, Math.min(maxPanelWidth, prev + deltaX)));
  }, [minPanelWidth, maxPanelWidth]);

  const handleRightPanelResize = useCallback((deltaX: number) => {
    setRightPanelWidth(prev => Math.max(minPanelWidth, Math.min(maxPanelWidth, prev - deltaX)));
  }, [minPanelWidth, maxPanelWidth]);



  // Table and schema handlers
  const handleTableSelect = useCallback((table: any) => {
    setSelectedTable(table);
  }, []);

  const handleSchemaSelect = useCallback((schema: string) => {
    console.log('🔥 APP: Schema selected:', schema);
    setSelectedSchema(schema);
    // Clear selected table when schema is selected to show all tables in the schema
    setSelectedTable(null);
  }, []);

  const handleModelsLoaded = useCallback((models: any[]) => {
    setModels(models);
  }, []);

  const handleGenerateSelect = useCallback(() => {
    // This will be handled by the TabWrapper component
  }, []);

  const handleSpatialColumnsLoaded = useCallback((spatialColumns: string[]) => {
    setSpatialColumns(spatialColumns);
  }, []);

  const handleTableDocumentationSelect = useCallback((table: any) => {
    setSelectedTable(table);
  }, []);

  const handleSqlGenerated = useCallback((sql: string) => {
    // Pass the generated SQL to the SimpleTabManager
    // This will be handled by updating the active tab's query text
    setGeneratedSql(sql);
  }, []);

  const handleQuerySelect = useCallback((query: any) => {
    setSelectedQuery(query);
  }, []);

  const handleQueryLoaded = useCallback(() => {
    setSelectedQuery(null);
  }, []);

  const handleSqlLoaded = useCallback(() => {
    console.log('🔥 APP: SQL loaded, clearing generatedSql');
    setGeneratedSql(null);
  }, []);

  const handleChatToggle = useCallback(() => {
    setIsChatCollapsed(prev => !prev);
  }, []);

  const handleQuerySaved = useCallback(() => {
    // Refresh the saved queries in ModelExplorer
    if (refreshQueriesFn) {
      refreshQueriesFn();
    }
  }, [refreshQueriesFn]);

  const handleRefreshQueries = useCallback((refreshFn: () => void) => {
    setRefreshQueriesFn(() => refreshFn);
  }, []);


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
                onModelsLoaded={handleModelsLoaded}
                onGenerateSelect={handleGenerateSelect}
                onSpatialColumnsLoaded={handleSpatialColumnsLoaded}
                onTableDocumentationSelect={handleTableDocumentationSelect}
                onQuerySelect={handleQuerySelect}
                onRefreshQueries={handleRefreshQueries}
              />
            </div>

            {/* Left Resize Handle */}
            <ResizeHandle onResize={handleLeftPanelResize} />

            {/* Center Panel - Query Editor and Results */}
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <SimpleTabManager
                  selectedTable={selectedTable}
                  selectedSchema={selectedSchema || undefined}
                  models={models}
                  spatialColumns={spatialColumns}
                  onTableSelect={handleTableSelect}
                  onSchemaSelect={handleSchemaSelect}
                  onModelsLoaded={handleModelsLoaded}
                  onGenerateSelect={handleGenerateSelect}
                  onSpatialColumnsLoaded={handleSpatialColumnsLoaded}
                  onTableDocumentationSelect={handleTableDocumentationSelect}
                  onSqlGenerated={handleSqlGenerated}
                  selectedQuery={selectedQuery}
                  onQueryLoaded={handleQueryLoaded}
                  generatedSql={generatedSql}
                  onSqlLoaded={handleSqlLoaded}
                  onQuerySaved={handleQuerySaved}
                  className="h-100"
                />
            </div>

            {/* Right Resize Handle */}
            <ResizeHandle onResize={handleRightPanelResize} />

            {/* Right Panel - Chat */}
            <div style={{ 
              width: isChatCollapsed ? '40px' : `${rightPanelWidth}px`, 
              flexShrink: 0, 
              transition: 'width 0.3s ease' 
            }}>
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
  );
}

export default App;
