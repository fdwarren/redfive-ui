import React from 'react';

interface Column {
  name: string;
  label: string;
  type: string;
  description: string;
  nullable: boolean;
}

interface Table {
  name: string;
  label: string;
  schema: string;
  description: string;
  columns: Column[];
  keys: {
    primary: string;
    foreign?: Array<{
      columns: string;
      ref_schema: string;
      ref_table: string;
      ref_columns: string;
    }>;
  };
}

interface CatalogInfoProps {
  selectedTable?: Table;
  selectedColumn?: string;
  className?: string;
}

const CatalogInfo: React.FC<CatalogInfoProps> = ({ 
  selectedTable, 
  selectedColumn, 
  className = '' 
}) => {
  if (!selectedTable) {
    return (
      <div className={`p-4 text-center text-muted ${className}`}>
        <i className="bi bi-info-circle fs-1 mb-3"></i>
        <h5>No Table Selected</h5>
        <p>Select a table from the explorer to view its details</p>
      </div>
    );
  }

  return (
    <div className={`p-3 ${className}`} style={{ overflow: 'auto', maxHeight: '100%' }}>
      {/* Table Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-table me-2" style={{ color: '#aa0000' }}></i>
          <h4 className="mb-0" style={{ color: '#aa0000' }}>{selectedTable.label || selectedTable.name}</h4>
        </div>
        <div className="text-muted small">
          <span className="badge me-2" style={{ backgroundColor: '#aa0000', color: 'white' }}>{selectedTable.schema}</span>
          <span className="badge" style={{ backgroundColor: '#f8f9fa', color: '#aa0000', border: '1px solid #aa0000' }}>{selectedTable.name}</span>
        </div>
        {selectedTable.description && (
          <p className="mt-2" style={{ color: '#666' }}>{selectedTable.description}</p>
        )}
      </div>

      {/* Primary Key */}
      {selectedTable.keys?.primary && (
        <div className="mb-3">
          <h6 style={{ color: '#aa0000' }}>
            <i className="bi bi-key me-1" style={{ color: '#aa0000' }}></i>Primary Key
          </h6>
          <div className="p-2 rounded" style={{ backgroundColor: '#fff5f5', border: '1px solid #ffcccc' }}>
            <code style={{ color: '#aa0000' }}>{selectedTable.keys.primary}</code>
          </div>
        </div>
      )}

      {/* Foreign Keys */}
      {selectedTable.keys?.foreign && selectedTable.keys.foreign.length > 0 && (
        <div className="mb-3">
          <h6 style={{ color: '#aa0000' }}>
            <i className="bi bi-link-45deg me-1" style={{ color: '#aa0000' }}></i>Foreign Keys
          </h6>
          {selectedTable.keys.foreign.map((fk, index) => (
            <div key={index} className="p-2 rounded mb-2" style={{ backgroundColor: '#fff5f5', border: '1px solid #ffcccc' }}>
              <div><strong style={{ color: '#aa0000' }}>Columns:</strong> <code style={{ color: '#aa0000' }}>{fk.columns}</code></div>
              <div><strong style={{ color: '#aa0000' }}>References:</strong> <code style={{ color: '#aa0000' }}>{fk.ref_schema}.{fk.ref_table}({fk.ref_columns})</code></div>
            </div>
          ))}
        </div>
      )}

      {/* Columns */}
      <div>
        <h6 className="mb-3" style={{ color: '#aa0000' }}>
          <i className="bi bi-columns me-1" style={{ color: '#aa0000' }}></i>Columns ({selectedTable.columns.length})
        </h6>
        <div className="table-responsive">
          <table className="table table-sm table-hover">
            <thead style={{ backgroundColor: '#fff5f5' }}>
              <tr>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Name</th>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Type</th>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Nullable</th>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {selectedTable.columns.map((column) => (
                <tr 
                  key={column.name}
                  className={selectedColumn === column.name ? 'table-warning' : ''}
                  style={selectedColumn === column.name ? { backgroundColor: '#fff5f5' } : {}}
                >
                  <td>
                    <code className={selectedColumn === column.name ? 'fw-bold' : ''} style={{ color: '#aa0000' }}>
                      {column.name}
                    </code>
                    {column.label && column.label !== column.name && (
                      <div className="small" style={{ color: '#666' }}>{column.label}</div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#aa0000', color: 'white' }}>{column.type}</span>
                  </td>
                  <td>
                    {column.nullable ? (
                      <span style={{ color: '#666' }}>Yes</span>
                    ) : (
                      <span className="fw-bold" style={{ color: '#aa0000' }}>No</span>
                    )}
                  </td>
                  <td className="small" style={{ color: '#666' }}>
                    {column.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CatalogInfo;
