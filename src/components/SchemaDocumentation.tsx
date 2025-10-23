import React, { useState, useMemo } from 'react';

interface Column {
  name: string;
  table: string;
  type: string;
  nullable: boolean;
  description?: string;
  schema: string;
  spatial_type?: string;
}

interface SchemaDocumentationProps {
  schemaName: string;
  models: any[];
  className?: string;
}

const SchemaDocumentation: React.FC<SchemaDocumentationProps> = ({ 
  schemaName, 
  models, 
  className = '' 
}) => {
  const [filterText, setFilterText] = useState('');
  
  // Extract all columns from all models in the schema
  const allColumns = useMemo(() => {
    const columns: Column[] = [];
    
    models.forEach(model => {
      // Try different possible schema field names
      const modelSchema = model.schema || model.schema_name || model.database_schema || 'default';
      
      if (modelSchema === schemaName && model.columns) {
        model.columns.forEach((column: any) => {
          columns.push({
            name: column.name,
            table: model.name,
            type: column.type || 'N/A',
            nullable: column.nullable || false,
            description: column.description,
            schema: modelSchema,
            spatial_type: column.spatial_type
          });
        });
      }
    });
    
    return columns.sort((a, b) => {
      // Sort by column name first, then by table name
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      return a.table.localeCompare(b.table);
    });
  }, [models, schemaName]);

  // Filter columns based on search text
  const filteredColumns = useMemo(() => {
    if (!filterText.trim()) {
      return allColumns;
    }
    
    const searchTerm = filterText.toLowerCase();
    return allColumns.filter(column => 
      column.name.toLowerCase().includes(searchTerm) ||
      column.table.toLowerCase().includes(searchTerm) ||
      column.type.toLowerCase().includes(searchTerm) ||
      (column.description && column.description.toLowerCase().includes(searchTerm))
    );
  }, [allColumns, filterText]);

  if (allColumns.length === 0) {
    return (
      <div className={`p-4 text-center text-muted ${className}`}>
        <i className="bi bi-database fs-1 mb-3" style={{ color: '#aa0000' }}></i>
        <h5 style={{ color: '#aa0000' }}>No Columns Found</h5>
        <p>No columns available for schema "{schemaName}"</p>
      </div>
    );
  }

  return (
    <div className={`p-3 ${className}`} style={{ overflow: 'auto', maxHeight: '100%' }}>
      {/* Schema Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-database me-2" style={{ color: '#aa0000' }}></i>
          <h4 className="mb-0" style={{ color: '#aa0000' }}>Schema: {schemaName}</h4>
        </div>
        <div className="text-muted small">
          <span className="badge me-2" style={{ backgroundColor: '#aa0000', color: 'white' }}>
            {allColumns.length} columns across {new Set(allColumns.map(c => c.table)).size} tables
          </span>
        </div>
      </div>

      {/* Filter Input */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text" style={{ backgroundColor: '#fff5f5', borderColor: '#aa0000' }}>
            <i className="bi bi-search" style={{ color: '#aa0000' }}></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Filter columns by name, table, type, or description..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ 
              borderColor: '#aa0000'
            }}
          />
        </div>
        {filterText && (
          <div className="mt-2">
            <small className="text-muted">
              Showing {filteredColumns.length} of {allColumns.length} columns
            </small>
          </div>
        )}
      </div>

      {/* Columns Table */}
      <div>
        <h6 className="mb-3" style={{ color: '#aa0000' }}>
          <i className="bi bi-table me-1" style={{ color: '#aa0000' }}></i>
          All Columns ({filteredColumns.length})
        </h6>
        <div className="table-responsive">
          <table className="table table-sm table-hover">
            <thead style={{ backgroundColor: '#fff5f5' }}>
              <tr>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Column</th>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Table</th>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Type</th>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Nullable</th>
                <th style={{ color: '#aa0000', borderBottom: '2px solid #aa0000' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredColumns.map((column, index) => (
                <tr key={`${column.table}-${column.name}-${index}`}>
                  <td>
                    <code style={{ color: '#aa0000' }}>{column.name}</code>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span className="badge" style={{ backgroundColor: '#f8f9fa', color: '#aa0000', border: '1px solid #aa0000', padding: '0.25em 0.4em', fontSize: '0.75em', fontWeight: '700' }}>
                      {column.table}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div className="d-flex align-items-center">
                      <span className="badge" style={{ backgroundColor: '#aa0000', color: 'white' }}>
                        {column.type}
                      </span>
                      {column.spatial_type && column.spatial_type !== null && column.spatial_type !== '' && (
                        <span className="badge ms-2" style={{ backgroundColor: 'transparent', color: '#aa0000', border: '1px solid #aa0000' }}>
                          {column.spatial_type}
                        </span>
                      )}
                    </div>
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

export default SchemaDocumentation;
