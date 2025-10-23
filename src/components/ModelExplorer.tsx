import React, { useState, useEffect, memo, useMemo } from 'react';
import DataService from '../services/DataService';

interface ModelExplorerProps {
  className?: string;
  onTableSelect?: (table: any) => void;
  onColumnSelect?: (column: string) => void;
  onSchemaSelect?: (schema: string) => void;
  onModelsLoaded?: (models: any[]) => void;
  onGenerateSelect?: (table: any) => void;
  onSpatialColumnsLoaded?: (spatialColumns: string[]) => void;
}

const ModelExplorer: React.FC<ModelExplorerProps> = ({ className = '', onTableSelect, onColumnSelect, onSchemaSelect, onModelsLoaded, onGenerateSelect, onSpatialColumnsLoaded }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'databases': true,
    'production': true,
    'saved-queries': false
  });
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: 'table' | 'column';
    item: any;
  }>({ show: false, x: 0, y: 0, type: 'table', item: null });
  
  // Initialize DataService
  const dataService = new DataService();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const organizeModelsBySchema = (models: any) => {
    const schemaMap: Record<string, Record<string, any[]>> = {};
    
    // Handle case where models might be wrapped in an object or not be an array
    let modelsArray: any[] = [];
    if (Array.isArray(models)) {
      modelsArray = models;
    } else if (models && Array.isArray(models.data)) {
      modelsArray = models.data;
    } else if (models && models.models && Array.isArray(models.models)) {
      modelsArray = models.models;
    } else {
      console.warn('Models data is not in expected format:', models);
      return schemaMap;
    }
    
    modelsArray.forEach(model => {
      // Try different possible schema field names
      const schema = model.schema || model.schema_name || model.database_schema || 'default';
      const tableName = model.name || model.table_name;
      
      // Model processing is now memoized, so this won't log on every render
      
      if (!schemaMap[schema]) {
        schemaMap[schema] = {};
      }
      if (!schemaMap[schema][tableName]) {
        schemaMap[schema][tableName] = [];
      }
      
      // Add columns to the table
      if (model.columns) {
        schemaMap[schema][tableName] = model.columns;
      }
    });
    
    // Sort columns within each table
    Object.keys(schemaMap).forEach(schema => {
      Object.keys(schemaMap[schema]).forEach(table => {
        schemaMap[schema][table].sort((a: any, b: any) => a.name.localeCompare(b.name));
      });
    });
    
    return schemaMap;
  };

  const extractSpatialColumns = (models: any[]): string[] => {
    const spatialColumns: string[] = [];
    
    models.forEach(model => {
      if (model.columns && Array.isArray(model.columns)) {
        model.columns.forEach((column: any) => {
          if (column.spatial_type && column.spatial_type !== null && column.spatial_type !== '') {
            spatialColumns.push(column.name);
          }
        });
      }
    });
    
    return spatialColumns;
  };

  // Memoize the schema organization to prevent unnecessary re-processing
  const schemaMap = useMemo(() => {
    if (models.length === 0) return {};
    return organizeModelsBySchema(models);
  }, [models]);

  const loadModels = async () => {
    console.log('Starting to load models...');
    setIsLoadingModels(true);
    try {
      const response = await dataService.getModels();
      console.log('Models response:', response);
      
      if (response.success && response.data) {
        console.log('Models response data:', response.data);
        console.log('Models data type:', typeof response.data);
        console.log('Is array:', Array.isArray(response.data));
        console.log('Models length:', response.data?.length);
        
        // Extract models array from the response structure
        let modelsArray = [];
        if (Array.isArray(response.data)) {
          modelsArray = response.data;
        } else if (response.data.models && Array.isArray(response.data.models)) {
          modelsArray = response.data.models;
        } else {
          console.warn('Could not find models array in response:', response.data);
          setModels([]);
          return;
        }
        
        console.log('Extracted models array:', modelsArray);
        setModels(modelsArray);
        
        // Extract spatial columns from models
        const spatialColumns = extractSpatialColumns(modelsArray);
        console.log('Extracted spatial columns:', spatialColumns);
        
        // Notify parent component about loaded models
        if (onModelsLoaded) {
          onModelsLoaded(modelsArray);
        }
        
        // Notify parent component about spatial columns
        if (onSpatialColumnsLoaded) {
          onSpatialColumnsLoaded(spatialColumns);
        }
        
        // Update expanded folders to include schemas
        const schemaMap = organizeModelsBySchema(modelsArray);
        const newExpandedFolders: Record<string, boolean> = {
          'databases': true,
          'production': true,
          'saved-queries': false
        };
        
        // Add schemas to expanded folders
        Object.keys(schemaMap).forEach(schema => {
          newExpandedFolders[`schema-${schema}`] = true;
        });
        
        setExpandedFolders(newExpandedFolders);
      } else {
        console.error('Failed to load models:', response.error);
        setModels([]);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  // Notify parent when models change
  useEffect(() => {
    if (models.length > 0 && onModelsLoaded) {
      onModelsLoaded(models);
    }
  }, [models, onModelsLoaded]);


  const showContextMenu = (e: React.MouseEvent, type: 'table' | 'column', item: any) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Context menu triggered for:', type, item);
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
              onClick={loadModels}
              disabled={isLoadingModels}
              title="Reload models"
            >
              {isLoadingModels ? (
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
              {/* Models organized by schema */}
              {Object.entries(schemaMap)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([schema, tables]) => (
                  <div key={schema} className="explorer-item">
                    <div 
                      className="explorer-folder" 
                      onClick={(e) => {
                        // Always toggle folder first
                        toggleFolder(`schema-${schema}`);
                        
                        // If clicking on the schema name (not the chevron), also select the schema
                        if (e.target instanceof HTMLElement && (e.target.tagName === 'SPAN' || e.target.closest('span'))) {
                          if (onSchemaSelect) {
                            console.log('ModelExplorer: Schema selected:', schema);
                            onSchemaSelect(schema);
                          }
                        }
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
                                  if (onTableSelect && tableModel) {
                                    onTableSelect(tableModel);
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
                                      if (onColumnSelect) {
                                        onColumnSelect(column.name);
                                      }
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
                    <div className="explorer-file">
                      <i className="bi bi-file-text me-2"></i>
                      <span>user_analysis.sql</span>
                    </div>
                    <div className="explorer-file">
                      <i className="bi bi-file-text me-2"></i>
                      <span>sales_report.sql</span>
                    </div>
                    <div className="explorer-file">
                      <i className="bi bi-file-text me-2"></i>
                      <span>inventory_check.sql</span>
                    </div>
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
          {contextMenu.type === 'table' && onGenerateSelect && (
            <div 
              className="context-menu-item"
              onClick={() => {
                onGenerateSelect(contextMenu.item);
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
        </div>
      )}
    </div>
  );
};

export default memo(ModelExplorer);
