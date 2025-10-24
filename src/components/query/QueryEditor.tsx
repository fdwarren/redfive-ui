import React, { useState, useEffect, useCallback, memo } from 'react';
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
  className = ''
}) => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'docs', name: '📋 Models', content: '', isDirty: false },
    { id: '1', name: 'Query 1', content: '', isDirty: false }
  ]);
  const prevQueryLength = React.useRef(0);
  const [activeTabId, setActiveTabId] = useState('1');
  const [tabCounter, setTabCounter] = useState(2);

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
        const textarea = document.querySelector('.query-editor-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight;
        }
      }, 100);
    }
    prevQueryLength.current = queryText.length;
  }, [queryText]); // Removed activeTabId from dependencies

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
    setActiveTabId(newTab.id);
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
      setActiveTabId(newTab.id);
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
      setActiveTabId(newActiveTabId);
      
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
    setActiveTabId(tabId);
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
    const textarea = document.querySelector('.query-editor-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        return textarea.value.substring(start, end).trim();
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
      // Execute the entire query
      onExecute(undefined, activeTabId);
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
      setActiveTabId(newTab.id);
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
    setActiveTabId(newTab.id);
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
      setActiveTabId(tabId);
      
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
    setActiveTabId(tabId);
    
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
          <div className="p-3 d-flex flex-column flex-grow-1">
            <textarea
              className="form-control font-monospace flex-grow-1 query-editor-textarea"
              value={activeTab?.content || ''}
              onChange={(e) => updateTabContent(e.target.value)}
              placeholder="Enter your SQL query here or use the AI Assistant to generate it for you."
              style={{ 
                resize: 'none',
                overflow: 'auto',
                scrollbarWidth: 'thin'
              }}
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
