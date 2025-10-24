import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import ResultsPanel from '../results/ResultsPanel';
import ResultsDetailsPanel from '../results/ResultsDetailsPanel';
import SchemaDocumentation from './SchemaDocumentation';
import ResizeHandle from '../layout/ResizeHandle';
import DataService from '../../services/DataService';
import type { TabResults, Tab } from '../../types';


interface SimpleTabManagerProps {
  selectedTable?: any;
  selectedSchema?: string;
  models?: any[];
  spatialColumns?: string[];
  onTableSelect?: (table: any) => void;
  onSchemaSelect?: (schema: string) => void;
  onModelsLoaded?: (models: any[]) => void;
  onGenerateSelect?: (table: any) => void;
  onSpatialColumnsLoaded?: (columns: string[]) => void;
  onTableDocumentationSelect?: (table: any) => void;
  onSqlGenerated?: (sql: string) => void;
  className?: string;
}

const SimpleTabManager: React.FC<SimpleTabManagerProps> = ({
  selectedTable,
  selectedSchema,
  models = [],
  spatialColumns = [],
  onTableSelect,
  onSchemaSelect,
  onModelsLoaded,
  onGenerateSelect,
  onSpatialColumnsLoaded,
  onTableDocumentationSelect,
  onSqlGenerated,
  className = ''
}) => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'docs',
      name: '📋 Models',
      queryText: '',
      results: {
        results: [],
        columns: [],
        rowCount: 0,
        executionError: null,
        executionMetadata: null,
        selectedRowIndex: null,
        chartConfig: null
      }
    },
    {
      id: '1',
      name: 'Query 1',
      queryText: '',
      results: {
        results: [],
        columns: [],
        rowCount: 0,
        executionError: null,
        executionMetadata: null,
        selectedRowIndex: null,
        chartConfig: null
      }
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [tabCounter, setTabCounter] = useState(2);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isResultsDetailsCollapsed, setIsResultsDetailsCollapsed] = useState(false);
  const [resultsDetailsWidth, setResultsDetailsWidth] = useState(300);
  const editorRef = useRef<any>(null);
  
  // Refs to avoid stale closures in Monaco Editor commands
  const currentActiveTabIdRef = useRef('1');
  const currentTabsRef = useRef<Tab[]>([
    {
      id: 'docs',
      name: '📋 Models',
      queryText: '',
      results: {
        results: [],
        columns: [],
        rowCount: 0,
        executionError: null,
        executionMetadata: null,
        selectedRowIndex: null,
        chartConfig: null
      }
    },
    {
      id: '1',
      name: 'Query 1',
      queryText: '',
      results: {
        results: [],
        columns: [],
        rowCount: 0,
        executionError: null,
        executionMetadata: null,
        selectedRowIndex: null,
        chartConfig: null
      }
    }
  ]);

  // Keep refs in sync with state
  useEffect(() => {
    currentActiveTabIdRef.current = activeTabId;
  }, [activeTabId]);

  useEffect(() => {
    currentTabsRef.current = tabs;
  }, [tabs]);

  // Initialize DataService
  const dataService = useMemo(() => new DataService(), []);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Update completion provider when models change
  useEffect(() => {
    if (editorRef.current && models.length > 0) {
      // Dispose the old completion provider if it exists
      if (editorRef.current.completionProvider) {
        editorRef.current.completionProvider.dispose();
        editorRef.current.completionProvider = null;
      }
      
      // Create new completion provider with current models
      const monaco = (window as any).monaco;
      if (monaco) {
        const newCompletionProvider = monaco.languages.registerCompletionItemProvider('sql', {
          triggerCharacters: [' ', '.', ',', '(', ')', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
          provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            };

            const suggestions: any[] = [];

            // Add SQL keywords
            const sqlKeywords = [
              { label: 'SELECT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'SELECT', documentation: 'Select data from tables' },
              { label: 'FROM', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'FROM', documentation: 'Specify the source table(s)' },
              { label: 'WHERE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'WHERE', documentation: 'Filter rows based on conditions' },
              { label: 'INSERT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INSERT', documentation: 'Insert new rows into a table' },
              { label: 'UPDATE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'UPDATE', documentation: 'Modify existing rows' },
              { label: 'DELETE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DELETE', documentation: 'Remove rows from a table' },
              { label: 'CREATE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'CREATE', documentation: 'Create database objects' },
              { label: 'DROP', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DROP', documentation: 'Remove database objects' },
              { label: 'ALTER', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ALTER', documentation: 'Modify database objects' },
              { label: 'JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'JOIN', documentation: 'Join tables together' },
              { label: 'INNER JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INNER JOIN', documentation: 'Inner join tables' },
              { label: 'LEFT JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LEFT JOIN', documentation: 'Left outer join tables' },
              { label: 'RIGHT JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'RIGHT JOIN', documentation: 'Right outer join tables' },
              { label: 'ORDER BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ORDER BY', documentation: 'Sort the result set' },
              { label: 'GROUP BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'GROUP BY', documentation: 'Group rows by columns' },
              { label: 'HAVING', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'HAVING', documentation: 'Filter groups' },
              { label: 'UNION', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'UNION', documentation: 'Combine result sets' },
              { label: 'DISTINCT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DISTINCT', documentation: 'Remove duplicate rows' },
              { label: 'LIMIT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LIMIT', documentation: 'Limit the number of rows returned' },
              { label: 'OFFSET', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'OFFSET', documentation: 'Skip a number of rows' }
            ];

            sqlKeywords.forEach(keyword => {
              suggestions.push({
                ...keyword,
                range: range
              });
            });

            // Get the text before the current position to analyze context
            const textBeforePosition = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            });

            // Check if we're in a dot notation context (table.column or alias.column)
            const dotNotationMatch = textBeforePosition.match(/([a-zA-Z_$][\w$]*)\s*\.\s*$/i);
            let isColumnContext = false;
            let targetTableName = null;
            let targetAlias = null;

            if (dotNotationMatch) {
              const identifier = dotNotationMatch[1];
              isColumnContext = true;
              
              // Check if this is a table alias by looking for FROM/JOIN clauses
              const aliasMap = new Map<string, string>();
              
              // Find all FROM and JOIN clauses to build alias mapping
              const fromJoinMatches = textBeforePosition.matchAll(/(?:FROM|JOIN)\s+([a-zA-Z_$][\w$]*\.?[a-zA-Z_$][\w$]*)\s+(?:AS\s+)?([a-zA-Z_$][\w$]*)/gi);
              for (const match of fromJoinMatches) {
                const tableName = match[1];
                const alias = match[2];
                aliasMap.set(alias, tableName);
              }
              
              if (aliasMap.has(identifier)) {
                targetAlias = identifier;
                targetTableName = aliasMap.get(identifier);
              } else {
                targetTableName = identifier;
              }
            }

            // Add table suggestions if models are available and not in column context
            if (models && models.length > 0 && !isColumnContext) {
              models.forEach((model: any) => {
                const schema = model.schema || model.schema_name || model.database_schema || 'default';
                const tableName = model.name || model.table_name;
                
                if (tableName) {
                  suggestions.push({
                    label: tableName,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: tableName,
                    documentation: `Table: ${tableName} (Schema: ${schema})`,
                    detail: `Table in ${schema} schema`,
                    range: range
                  });

                  // Also suggest with schema prefix
                  suggestions.push({
                    label: `${schema}.${tableName}`,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: `${schema}.${tableName}`,
                    documentation: `Table: ${tableName} (Schema: ${schema})`,
                    detail: `Fully qualified table name`,
                    range: range
                  });
                }
              });
            }

            // Add column suggestions if we're in a column context
            if (isColumnContext && targetTableName && models && models.length > 0) {
              const targetModel = models.find((model: any) => {
                const schema = model.schema || model.schema_name || model.database_schema || 'default';
                const tableName = model.name || model.table_name;
                return tableName === targetTableName || `${schema}.${tableName}` === targetTableName;
              });
              
              if (targetModel && targetModel.columns && Array.isArray(targetModel.columns)) {
                targetModel.columns.forEach((column: any) => {
                  suggestions.push({
                    label: column.name,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: column.name,
                    documentation: `Column: ${column.name} (Type: ${column.type})${targetAlias ? ` from alias ${targetAlias}` : ''}`,
                    detail: `${column.type}${column.nullable ? ' (nullable)' : ' (not null)'}`,
                    range: range
                  });
                });
              }
            }

            return { suggestions };
          }
        });
        
        editorRef.current.completionProvider = newCompletionProvider;
      }
    }
    
    // Cleanup function to dispose completion provider when component unmounts
    return () => {
      if (editorRef.current && editorRef.current.completionProvider) {
        editorRef.current.completionProvider.dispose();
        editorRef.current.completionProvider = null;
      }
    };
  }, [models]);

  const createNewTab = useCallback(() => {
    const newTab: Tab = {
      id: tabCounter.toString(),
      name: `Query ${tabCounter}`,
      queryText: '',
      results: {
        results: [],
        columns: [],
        rowCount: 0,
        executionError: null,
        executionMetadata: null,
        selectedRowIndex: null,
        chartConfig: null
      }
    };
    setTabs(prev => [...prev, newTab]);
    setTabCounter(prev => prev + 1);
    setActiveTabId(newTab.id);
  }, [tabCounter]);

  const closeTab = useCallback((tabId: string) => {
    // Prevent closing the docs tab
    if (tabId === 'docs') {
      return;
    }
    
    if (tabs.length <= 2) { // docs tab + one query tab
      // If this is the last query tab, create a new empty tab
      const newTab: Tab = {
        id: tabCounter.toString(),
        name: `Query ${tabCounter}`,
        queryText: '',
        results: {
          results: [],
          columns: [],
          rowCount: 0,
          executionError: null,
          executionMetadata: null,
          selectedRowIndex: null,
          chartConfig: null
        }
      };
      setTabs(prev => [...prev.filter(tab => tab.id === 'docs'), newTab]);
      setTabCounter(prev => prev + 1);
      setActiveTabId(newTab.id);
      return;
    }
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // If we closed the active tab, switch to another tab
    if (activeTabId === tabId) {
      const currentIndex = tabs.findIndex(tab => tab.id === tabId);
      const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      const newActiveTabId = newTabs[newActiveIndex].id;
      setActiveTabId(newActiveTabId);
    }
  }, [tabs, activeTabId, tabCounter]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const updateTabQuery = useCallback((queryText: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, queryText } : tab
    ));
  }, [activeTabId]);

  const executeQuery = useCallback(async (queryToExecute: string, targetTabId: string) => {
    setIsExecuting(true);
    
    try {
      const response = await dataService.executeSql(queryToExecute);
      
      if (response.success && response.data) {
        setTabs(prev => prev.map(tab => 
          tab.id === targetTabId 
            ? {
                ...tab,
                results: {
                  results: response.data.data || [],
                  columns: response.data.columns || [],
                  rowCount: response.data.row_count || 0,
                  executionError: null,
                  executionMetadata: response.data.metadata || null,
                  selectedRowIndex: null,
                  chartConfig: null // Reset chart config for new results
                }
              }
            : tab
        ));
      } else {
        setTabs(prev => prev.map(tab => 
          tab.id === targetTabId 
            ? {
                ...tab,
                results: {
                  ...tab.results,
                  executionError: response.error || 'Failed to execute query',
                  results: [],
                  columns: [],
                  rowCount: 0,
                  selectedRowIndex: null
                }
              }
            : tab
        ));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTabs(prev => prev.map(tab => 
        tab.id === targetTabId 
          ? {
              ...tab,
              results: {
                ...tab.results,
                executionError: errorMessage,
                results: [],
                columns: [],
                rowCount: 0,
                selectedRowIndex: null
              }
            }
          : tab
      ));
    } finally {
      setIsExecuting(false);
    }
  }, [dataService]);

  const handleExecute = useCallback(async (selectedQuery?: string) => {
    let queryToExecute = selectedQuery;
    
    // If no selected query, get the current editor value
    if (!queryToExecute && editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        // Execute only the selected text
        queryToExecute = editorRef.current.getModel()?.getValueInRange(selection) || '';
      } else {
        // Execute the entire content of the Monaco editor
        queryToExecute = editorRef.current.getValue() || '';
      }
    }
    
    // Fallback to tab content if editor is not available
    if (!queryToExecute) {
      queryToExecute = activeTab?.queryText || '';
    }
    
    await executeQuery(queryToExecute, activeTabId);
  }, [activeTabId, activeTab?.queryText, executeQuery]);

  const handleRowSelect = useCallback((rowIndex: number) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            results: {
              ...tab.results,
              selectedRowIndex: rowIndex
            }
          }
        : tab
    ));
  }, [activeTabId]);

  const handleChartConfigChange = useCallback((chartConfig: any) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            results: {
              ...tab.results,
              chartConfig: chartConfig ? { ...chartConfig } : null
            }
          }
        : tab
    ));
  }, [activeTabId]);

  const handleResultsDetailsResize = useCallback((deltaX: number) => {
    setResultsDetailsWidth(prev => Math.max(150, Math.min(500, prev + deltaX)));
  }, []);

  const handleResultsDetailsToggle = useCallback(() => {
    setIsResultsDetailsCollapsed(prev => !prev);
  }, []);

  // Compute the selected row object for the details panel
  const selectedRow = useMemo(() => {
    return activeTab?.results.selectedRowIndex !== null ? activeTab.results.results[activeTab.results.selectedRowIndex] : null;
  }, [activeTab?.results.selectedRowIndex, activeTab?.results.results]);

  // Memoize models to prevent unnecessary re-renders
  const memoizedModels = useMemo(() => models, [models]);

  return (
    <div className={`d-flex flex-column h-100 ${className}`} style={{ overflow: 'hidden' }}>
      {/* Tab Header */}
      <div className="border-bottom" style={{ flexShrink: 0, paddingTop: 'calc(0.5rem - 3px)', borderBottomWidth: '1px' }}>
        <div className="d-flex align-items-center">
          <div className="tab-scroll-container d-flex flex-grow-1" style={{ overflow: 'hidden' }}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={() => switchTab(tab.id)}
              >
                <span className="tab-name">
                  {tab.name}
                </span>
                {tab.id !== 'docs' && (
                  <button
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            ))}
            {/* Plus button styled like a tab */}
            <div
              className="tab-item new-tab-tab"
              onClick={createNewTab}
              title="New Query"
            >
              <i className="bi bi-plus"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {activeTabId === 'docs' ? (
          /* Models Documentation */
          <div className="flex-grow-1" style={{ overflow: 'auto', maxHeight: '100%' }}>
            <SchemaDocumentation
              schemaName={selectedSchema || 'default'}
              models={models}
              selectedTable={selectedTable}
              className="h-100"
            />
          </div>
        ) : (
          /* Query Editor and Results */
          <>
            {/* Query Editor */}
            <div className="flex-grow-1" style={{ minHeight: 0 }}>
              <div className="bg-light border-start d-flex flex-column h-100" style={{ overflow: 'hidden' }}>
                <div className="flex-grow-1" style={{ height: '100%', overflow: 'hidden' }}>
                  <Editor
                height="100%"
                language="sql"
                value={activeTab?.queryText || ''}
                onChange={(value) => updateTabQuery(value || '')}
                onMount={(editor, monaco) => {
                  // Store editor reference for completion provider
                  editorRef.current = editor;
                  
                  // Configure SQL language features
                  monaco.languages.register({ id: 'sql' });
                  
                  // Add SQL keywords and syntax highlighting
                  monaco.languages.setMonarchTokensProvider('sql', {
                    tokenizer: {
                      root: [
                        [/[a-zA-Z_$][\w$]*/, {
                          cases: {
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                          }
                        }],
                        [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],
                        [/0[xX][0-9a-fA-F]+[Ll]?/, 'number.hex'],
                        [/\d+[lL]?/, 'number'],
                        [/[;,.]/, 'delimiter'],
                        [/"/, 'string', '@string_double'],
                        [/'/, 'string', '@string_single'],
                        [/\/\*/, 'comment', '@comment'],
                        [/--.*$/, 'comment'],
                      ],
                      string_double: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop']
                      ],
                      string_single: [
                        [/[^\\']+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/'/, 'string', '@pop']
                      ],
                      comment: [
                        [/[^\/*]+/, 'comment'],
                        [/\*\//, 'comment', '@pop'],
                        [/[\/*]/, 'comment']
                      ]
                    },
                    keywords: [
                      'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
                      'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA',
                      'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT', 'IN',
                      'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING',
                      'UNION', 'ALL', 'DISTINCT', 'TOP', 'LIMIT', 'OFFSET', 'ASC', 'DESC',
                      'INT', 'VARCHAR', 'CHAR', 'TEXT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'DATE', 'TIME',
                      'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'BLOB', 'JSON'
                    ]
                  });

                  // Add keyboard shortcuts with refs to avoid stale closures
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                    const currentActiveTabId = currentActiveTabIdRef.current;
                    
                    if (currentActiveTabId !== 'docs') {
                      // Get current editor content
                      const currentEditorContent = editor.getValue() || '';
                      
                      // Update the tab content to ensure it's in sync
                      setTabs(prev => prev.map(tab => 
                        tab.id === currentActiveTabId 
                          ? { ...tab, queryText: currentEditorContent }
                          : tab
                      ));
                      
                      // Execute using the new executeQuery function with explicit tab ID
                      executeQuery(currentEditorContent, currentActiveTabId);
                    }
                  });

                  // Add Ctrl+Space to trigger suggestions
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
                    editor.trigger('', 'editor.action.triggerSuggest', {});
                  });
                }}
                options={{
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  readOnly: false,
                  cursorStyle: 'line',
                  automaticLayout: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'all',
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                    showFunctions: true,
                    showConstructors: true,
                    showFields: true,
                    showVariables: true,
                    showClasses: true,
                    showStructs: true,
                    showInterfaces: true,
                    showModules: true,
                    showProperties: true,
                    showEvents: true,
                    showOperators: true,
                    showUnits: true,
                    showValues: true,
                    showConstants: true,
                    showEnums: true,
                    showEnumMembers: true,
                    showColors: true,
                    showFiles: true,
                    showReferences: true,
                    showFolders: true,
                    showTypeParameters: true,
                    showIssues: true,
                    showUsers: true,
                    showWords: true,
                  },
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false,
                  },
                  parameterHints: {
                    enabled: true,
                  },
                  hover: {
                    enabled: true,
                  },
                  contextmenu: true,
                  mouseWheelZoom: true,
                  multiCursorModifier: 'ctrlCmd',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
                theme="vs"
              />
            </div>
            
            {/* Buttons */}
            <div className="p-3 border-top" style={{ flexShrink: 0 }}>
              <div className="d-flex gap-2">
                <button 
                  className="btn" 
                  style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
                  onClick={() => handleExecute()}
                >
                  <i className="bi bi-play me-1"></i>Execute
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-save me-1"></i>Save
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-clockwise me-1"></i>Format
                </button>
              </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="d-flex" style={{ height: '50%', minHeight: '300px' }}>
              {/* Results Panel */}
              <div className="flex-grow-1" style={{ minWidth: 0, height: '100%' }}>
                <ResultsPanel 
                  results={activeTab?.results.results || []} 
                  columns={activeTab?.results.columns || []}
                  rowCount={activeTab?.results.rowCount || 0}
                  isExecuting={isExecuting}
                  error={activeTab?.results.executionError || null}
                  selectedRowIndex={activeTab?.results.selectedRowIndex || null}
                  onRowSelect={handleRowSelect}
                  metadata={activeTab?.results.executionMetadata || null}
                  spatialColumns={spatialColumns}
                  chartConfig={activeTab?.results.chartConfig || null}
                  onChartConfigChange={handleChartConfigChange}
                  tabId={activeTabId}
                  className="h-100"
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
                  results={activeTab?.results.results || []} 
                  columns={activeTab?.results.columns || []}
                  rowCount={activeTab?.results.rowCount || 0}
                  isExecuting={isExecuting}
                  error={activeTab?.results.executionError || null}
                  selectedRow={selectedRow}
                  isCollapsed={isResultsDetailsCollapsed}
                  onToggle={handleResultsDetailsToggle}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SimpleTabManager;
