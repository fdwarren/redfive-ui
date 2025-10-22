import React, { memo } from 'react';

interface ResultsDetailsPanelProps {
  results: any[];
  columns: string[];
  rowCount: number;
  isExecuting: boolean;
  error: string | null;
  selectedRow: any;
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const ResultsDetailsPanel: React.FC<ResultsDetailsPanelProps> = ({ 
  results, 
  columns, 
  rowCount, 
  isExecuting, 
  error, 
  selectedRow,
  isCollapsed,
  onToggle,
  className = '' 
}) => {

  if (isCollapsed) {
    return (
      <div className={`bg-light border-start d-flex flex-column h-100 ${className}`} style={{ height: '100%' }}>
        <div className="p-2 border-bottom flex-shrink-0 d-flex justify-content-center">
          <button 
            className="btn btn-sm"
            style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
            onClick={onToggle}
            title="Expand results details"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-light border-start d-flex flex-column h-100 ${className}`} style={{ height: '100%', overflow: 'hidden' }}>
      {/* Header with toggle button */}
      <div className="border-bottom p-3 flex-shrink-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="text-muted mb-0">
            <i className="bi bi-info-circle me-2"></i>Results Details
          </h6>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={onToggle}
            title="Collapse details panel"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow-1 p-3" style={{ overflow: 'auto' }}>
          {/* Selected Row Details */}
          {selectedRow && (
            <div>
              <h6 className="text-muted mb-3">
                <i className="bi bi-eye me-2"></i>Selected Row
              </h6>
              <div className="table-responsive">
                <table className="table table-sm table-striped" style={{ fontSize: '0.875rem' }}>
                  <tbody>
                    {columns.map((column, index) => (
                      <tr key={index}>
                        <td className="fw-bold text-muted" style={{ width: '40%', whiteSpace: 'nowrap' }}>
                          {column}
                        </td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }} title={selectedRow[column] !== null && selectedRow[column] !== undefined ? String(selectedRow[column]) : 'NULL'}>
                          {selectedRow[column] !== null && selectedRow[column] !== undefined 
                            ? String(selectedRow[column]) 
                            : <span className="text-muted">NULL</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No row selected message */}
          {!selectedRow && results.length > 0 && (
            <div className="text-center text-muted">
              <i className="bi bi-info-circle display-4 mb-3"></i>
              <div>No row selected</div>
              <small>Click on a row in the results table to view its details</small>
            </div>
          )}

          {/* No data state */}
          {results.length === 0 && !isExecuting && !error && (
            <div className="text-center text-muted">
              <i className="bi bi-table display-4 mb-3"></i>
              <div>No results to display</div>
              <small>Execute a query to see results</small>
            </div>
          )}
      </div>
    </div>
  );
};

export default memo(ResultsDetailsPanel);
