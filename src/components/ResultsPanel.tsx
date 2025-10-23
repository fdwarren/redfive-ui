import React, { memo, useState, useEffect } from 'react';
import ResultsTable from './ResultsTable';
import AnalysisTab from './AnalysisTab';
import MapTab from './MapTab';

interface ResultsPanelProps {
  results: any[];
  columns: string[];
  rowCount: number;
  isExecuting: boolean;
  error: string | null;
  selectedRowIndex: number | null;
  onRowSelect: (rowIndex: number) => void;
  metadata?: any;
  spatialColumns?: string[];
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
  spatialColumns = [],
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState('table');
  const [chartConfig, setChartConfig] = useState<any>(null);

  // Check if any spatial columns are present in the query results
  const hasSpatialData = spatialColumns.some(spatialCol => 
    columns.includes(spatialCol)
  );

  // Switch back to table tab if Map tab is active but spatial data is no longer available
  useEffect(() => {
    if (activeTab === 'map' && !hasSpatialData) {
      setActiveTab('table');
    }
  }, [activeTab, hasSpatialData]);

  return (
    <div className={`flex-grow-1 d-flex flex-column results-panel ${className}`} style={{ height: '100%', overflow: 'hidden' }}>
      {/* Tab Header */}
      <div className="border-bottom" style={{ flexShrink: 0, paddingTop: 'calc(0.5rem - 3px)', borderBottomWidth: '1px' }}>
        <div className="d-flex">
          <div
            className={`tab-item ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <span className="tab-name">
              <i className="bi bi-table me-1"></i>Results
              {rowCount > 0 && (
                <span className="ms-1">({rowCount})</span>
              )}
            </span>
          </div>
          <div
            className={`tab-item ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <span className="tab-name">
              <i className="bi bi-graph-up me-1"></i>Chart
            </span>
          </div>
          {hasSpatialData && (
            <div
              className={`tab-item ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <span className="tab-name">
                <i className="bi bi-geo-alt me-1"></i>Map
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
        <div style={{ display: activeTab === 'table' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
          <ResultsTable
            results={results}
            columns={columns}
            rowCount={rowCount}
            isExecuting={isExecuting}
            error={error}
            selectedRowIndex={selectedRowIndex}
            onRowSelect={onRowSelect}
          />
        </div>

        <div style={{ display: activeTab === 'analysis' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
          <AnalysisTab 
            metadata={metadata} 
            queryResults={results} 
            columns={columns}
            chartConfig={chartConfig}
            onChartConfigChange={setChartConfig}
          />
        </div>

        {hasSpatialData && (
          <div style={{ display: activeTab === 'map' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
            <MapTab results={results} columns={columns} onRowSelect={onRowSelect} selectedRowIndex={selectedRowIndex} />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ResultsPanel);
