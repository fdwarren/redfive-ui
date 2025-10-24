import React, { memo, useEffect, useRef } from 'react';

interface ResultsTableProps {
  results: any[];
  columns: string[];
  rowCount: number;
  isExecuting: boolean;
  error: string | null;
  selectedRowIndex: number | null;
  onRowSelect: (rowIndex: number) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ 
  results, 
  columns, 
  isExecuting, 
  error, 
  selectedRowIndex,
  onRowSelect
}) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (results.length === 0) return;
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const newIndex = selectedRowIndex === null ? 0 : Math.min(selectedRowIndex + 1, results.length - 1);
        onRowSelect(newIndex);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const newIndex = selectedRowIndex === null ? 0 : Math.max(selectedRowIndex - 1, 0);
        onRowSelect(newIndex);
      }
    };

    // Add event listener to the table container
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('keydown', handleKeyDown);
      return () => tableElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [results.length, selectedRowIndex, onRowSelect]);

  // Set first row as selected by default when results are loaded
  useEffect(() => {
    if (results.length > 0 && selectedRowIndex === null) {
      onRowSelect(0);
    }
  }, [results.length, selectedRowIndex, onRowSelect]);
  return (
    <div 
      ref={tableRef}
      className="p-2 flex-grow-1 d-flex flex-column" 
      style={{ height: '100%', overflow: 'hidden' }}
      tabIndex={0}
      onFocus={() => {
        // Ensure the table is focused when clicked
        if (tableRef.current) {
          tableRef.current.focus();
        }
      }}
    >
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
          height: '100%',
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
  );
};

export default memo(ResultsTable);
