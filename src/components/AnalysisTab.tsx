import React, { memo } from 'react';

interface AnalysisTabProps {
  metadata?: any;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ metadata }) => {
  return (
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
  );
};

export default memo(AnalysisTab);
