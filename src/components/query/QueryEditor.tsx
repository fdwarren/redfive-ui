import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import SchemaDocumentation from './SchemaDocumentation';
import type { Tab } from '../../types';

interface QueryEditorProps {
  queryText: string;
  onQueryChange: (query: string) => void;
  onExecute: (query?: string, tabId?: string) => void;
  onSave: () => void;
  onFormat: () => void;
  selectedTable?: any;
  selectedSchema?: string;
  models?: any[];
  onTabSwitch?: (tabId: string) => void;
  onActiveTabChange?: (tabId: string) => void;
  activeTabId?: string;
  className?: string;
}

const QueryEditor: React.FC<QueryEditorProps> = ({
  queryText,
  onQueryChange,
  onExecute,
  onSave,
  onFormat,
  selectedTable,
  selectedSchema,
  models = [],
  onTabSwitch,
  onActiveTabChange,
  activeTabId: propActiveTabId = '1',
  className = ''
}) => {
  console.log('QueryEditor render, models:', models?.length || 0, models);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'docs', name: '📋 Models', content: '', isDirty: false },
    { id: '1', name: 'Query 1', content: '', isDirty: false }
  ]);
  const prevQueryLength = React.useRef(0);
  const activeTabId = propActiveTabId;
  const [tabCounter, setTabCounter] = useState(2);
  const editorRef = useRef<any>(null);

  // Sync queryText prop changes with active tab content (only when queryText actually changes)
  useEffect(() => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, content: queryText, isDirty: true }
          : tab
      )
    );
    
    // Auto-scroll to bottom when content changes (for SQL generation)
    // Check if the query text has grown significantly (indicating new SQL was added)
    if (queryText && queryText.length > prevQueryLength.current && queryText.length - prevQueryLength.current > 10) {
      setTimeout(() => {
        if (editorRef.current) {
          const lineCount = editorRef.current.getModel()?.getLineCount() || 1;
          editorRef.current.revealLine(lineCount);
        }
      }, 100);
    }
    prevQueryLength.current = queryText.length;
  }, [queryText]); // Removed activeTabId from dependencies

  // Recreate completion provider when models change
  React.useEffect(() => {
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

            console.log('Text before position:', textBeforePosition);
            console.log('Dot notation match:', dotNotationMatch);

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
                console.log('Found alias mapping:', alias, '->', tableName);
              }
              
              if (aliasMap.has(identifier)) {
                targetAlias = identifier;
                targetTableName = aliasMap.get(identifier);
                console.log('Column context detected for alias:', identifier, '-> table:', targetTableName);
              } else {
                targetTableName = identifier;
                console.log('Column context detected for table:', identifier);
              }
            }

            // Add table suggestions if models are available and not in column context
            if (models && models.length > 0 && !isColumnContext) {
              console.log('Models available for completion:', models.length);
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
              console.log('Looking for columns in table:', targetTableName, 'Alias:', targetAlias);
              console.log('Available models:', models.map(m => ({ name: m.name || m.table_name, hasColumns: !!m.columns })));
              
              const targetModel = models.find((model: any) => {
                const schema = model.schema || model.schema_name || model.database_schema || 'default';
                const tableName = model.name || model.table_name;
                console.log('Checking model:', { tableName, schema, targetTableName });
                return tableName === targetTableName || `${schema}.${tableName}` === targetTableName;
              });
              
              console.log('Target model found:', targetModel);
              
              if (targetModel && targetModel.columns && Array.isArray(targetModel.columns)) {
                console.log('Found columns for table:', targetModel.columns.length, targetModel.columns);
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
              } else {
                console.log('No columns found for table:', targetTableName, 'Target model:', targetModel);
              }
            }

            if (!models || models.length === 0) {
              console.log('No models available for completion');
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

  // Keep docs tab name as "docs" - no need to update based on selected table

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    tabId: string;
  }>({ show: false, x: 0, y: 0, tabId: '' });

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const createNewTab = () => {
    const newTab: Tab = {
      id: tabCounter.toString(),
      name: `Query ${tabCounter}`,
      content: '',
      isDirty: false
    };
    setTabs(prev => [...prev, newTab]);
    setTabCounter(prev => prev + 1);
    
    // Notify parent component about the new tab
    if (onTabSwitch) {
      onTabSwitch(newTab.id);
    }
    // Notify parent component about active tab change
    if (onActiveTabChange) {
      onActiveTabChange(newTab.id);
    }
  };

  const closeTab = (tabId: string) => {
    // Prevent closing the docs tab
    if (tabId === 'docs') {
      return;
    }
    
    if (tabs.length <= 2) { // docs tab + one query tab
      // If this is the last query tab, create a new empty tab
      const newTab: Tab = {
        id: tabCounter.toString(),
        name: `Query ${tabCounter}`,
        content: '',
        isDirty: false
      };
      setTabs(prev => [...prev.filter(tab => tab.id === 'docs'), newTab]);
      setTabCounter(prev => prev + 1);
      onQueryChange('');
      
      // Notify parent component about the new tab
      if (onTabSwitch) {
        onTabSwitch(newTab.id);
      }
      // Notify parent component about active tab change
      if (onActiveTabChange) {
        onActiveTabChange(newTab.id);
      }
      return;
    }
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // If we closed the active tab, switch to another tab
    if (activeTabId === tabId) {
      const currentIndex = tabs.findIndex(tab => tab.id === tabId);
      const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      const newActiveTabId = newTabs[newActiveIndex].id;
      
      // Notify parent component about the tab switch
      if (onTabSwitch) {
        onTabSwitch(newActiveTabId);
      }
      // Notify parent component about active tab change
      if (onActiveTabChange) {
        onActiveTabChange(newActiveTabId);
      }
    }
  };

  const switchTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      onQueryChange(tab.content);
    }
    // Notify parent component about tab switch
    if (onTabSwitch) {
      onTabSwitch(tabId);
    }
    // Notify parent component about active tab change
    if (onActiveTabChange) {
      onActiveTabChange(tabId);
    }
  };

  const updateTabContent = (content: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, content, isDirty: content !== '' }
        : tab
    ));
    onQueryChange(content);
  };

  const getSelectedText = (): string | null => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        return editorRef.current.getModel()?.getValueInRange(selection) || null;
      }
    }
    return null;
  };

  const handleExecute = useCallback(() => {
    const selectedText = getSelectedText();
    if (selectedText) {
      // Execute only the selected text
      onExecute(selectedText, activeTabId);
    } else {
      // Execute the entire content of the Monaco editor
      const editorValue = editorRef.current?.getValue() || '';
      onExecute(editorValue, activeTabId);
    }
  }, [onExecute, activeTabId]);

  const startEditingTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setEditingTabId(tabId);
      setEditingName(tab.name);
    }
  };

  const finishEditingTab = () => {
    if (editingTabId && editingName.trim()) {
      setTabs(prev => prev.map(tab => 
        tab.id === editingTabId 
          ? { ...tab, name: editingName.trim() }
          : tab
      ));
    }
    setEditingTabId(null);
    setEditingName('');
  };

  const cancelEditingTab = () => {
    setEditingTabId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingTab();
    } else if (e.key === 'Escape') {
      cancelEditingTab();
    }
  };

  const scrollLeft = () => {
    const container = document.querySelector('.tab-scroll-container');
    if (container) {
      const newPosition = Math.max(0, scrollPosition - 200);
      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    const container = document.querySelector('.tab-scroll-container');
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newPosition = Math.min(maxScroll, scrollPosition + 200);
      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  const updateScrollArrows = () => {
    const container = document.querySelector('.tab-scroll-container');
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      setShowLeftArrow(scrollPosition > 0);
      setShowRightArrow(scrollPosition < maxScroll);
    }
  };

  // Update arrows when tabs change or component mounts
  React.useEffect(() => {
    updateScrollArrows();
  }, [tabs, scrollPosition]);

  // Context menu functions
  const showContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      tabId
    });
  };

  const hideContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, tabId: '' });
  };

  const copyTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      const newTab: Tab = {
        id: tabCounter.toString(),
        name: `${tab.name} (Copy)`,
        content: tab.content,
        isDirty: false
      };
      setTabs(prev => [...prev, newTab]);
      setTabCounter(prev => prev + 1);
      
      // Notify parent component about active tab change
      if (onActiveTabChange) {
        onActiveTabChange(newTab.id);
      }
    }
    hideContextMenu();
  };

  const closeAllTabs = () => {
    // Keep the Docs tab and create a new empty query tab
    const docsTab = tabs.find(t => t.id === 'docs');
    const newTab: Tab = {
      id: tabCounter.toString(),
      name: `Query ${tabCounter}`,
      content: '',
      isDirty: false
    };
    setTabs([docsTab, newTab].filter((tab): tab is Tab => tab !== undefined));
    setTabCounter(prev => prev + 1);
    onQueryChange('');
    
    // Notify parent component about active tab change
    if (onActiveTabChange) {
      onActiveTabChange(newTab.id);
    }
    hideContextMenu();
  };

  const closeOthers = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    const docsTab = tabs.find(t => t.id === 'docs');
    if (tab) {
      // Always keep the Docs tab, plus the selected tab (if it's not the Docs tab)
      const tabsToKeep = tabId === 'docs' ? [docsTab] : [docsTab, tab];
      setTabs(tabsToKeep.filter((tab): tab is Tab => tab !== undefined));
      
      // Notify parent component about active tab change
      if (onActiveTabChange) {
        onActiveTabChange(tabId);
      }
    }
    hideContextMenu();
  };

  const closeOthersToRight = (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const docsTab = tabs.find(t => t.id === 'docs');
    const newTabs = tabs.slice(0, tabIndex + 1);
    
    // Ensure the Docs tab is always included
    if (docsTab && !newTabs.includes(docsTab)) {
      newTabs.unshift(docsTab);
    }
    setTabs(newTabs);
    
    // Notify parent component about active tab change
    if (onActiveTabChange) {
      onActiveTabChange(tabId);
    }
    hideContextMenu();
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        hideContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Only execute if we're not in the docs tab and not editing a tab name
        if (activeTabId !== 'docs' && !editingTabId) {
          e.preventDefault();
          handleExecute();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, editingTabId, handleExecute]);

  return (
    <div className={`bg-light border-start d-flex flex-column h-100 ${className}`} style={{ overflow: 'hidden' }}>
      {/* Header with Tabs */}
      <div className="border-bottom" style={{ flexShrink: 0, paddingTop: 'calc(0.5rem - 3px)', borderBottomWidth: '1px' }}>
        <div className="d-flex align-items-center">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              className="scroll-arrow scroll-arrow-left"
              onClick={scrollLeft}
              title="Scroll left"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          )}
          
          {/* Tab container with scroll */}
          <div className="tab-scroll-container d-flex flex-grow-1" style={{ overflow: 'hidden' }}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={() => switchTab(tab.id)}
                onContextMenu={(e) => showContextMenu(e, tab.id)}
              >
                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={finishEditingTab}
                    onKeyDown={handleKeyPress}
                    className="tab-edit-input"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span 
                      className="tab-name"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditingTab(tab.id);
                      }}
                    >
                      {tab.name}
                    </span>
                  </>
                )}
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
          
          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              className="scroll-arrow scroll-arrow-right"
              onClick={scrollRight}
              title="Scroll right"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Content area - takes up most of the space */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {activeTabId === 'docs' ? (
          <div className="flex-grow-1" style={{ overflow: 'auto', maxHeight: '100%' }}>
            <SchemaDocumentation
              schemaName={selectedSchema || 'default'}
              models={models}
              selectedTable={selectedTable}
              className="h-100"
            />
          </div>
        ) : (
          <div className="flex-grow-1" style={{ height: '100%', overflow: 'hidden' }}>
            <Editor
              height="100%"
              language="sql"
              value={activeTab?.content || ''}
              onChange={(value) => updateTabContent(value || '')}
              onMount={(editor, monaco) => {
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

                // Store completion provider reference for cleanup
                const completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
                  triggerCharacters: [' ', '.', ',', '(', ')', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
                  provideCompletionItems: (model, position) => {
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

                    console.log('Text before position:', textBeforePosition);
                    console.log('Dot notation match:', dotNotationMatch);

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
                        console.log('Found alias mapping:', alias, '->', tableName);
                      }
                      
                      if (aliasMap.has(identifier)) {
                        targetAlias = identifier;
                        targetTableName = aliasMap.get(identifier);
                        console.log('Column context detected for alias:', identifier, '-> table:', targetTableName);
                      } else {
                        targetTableName = identifier;
                        console.log('Column context detected for table:', identifier);
                      }
                    }

                    // Add table suggestions if models are available and not in column context
                    if (models && models.length > 0 && !isColumnContext) {
                      console.log('Models available for completion:', models.length);
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
                      console.log('Looking for columns in table:', targetTableName, 'Alias:', targetAlias);
                      console.log('Available models:', models.map(m => ({ name: m.name || m.table_name, hasColumns: !!m.columns })));
                      
                      const targetModel = models.find((model: any) => {
                        const schema = model.schema || model.schema_name || model.database_schema || 'default';
                        const tableName = model.name || model.table_name;
                        console.log('Checking model:', { tableName, schema, targetTableName });
                        return tableName === targetTableName || `${schema}.${tableName}` === targetTableName;
                      });
                      
                      console.log('Target model found:', targetModel);
                      
                      if (targetModel && targetModel.columns && Array.isArray(targetModel.columns)) {
                        console.log('Found columns for table:', targetModel.columns.length, targetModel.columns);
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
                      } else {
                        console.log('No columns found for table:', targetTableName, 'Target model:', targetModel);
                      }
                    }

                    if (!models || models.length === 0) {
                      console.log('No models available for completion');
                    }

                    return { suggestions };
                  }
                });

                // Store completion provider for cleanup
                editorRef.current.completionProvider = completionProvider;

                // Add keyboard shortcuts
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                  handleExecute();
                });

                // Add Ctrl+Space to trigger suggestions
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
                  editor.trigger('', 'editor.action.triggerSuggest', {});
                });

                // Auto-scroll to bottom when content changes (for SQL generation)
                editor.onDidChangeModelContent(() => {
                  if (queryText && queryText.length > prevQueryLength.current && queryText.length - prevQueryLength.current > 10) {
                    setTimeout(() => {
                      editor.revealLine(editor.getModel()?.getLineCount() || 1);
                    }, 100);
                  }
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
        )}
      </div>
      
      {/* Buttons - fixed at bottom - only show when not in models tab */}
      {activeTabId !== 'docs' && (
        <div className="p-3 border-top" style={{ flexShrink: 0 }}>
          <div className="d-flex gap-2">
            <button 
              className="btn" 
              style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
              onClick={handleExecute}
            >
              <i className="bi bi-play me-1"></i>Execute
            </button>
            <button className="btn btn-outline-secondary" onClick={onSave}>
              <i className="bi bi-save me-1"></i>Save
            </button>
            <button className="btn btn-outline-secondary" onClick={onFormat}>
              <i className="bi bi-arrow-clockwise me-1"></i>Format
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={() => copyTab(contextMenu.tabId)}>
            <i className="bi bi-files me-2"></i>Duplicate Tab
          </div>
          <div className="context-menu-item" onClick={closeAllTabs}>
            <i className="bi bi-x-square me-2"></i>Close All
          </div>
          <div className="context-menu-item" onClick={() => closeOthers(contextMenu.tabId)}>
            <i className="bi bi-x-circle me-2"></i>Close Others
          </div>
          <div className="context-menu-item" onClick={() => closeOthersToRight(contextMenu.tabId)}>
            <i className="bi bi-arrow-right-square me-2"></i>Close Others to the Right
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(QueryEditor);
