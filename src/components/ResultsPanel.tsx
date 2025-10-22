import React, { memo, useState } from 'react';

interface ResultsPanelProps {
  results: any[];
  columns: string[];
  rowCount: number;
  isExecuting: boolean;
  error: string | null;
  selectedRowIndex: number | null;
  onRowSelect: (rowIndex: number) => void;
  metadata?: any;
  className?: string;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
  results, 
  columns, 
  rowCount, 
  isExecuting, 
  error, 
  selectedRowIndex,
  onRowSelect,
  metadata,
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState('table');

  return (
    <div className={`flex-grow-1 d-flex flex-column ${className}`} style={{ height: '100%', overflow: 'hidden' }}>
      {/* Tab Header */}
      <div className="border-bottom" style={{ flexShrink: 0 }}>
        <div className="d-flex">
          <div
            className={`p-2 border-end cursor-pointer ${activeTab === 'table' ? 'bg-light' : ''}`}
            onClick={() => setActiveTab('table')}
            style={{ 
              cursor: 'pointer',
              backgroundColor: activeTab === 'table' ? '#f8f9fa' : 'transparent',
              borderBottom: activeTab === 'table' ? '2px solid #aa0000' : '2px solid transparent'
            }}
          >
            <small className="text-muted">
              <i className="bi bi-table me-1"></i>Results
              {rowCount > 0 && (
                <span className="ms-1">({rowCount})</span>
              )}
            </small>
          </div>
          <div
            className={`p-2 cursor-pointer ${activeTab === 'analysis' ? 'bg-light' : ''}`}
            onClick={() => setActiveTab('analysis')}
            style={{ 
              cursor: 'pointer',
              backgroundColor: activeTab === 'analysis' ? '#f8f9fa' : 'transparent',
              borderBottom: activeTab === 'analysis' ? '2px solid #aa0000' : '2px solid transparent'
            }}
          >
            <small className="text-muted">
              <i className="bi bi-graph-up me-1"></i>Analysis
            </small>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
        {activeTab === 'table' && (
          <div className="p-2 flex-grow-1 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
        
        {/* Loading state */}
        {isExecuting && (
          <div className="d-flex justify-content-center align-items-center flex-grow-1">
            <div className="text-center">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-2 text-muted">Executing query...</div>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Query Error:</strong> {error}
          </div>
        )}
        
        {/* Results table */}
        {!isExecuting && !error && results.length > 0 && (
          <div className="flex-grow-1" style={{ 
            overflowY: 'auto',
            overflowX: 'auto',
            height: 'calc(100% - 60px)',
            maxHeight: 'calc(100% - 60px)',
            scrollbarWidth: 'thin'
          }}>
            <table className="table table-striped table-hover table-sm" style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
              <thead className="sticky-top">
                <tr>
                  {columns.map((column, index) => (
                    <th key={index} style={{ 
                      whiteSpace: 'nowrap', 
                      padding: '0.5rem 0.6rem 0.4rem 0.6rem', 
                      lineHeight: '1.2', 
                      color: 'white', 
                      backgroundColor: '#495057',
                      border: 'none'
                    }}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className={selectedRowIndex === rowIndex ? 'table-row-selected' : ''}
                    style={{ 
                      lineHeight: '1.2',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: selectedRowIndex === rowIndex ? '#e3f2fd' : 'transparent'
                    }}
                    onClick={() => onRowSelect(rowIndex)}
                    onMouseEnter={(e) => {
                      if (selectedRowIndex !== rowIndex) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRowIndex !== rowIndex) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.6rem', lineHeight: '1.2' }}>
                        {row[column] !== null && row[column] !== undefined 
                          ? String(row[column]) 
                          : <span className="text-muted">NULL</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
            {/* No results */}
            {!isExecuting && !error && results.length === 0 && (
              <div className="d-flex justify-content-center align-items-center flex-grow-1">
                <div className="text-center text-muted">
                  <i className="bi bi-table display-4 mb-3"></i>
                  <div>No results to display</div>
                  <small>Execute a query to see results here</small>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="p-3 flex-grow-1 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-muted mb-0">
                <i className="bi bi-graph-up me-2"></i>Analysis
              </h6>
            </div>
            {metadata ? (
              <div className="flex-grow-1" style={{ overflow: 'auto' }}>
                <pre className="bg-light p-3 rounded" style={{ 
                  fontSize: '0.875rem', 
                  lineHeight: '1.4',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="d-flex justify-content-center align-items-center flex-grow-1">
                <div className="text-center text-muted">
                  <i className="bi bi-graph-up display-4 mb-3"></i>
                  <div>No Analysis Available</div>
                  <small>Execute a query to see execution metadata</small>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ResultsPanel);
