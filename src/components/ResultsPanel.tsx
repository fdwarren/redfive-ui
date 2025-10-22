import React from 'react';

interface ResultsPanelProps {
  results: any[];
  columns: string[];
  rowCount: number;
  isExecuting: boolean;
  error: string | null;
  className?: string;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
  results, 
  columns, 
  rowCount, 
  isExecuting, 
  error, 
  className = '' 
}) => {
  return (
    <div className={`flex-grow-1 d-flex flex-column ${className}`} style={{ height: '100%', overflow: 'hidden' }}>
      <div className="p-2 flex-grow-1 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="text-muted mb-0">
            <i className="bi bi-table me-2"></i>Results
          </h6>
          {rowCount > 0 && (
            <small className="text-muted">
              {rowCount} row{rowCount !== 1 ? 's' : ''}
            </small>
          )}
        </div>
        
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
                      backgroundColor: '#aa0000',
                      border: 'none'
                    }}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ lineHeight: '1.2' }}>
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
    </div>
  );
};

export default ResultsPanel;
