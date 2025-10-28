import React, { useState, useEffect, memo, useMemo } from 'react';
import DataService from '../../services/DataService';
import { GlobalContext, type SavedQuery } from '../../services/GlobalContext';
import { useGlobalState } from '../../hooks/useGlobalState';
import ConfirmationModal from '../common/ConfirmationModal';

interface ModelExplorerProps {
  className?: string;
}

const ModelExplorer: React.FC<ModelExplorerProps> = ({ className = '' }) => {
  const { updateSelectionState, showError, showSuccess } = useGlobalState();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'databases': true,
    'production': true,
    'schemas': true,
    'saved-queries': false
  });
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: 'table' | 'column' | 'query';
    item: any;
  }>({ show: false, x: 0, y: 0, type: 'table', item: null });
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    query: SavedQuery | null;
    isDeleting: boolean;
  }>({ isOpen: false, query: null, isDeleting: false });
  
  // Set up GlobalContext listeners
  useEffect(() => {
    const modelsListener = () => {
      setModels(GlobalContext.instance.getModels());
    };

    const savedQueriesListener = () => {
      const queries = GlobalContext.instance.getSavedQueries();
      setSavedQueries(queries);
    };

    GlobalContext.instance.addModelsChangedListener(modelsListener);
    GlobalContext.instance.addSavedQueriesChangedListener(savedQueriesListener);

    return () => {
      GlobalContext.instance.removeModelsChangedListener(modelsListener);
      GlobalContext.instance.removeSavedQueriesChangedListener(savedQueriesListener);
    };
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };


  const schemaMap = useMemo(() => {
    return GlobalContext.instance.getSchemaMap();
  }, [models]);

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
        const modelsArray = await DataService.instance.listModels();
        GlobalContext.instance.setModels(modelsArray);
        
        const newExpandedFolders: Record<string, boolean> = {
          'databases': true,
          'production': true,
          'schemas': true,
          'saved-queries': false
        };
        
        Object.keys(schemaMap).forEach(schema => {
          newExpandedFolders[`schema-${schema}`] = true;
        });
        
        setExpandedFolders(newExpandedFolders);
    } catch (error) {
      console.error('Error loading models', error);
      showError('Failed to load models');
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const loadSavedQueries = async () => {
    setIsLoadingQueries(true);
    try {
      const queries = await DataService.instance.listQueries();
      GlobalContext.instance.setSavedQueries(queries);
    } catch (error) {
      console.error('Error loading saved queries', error);
      showError('Failed to load saved queries');
      GlobalContext.instance.setSavedQueries([]);
    } finally {
      setIsLoadingQueries(false);
    }
  };

  // Load models on component mount
  useEffect(() => {
    loadModels();
    loadSavedQueries();
  }, []);


  const showContextMenu = (e: React.MouseEvent, type: 'table' | 'column' | 'query', item: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      item
    });
  };

  const hideContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, type: 'table', item: null });
  };


  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        hideContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  return (
    <div className={`bg-light border-end d-flex flex-column h-100 ${className}`} style={{ overflow: 'hidden' }}>
      <div className="p-2 border-bottom panel-header" style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="text-muted mb-0 d-flex align-items-center">
            <i className="bi bi-folder me-2"></i>Model Explorer
          </h6>
          <div className="d-flex gap-1">
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                loadModels();
                loadSavedQueries();
              }}
              disabled={isLoadingModels || isLoadingQueries}
              title="Reload models and queries"
            >
              {(isLoadingModels || isLoadingQueries) ? (
                <i className="bi bi-hourglass-split"></i>
              ) : (
                <i className="bi bi-arrow-clockwise"></i>
              )}
            </button>
          </div>
        </div>
      </div>
      <div 
        className="flex-grow-1" 
        style={{ height: '0', minHeight: '0', overflowY: 'auto', overflowX: 'hidden' }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
          {isLoadingModels ? (
            <div className="p-3 text-center">
              <div className="spinner-border spinner-border-sm text-muted" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="small text-muted mt-2">Loading models...</div>
            </div>
          ) : models.length > 0 ? (
            <>
              {/* Schemas Folder - Contains all database schemas */}
              <div className="explorer-item">
                <div 
                  className="explorer-folder" 
                  onClick={() => {
                    // Always toggle folder first
                    toggleFolder('schemas');
                    
                    // Always select "all schemas" when clicking on the Schemas node
                    updateSelectionState({ selectedSchema: 'default', selectedTable: null });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`bi ${expandedFolders['schemas'] ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`}></i>
                  <i className="bi bi-folder me-2"></i>
                  <span>Schemas</span>
                </div>
                {expandedFolders['schemas'] && (
                  <div className="explorer-children">
                    {/* Models organized by schema */}
                    {Object.entries(schemaMap)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([schema, tables]) => (
                        <div key={schema} className="explorer-item">
                          <div 
                            className="explorer-folder" 
                            onClick={() => {
                              // Always toggle folder first
                              toggleFolder(`schema-${schema}`);
                              
                              // Always select the schema when clicking on it
                              updateSelectionState({ selectedSchema: schema, selectedTable: null });
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <i className={`bi ${expandedFolders[`schema-${schema}`] ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`}></i>
                            <i className="bi bi-folder me-2"></i>
                            <span>{schema}</span>
                          </div>
                          {expandedFolders[`schema-${schema}`] && (
                            <div className="explorer-children">
                              {Object.entries(tables)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([tableName, columns]) => {
                                  // Find the full table model for this table
                                  const tableModel = Array.isArray(models) ? models.find(model => 
                                    model.name === tableName
                                  ) : null;
                                  
                                  return (
                                  <div key={tableName} className="explorer-item">
                                    <div 
                                      className="explorer-folder" 
                                      onClick={() => {
                                        toggleFolder(`table-${schema}-${tableName}`);
                                        if (tableModel) {
                                          updateSelectionState({ selectedTable: tableModel });
                                        }
                                      }}
                                      onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        showContextMenu(e, 'table', tableModel || { name: tableName, schema: schema });
                                      }}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <i className={`bi ${expandedFolders[`table-${schema}-${tableName}`] ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`}></i>
                                      <i className="bi bi-table me-2"></i>
                                      <span>{tableName}</span>
                                    </div>
                                  {expandedFolders[`table-${schema}-${tableName}`] && (
                                    <div className="explorer-children">
                                      {columns.map((column: any) => (
                                        <div 
                                          key={column.name} 
                                          className="explorer-file"
                                          onClick={() => {
                                            // Column selection could be handled here if needed
                                            console.log('Column selected:', column.name);
                                          }}
                                          onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            showContextMenu(e, 'column', column);
                                          }}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <i className="bi bi-columns me-2"></i>
                                          <span>{column.name}{column.spatial_type === 'point' ? <span style={{color: '#aa0000'}}>*</span> : column.spatial_type === 'polyline' ? <span style={{color: '#aa0000'}}>**</span> : column.spatial_type === 'polygon' ? <span style={{color: '#aa0000'}}>***</span> : ''}</span>
                                          <span className="text-muted small ms-2">({column.type})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Saved Queries Folder */}
              <div className="explorer-item">
                <div 
                  className="explorer-folder" 
                  onClick={() => toggleFolder('saved-queries')}
                >
                  <i className={`bi ${expandedFolders['saved-queries'] ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`}></i>
                  <i className="bi bi-folder me-2"></i>
                  <span>Saved Queries</span>
                </div>
                {expandedFolders['saved-queries'] && (
                  <div className="explorer-children">
                    {isLoadingQueries ? (
                      <div className="p-2 text-center">
                        <div className="spinner-border spinner-border-sm text-muted" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="small text-muted mt-1">Loading queries...</div>
                      </div>
                    ) : (() => {
                      return savedQueries.length > 0;
                    })() ? (
                      savedQueries.map((query) => (
                        <div 
                          key={query.guid} 
                          className="explorer-file"
                          onClick={() => {
                            updateSelectionState({ selectedQuery: query });
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showContextMenu(e, 'query', query);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-file-text me-2"></i>
                          <span>{query.name}</span>
                          {query.isPublic && (
                            <i className="bi bi-globe ms-2 text-info" title="Public query"></i>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted">
                        <i className="bi bi-file-text fs-4 mb-1"></i>
                        <div className="small">No saved queries</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-3 text-center text-muted">
              <i className="bi bi-database fs-1 mb-2"></i>
              <div>No models loaded</div>
              <small>Models will appear here once loaded</small>
            </div>
          )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '4px 0',
            minWidth: '180px',
            fontSize: '14px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'table' && (
            <div 
              className="context-menu-item"
              onClick={() => {
                // Generate select for table - this could trigger SQL generation
                console.log('Generate select for table:', contextMenu.item);
                setContextMenu({ show: false, x: 0, y: 0, type: 'table', item: null });
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <i className="bi bi-code-slash text-success"></i>
              <span>Generate Select</span>
            </div>
          )}
          {contextMenu.type === 'query' && (
            <div 
              className="context-menu-item"
              onClick={() => {
                const query = contextMenu.item as SavedQuery;
                setDeleteModal({ isOpen: true, query, isDeleting: false });
                setContextMenu({ show: false, x: 0, y: 0, type: 'table', item: null });
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <i className="bi bi-trash text-danger"></i>
              <span>Delete Query</span>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, query: null, isDeleting: false })}
        onConfirm={async () => {
          if (!deleteModal.query) return;
          
          setDeleteModal(prev => ({ ...prev, isDeleting: true }));
          
          try {
            await DataService.instance.deleteQuery(deleteModal.query.guid);
            showSuccess(`Query "${deleteModal.query.name}" deleted successfully`);
            // Reload the saved queries to reflect the change
            loadSavedQueries();
            setDeleteModal({ isOpen: false, query: null, isDeleting: false });
          } catch (error) {
            console.error('Error deleting query:', error);
            showError('Failed to delete query');
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
          }
        }}
        title="Delete Query"
        message={deleteModal.query ? `Are you sure you want to delete the query "${deleteModal.query.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        isProcessing={deleteModal.isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default memo(ModelExplorer);
