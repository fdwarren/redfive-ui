import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import ResultsPanel from '../results/ResultsPanel';
import ResultsDetailsPanel from '../results/ResultsDetailsPanel';
import SchemaDocumentation from './SchemaDocumentation';
import SaveQueryModal from './SaveQueryModal';
import ResizeHandle from '../layout/ResizeHandle';
import VerticalResizeHandle from '../layout/VerticalResizeHandle';
import DataService from '../../services/DataService';
import type { Tab, SavedQueryRequest } from '../../types';


interface SimpleTabManagerProps {
  selectedTable?: any;
  selectedSchema?: string;
  models?: any[];
  spatialColumns?: string[];
  selectedQuery?: any;
  generatedSql?: string | null;
  onTableSelect?: (table: any) => void;
  onSchemaSelect?: (schema: string) => void;
  onModelsLoaded?: (models: any[]) => void;
  onGenerateSelect?: (table: any) => void;
  onSpatialColumnsLoaded?: (columns: string[]) => void;
  onTableDocumentationSelect?: (table: any) => void;
  onSqlGenerated?: (sql: string) => void;
  onQueryLoaded?: () => void;
  onSqlLoaded?: () => void;
  onQuerySaved?: () => void;
  className?: string;
}

const SimpleTabManager: React.FC<SimpleTabManagerProps> = ({
  selectedTable,
  selectedSchema,
  models = [],
  spatialColumns = [],
  selectedQuery,
  generatedSql: _generatedSql,
  onTableSelect: _onTableSelect,
  onSchemaSelect: _onSchemaSelect,
  onModelsLoaded: _onModelsLoaded,
  onGenerateSelect: _onGenerateSelect,
  onSpatialColumnsLoaded: _onSpatialColumnsLoaded,
  onTableDocumentationSelect: _onTableDocumentationSelect,
  onSqlGenerated: _onSqlGenerated,
  onQueryLoaded: _onQueryLoaded,
  onSqlLoaded: _onSqlLoaded,
  onQuerySaved,
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
  const [isResultsDetailsCollapsed, setIsResultsDetailsCollapsed] = useState(true);
  const [resultsDetailsWidth, setResultsDetailsWidth] = useState(300);
  const [queryEditorHeight, setQueryEditorHeight] = useState(50); // Percentage
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Handle selected query from ModelExplorer
  useEffect(() => {
    if (selectedQuery) {
      // Create a new tab for the selected query
      const newTab: Tab = {
        id: tabCounter.toString(),
        name: selectedQuery.name || 'Saved Query',
        queryText: selectedQuery.sqlText || '',
        results: {
          results: [],
          columns: [],
          rowCount: 0,
          executionError: null,
          executionMetadata: null,
          selectedRowIndex: null,
          chartConfig: selectedQuery.chartConfig || null
        },
        originalQuery: selectedQuery
      };
      
      setTabs(prev => [...prev, newTab]);
      setTabCounter(prev => prev + 1);
      setActiveTabId(newTab.id);
      
      // Notify parent that query was loaded
      if (_onQueryLoaded) {
        _onQueryLoaded();
      }
    }
  }, [selectedQuery, tabCounter, _onQueryLoaded]);

  // Handle showing schema documentation when schema is selected
  useEffect(() => {
    if (selectedSchema) {
      setActiveTabId('docs');
    }
  }, [selectedSchema]);

  // Handle generated SQL from AI assistant
  useEffect(() => {
    if (_generatedSql) {
      // Update the active tab's query text with the generated SQL
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId ? { ...tab, queryText: _generatedSql } : tab
      ));
      // Notify parent that SQL was loaded
      if (_onSqlLoaded) {
        _onSqlLoaded();
      }
    }
  }, [_generatedSql, activeTabId, _onSqlLoaded]);

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

            // Add PostgreSQL SELECT keywords
            const sqlKeywords = [
              // Core SELECT
              { label: 'SELECT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'SELECT', documentation: 'Select data from tables' },
              { label: 'FROM', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'FROM', documentation: 'Specify the source table(s)' },
              { label: 'WHERE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'WHERE', documentation: 'Filter rows based on conditions' },
              { label: 'GROUP BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'GROUP BY', documentation: 'Group rows by columns' },
              { label: 'HAVING', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'HAVING', documentation: 'Filter groups' },
              { label: 'ORDER BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ORDER BY', documentation: 'Sort the result set' },
              { label: 'LIMIT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LIMIT', documentation: 'Limit the number of rows returned' },
              { label: 'OFFSET', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'OFFSET', documentation: 'Skip a number of rows' },
              { label: 'DISTINCT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DISTINCT', documentation: 'Remove duplicate rows' },
              { label: 'ALL', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ALL', documentation: 'Include all rows' },
              { label: 'AS', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'AS', documentation: 'Create an alias' },

              // Joins
              { label: 'JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'JOIN', documentation: 'Join tables together' },
              { label: 'INNER JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INNER JOIN', documentation: 'Inner join tables' },
              { label: 'LEFT JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LEFT JOIN', documentation: 'Left outer join tables' },
              { label: 'RIGHT JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'RIGHT JOIN', documentation: 'Right outer join tables' },
              { label: 'FULL JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'FULL JOIN', documentation: 'Full outer join tables' },
              { label: 'CROSS JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'CROSS JOIN', documentation: 'Cross join tables' },
              { label: 'NATURAL JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'NATURAL JOIN', documentation: 'Natural join tables' },
              { label: 'ON', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ON', documentation: 'Specify join condition' },
              { label: 'USING', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'USING', documentation: 'Specify columns for natural join' },

              // Subqueries and set operators
              { label: 'UNION', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'UNION', documentation: 'Combine result sets' },
              { label: 'UNION ALL', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'UNION ALL', documentation: 'Combine result sets including duplicates' },
              { label: 'INTERSECT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INTERSECT', documentation: 'Find common rows' },
              { label: 'EXCEPT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'EXCEPT', documentation: 'Find rows in first set but not second' },
              { label: 'IN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'IN', documentation: 'Check if value is in list' },
              { label: 'EXISTS', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'EXISTS', documentation: 'Check if subquery returns rows' },
              { label: 'ANY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ANY', documentation: 'Compare with any value in list' },
              { label: 'SOME', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'SOME', documentation: 'Compare with some values in list' },

              // Aggregates
              { label: 'COUNT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'COUNT', documentation: 'Count number of rows' },
              { label: 'SUM', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'SUM', documentation: 'Sum of values' },
              { label: 'AVG', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'AVG', documentation: 'Average of values' },
              { label: 'MIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'MIN', documentation: 'Minimum value' },
              { label: 'MAX', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'MAX', documentation: 'Maximum value' },

              // Conditional / scalar functions
              { label: 'CASE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'CASE', documentation: 'Conditional expression' },
              { label: 'WHEN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'WHEN', documentation: 'Condition in CASE statement' },
              { label: 'THEN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'THEN', documentation: 'Result in CASE statement' },
              { label: 'ELSE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ELSE', documentation: 'Default result in CASE statement' },
              { label: 'END', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'END', documentation: 'End of CASE statement' },
              { label: 'COALESCE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'COALESCE', documentation: 'Return first non-null value' },
              { label: 'NULLIF', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'NULLIF', documentation: 'Return null if values are equal' },
              { label: 'GREATEST', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'GREATEST', documentation: 'Return largest value' },
              { label: 'LEAST', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LEAST', documentation: 'Return smallest value' },
              { label: 'CAST', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'CAST', documentation: 'Convert data type' },

              // Filters and comparisons
              { label: 'LIKE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LIKE', documentation: 'Pattern matching' },
              { label: 'ILIKE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ILIKE', documentation: 'Case-insensitive pattern matching' },
              { label: 'NOT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'NOT', documentation: 'Logical NOT operator' },
              { label: 'AND', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'AND', documentation: 'Logical AND operator' },
              { label: 'OR', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'OR', documentation: 'Logical OR operator' },
              { label: 'BETWEEN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'BETWEEN', documentation: 'Check if value is between two values' },
              { label: 'IS', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'IS', documentation: 'Check for null or boolean values' },
              { label: 'IS NULL', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'IS NULL', documentation: 'Check if value is null' },
              { label: 'IS NOT NULL', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'IS NOT NULL', documentation: 'Check if value is not null' },

              // Sorting and windowing
              { label: 'ASC', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ASC', documentation: 'Ascending sort order' },
              { label: 'DESC', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DESC', documentation: 'Descending sort order' },
              { label: 'ROW_NUMBER', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ROW_NUMBER', documentation: 'Row number window function' },
              { label: 'RANK', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'RANK', documentation: 'Rank window function' },
              { label: 'DENSE_RANK', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DENSE_RANK', documentation: 'Dense rank window function' },
              { label: 'NTILE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'NTILE', documentation: 'NTILE window function' },
              { label: 'OVER', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'OVER', documentation: 'Window function clause' },
              { label: 'PARTITION BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'PARTITION BY', documentation: 'Partition window function' },
              { label: 'WINDOW', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'WINDOW', documentation: 'Define named window' },

              // Common Table Expressions
              { label: 'WITH', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'WITH', documentation: 'Common table expression' },
              { label: 'RECURSIVE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'RECURSIVE', documentation: 'Recursive common table expression' },
              { label: 'LATERAL', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LATERAL', documentation: 'Lateral join' },

              // Miscellaneous read-safe clauses
              { label: 'VALUES', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'VALUES', documentation: 'Define values for INSERT' },
              { label: 'FETCH', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'FETCH', documentation: 'Fetch rows from cursor' },
              { label: 'NEXT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'NEXT', documentation: 'Next row in cursor' },
              { label: 'ONLY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ONLY', documentation: 'Only rows, not including ties' },
              { label: 'TOP', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'TOP', documentation: 'Top N rows' },
              { label: 'EXPLAIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'EXPLAIN', documentation: 'Explain query execution plan' },
              { label: 'ANALYZE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ANALYZE', documentation: 'Analyze query execution' },
              { label: 'DISTINCT ON', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DISTINCT ON', documentation: 'Distinct on specific columns' }
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
      const response = await DataService.instance.executeSql(queryToExecute);
      
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
  }, []);

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

  const handleVerticalResize = useCallback((deltaY: number) => {
    setQueryEditorHeight(prev => {
      const newHeight = prev + (deltaY / window.innerHeight) * 100;
      return Math.max(20, Math.min(80, newHeight)); // Min 20%, Max 80%
    });
  }, []);

  const handleSaveQuery = useCallback(async () => {
    if (activeTabId === 'docs') {
      return; // Don't save the docs tab
    }
    
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) {
      return;
    }
    
    // Check if this is a previously saved query
    if (activeTab.originalQuery) {
      // Query was previously saved, save it silently
      setIsSaving(true);
      try {
        const queryData: SavedQueryRequest = {
          guid: activeTab.originalQuery.guid, // Use existing GUID
          name: activeTab.originalQuery.name,
          description: activeTab.originalQuery.description,
          sqlText: activeTab.queryText,
          chartConfig: activeTab.results.chartConfig,
          isPublic: activeTab.originalQuery.isPublic
        };

        const response = await DataService.instance.saveQuery(queryData);
        
        if (response) {
          if (onQuerySaved) {
            onQuerySaved();
          }
        } else {
          throw new Error('Failed to save query');
        }
      } catch (error) {
        console.error('Error saving query:', error);
        // You could add a toast notification here for errors
      } finally {
        setIsSaving(false);
      }
    } else {
      // New query, show the save dialog
      setIsSaveModalOpen(true);
    }
  }, [activeTabId, tabs, onQuerySaved]);

  const handleSaveQuerySubmit = useCallback(async (data: { name: string; description: string; isPublic: boolean }) => {
    if (activeTabId === 'docs') {
      return;
    }

    setIsSaving(true);
    try {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      if (!activeTab) {
        throw new Error('No active tab found');
      }

      const queryData: SavedQueryRequest = {
        guid: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        sqlText: activeTab.queryText,
        chartConfig: activeTab.results.chartConfig,
        isPublic: data.isPublic
      };

      const response = await DataService.instance.saveQuery(queryData);
      
      if (response) {
        setIsSaveModalOpen(false);
        // Notify parent component that a query was saved
        if (onQuerySaved) {
          onQuerySaved();
        }
      } else {
        throw new Error('Failed to save query');
      }
    } catch (error) {
      console.error('Error saving query:', error);
      // You could add a toast notification here
    } finally {
      setIsSaving(false);
    }
  }, [activeTabId, tabs, onQuerySaved]);

  const handleSaveModalClose = useCallback(() => {
    if (!isSaving) {
      setIsSaveModalOpen(false);
    }
  }, [isSaving]);

  // Compute the selected row object for the details panel
  const selectedRow = useMemo(() => {
    return activeTab?.results.selectedRowIndex !== null && activeTab?.results.results ? activeTab.results.results[activeTab.results.selectedRowIndex] : null;
  }, [activeTab?.results.selectedRowIndex, activeTab?.results.results]);


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
            <div style={{ height: `${queryEditorHeight}%`, minHeight: 0 }}>
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
                      // Core SELECT
                      'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
                      'DISTINCT', 'ALL', 'AS',
                      
                      // Joins
                      'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'NATURAL', 'ON', 'USING',
                      
                      // Subqueries and set operators
                      'UNION', 'INTERSECT', 'EXCEPT', 'IN', 'EXISTS', 'ANY', 'SOME',
                      
                      // Aggregates
                      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
                      
                      // Conditional / scalar functions
                      'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST', 'CAST',
                      
                      // Filters and comparisons
                      'LIKE', 'ILIKE', 'NOT', 'AND', 'OR', 'BETWEEN', 'IS', 'NULL',
                      
                      // Sorting and windowing
                      'ASC', 'DESC', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'OVER', 'PARTITION', 'WINDOW',
                      
                      // Common Table Expressions
                      'WITH', 'RECURSIVE', 'LATERAL',
                      
                      // Miscellaneous read-safe clauses
                      'VALUES', 'FETCH', 'NEXT', 'ONLY', 'TOP', 'EXPLAIN', 'ANALYZE'
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
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleSaveQuery}
                  disabled={activeTabId === 'docs' || isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-1"></i>Save
                    </>
                  )}
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-clockwise me-1"></i>Format
                </button>
              </div>
                </div>
              </div>
            </div>

            {/* Vertical Resize Handle */}
            <VerticalResizeHandle onResize={handleVerticalResize} />

            {/* Results Section */}
            <div className="d-flex" style={{ height: `${100 - queryEditorHeight}%`, minHeight: '200px' }}>
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

      {/* Save Query Modal */}
      <SaveQueryModal
        isOpen={isSaveModalOpen}
        onClose={handleSaveModalClose}
        onSave={handleSaveQuerySubmit}
        defaultName={activeTab?.name || 'New Query'}
        isSaving={isSaving}
      />
    </div>
  );
};

export default SimpleTabManager;
