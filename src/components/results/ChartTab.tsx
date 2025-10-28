import React, { memo, useMemo, useState, useRef, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';
import ChartConfig from './ChartConfig';
import { useChartState } from '../../hooks/useGlobalState';

interface ChartTabProps {
  metadata?: any;
  queryResults?: any[];
  columns?: string[];
  chartConfig: any;
  onChartConfigChange: (config: any) => void;
  tabId?: string;
}

const ChartTab: React.FC<ChartTabProps> = ({ 
  metadata, 
  queryResults = [], 
  columns = [], 
  chartConfig, 
  onChartConfigChange,
  tabId
}) => {
  const { chartState, getColorPalette } = useChartState();
  const [showConfig, setShowConfig] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [containerHeight, setContainerHeight] = useState(500);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    updateHeight();
    
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Create chart configurations based on user configuration
  const chartOptions = useMemo(() => {
    if (!chartConfig || !queryResults || queryResults.length === 0) return null;

    const { chart_type, x_key, y_key, series_key, filteredData, selectedSeriesValues } = chartConfig;

    // Use filtered data if available, otherwise fall back to all query results
    const dataToUse = filteredData && filteredData.length > 0 ? filteredData : queryResults;

    // Use global color palette
    const colorPalette = getColorPalette();

    // Transform data based on configuration
    let chartData: any[] = [];
    let seriesConfig: any[] = [];
    
    if (series_key && y_key && x_key) {
      // For multiple series in AG Charts, we need to restructure the data completely
      // Create a pivot-like structure where each series becomes a separate y-column
      
      // First, get all unique x-values and series values
      const xValues = [...new Set((dataToUse || []).map(row => row[x_key]))].sort();
      const seriesValues = [...new Set(
        (dataToUse || [])
          .map(row => row[series_key])
          .filter(val => val !== null && val !== undefined)
          .filter(val => !selectedSeriesValues || selectedSeriesValues.length === 0 || selectedSeriesValues.includes(val))
      )].sort();
      
      // Create a map for quick lookup
      const dataMap: { [key: string]: { [key: string]: any } } = {};
      (dataToUse || []).forEach(row => {
        const xVal = row[x_key];
        const seriesVal = row[series_key];
        const yVal = row[y_key];
        
        if (xVal !== null && xVal !== undefined && 
            seriesVal !== null && seriesVal !== undefined &&
            (!selectedSeriesValues || selectedSeriesValues.length === 0 || selectedSeriesValues.includes(seriesVal))) {
          
          const key = `${xVal}`;
          if (!dataMap[key]) {
            dataMap[key] = { [x_key]: xVal };
          }
          dataMap[key][`series_${seriesVal}`] = yVal;
        }
      });
      
      // Convert to array format
      chartData = xValues.map(xVal => {
        const key = `${xVal}`;
        return dataMap[key] || { [x_key]: xVal };
      });
      
      // Create separate series for each series value
      seriesConfig = seriesValues.map((seriesValue, index) => ({
        type: chart_type,
        xKey: x_key,
        yKey: `series_${seriesValue}`,
        yName: seriesValue,
        connectMissingData: false,
        style: {
          fill: colorPalette[index % colorPalette.length],
          stroke: colorPalette[index % colorPalette.length]
        },
        marker: {
          enabled: chart_type === 'scatter' || chart_type === 'line',
          size: chart_type === 'scatter' ? 6 : 4
        }
      }));
    } else {
      // Single series - use chart-level data
      chartData = dataToUse || [];
      seriesConfig = [{
        type: chart_type,
        xKey: x_key,
        yKey: y_key,
        connectMissingData: false,
        style: {
          fill: colorPalette[0],
          stroke: colorPalette[0]
        },
        marker: {
          enabled: chart_type === 'scatter' || chart_type === 'line',
          size: chart_type === 'scatter' ? 6 : 4
        }
      }];
    }



    const chartOptions = {
      data: chartData,
      series: seriesConfig,
      title: {
        text: y_key && x_key ? `${y_key.toUpperCase()} by ${x_key.toUpperCase()}` : 'Query Results Visualization',
        fontSize: 16,
        color: '#aa0000'
      },
      background: {
        fill: 'transparent'
      },
      axes: [
        {
          type: 'category',
          position: 'bottom',
          title: {
            text: x_key || 'X-Axis',
            fontSize: 12
          },
          label: {
            rotation: seriesConfig.length > 1 ? 45 : 0, // Rotate labels if multiple series
            fontSize: 11
          }
        },
        {
          type: 'number',
          position: 'left',
          title: {
            text: y_key || 'Y-Axis',
            fontSize: 12
          },
          label: {
            fontSize: 11
          }
        }
      ],
      legend: {
        enabled: chartState.showLegend && seriesConfig.length > 1,
        position: 'bottom',
        item: {
          marker: {
            shape: chart_type === 'line' ? 'line' : 'square',
            size: 12
          },
          label: {
            fontSize: 11
          }
        },
        spacing: 20
      },
      padding: {
        top: 20,
        right: 20,
        bottom: seriesConfig.length > 1 ? 60 : 40, // More space for legend
        left: 50
      },
      width: '100%',
      height: containerHeight
    };


    return chartOptions;
  }, [chartConfig, queryResults, chartState.showLegend, getColorPalette, containerHeight]);

  return (
    <div ref={containerRef} className="flex-grow-1 d-flex position-relative" style={{ height: '100%', overflow: 'hidden' }}>
      {queryResults && queryResults.length > 0 ? (
        <>
          {/* Chart Area */}
          <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden', minHeight: 0 }}>
            {chartOptions ? (
              <div className="flex-grow-1" style={{ width: '100%', height: '100%' }}>
                <AgCharts options={chartOptions as any} />
              </div>
            ) : (
              <div className="d-flex justify-content-center align-items-center flex-grow-1">
                <div className="text-center text-muted">
                  <i className="bi bi-bar-chart display-4 mb-3"></i>
                  <div>Configure Chart</div>
                  <small>Use the configuration panel to set up your visualization</small>
                </div>
              </div>
            )}
            
            {metadata && (
              <div className="mt-2">
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowMetadata(!showMetadata)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className={`bi ${showMetadata ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`}></i>
                  Raw Metadata
                </button>
                {showMetadata && (
                  <div className="mt-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                    <pre className="bg-light p-3 rounded" style={{ 
                      fontSize: '0.75rem', 
                      lineHeight: '1.4',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {/* Configuration Toggle Button - Only show when panel is collapsed */}
            {!showConfig && (
              <div className="position-absolute" style={{ top: '10px', right: '10px', zIndex: 1000 }}>
                <button 
                  className="btn btn-sm"
                  style={{ backgroundColor: 'white', borderColor: '#aa0000', color: '#aa0000', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => setShowConfig(true)}
                  title="Open configuration panel"
                >
                  Show Config
                </button>
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <div className={`border-start bg-light d-flex flex-column ${showConfig ? '' : 'd-none'}`} style={{ width: '350px', minWidth: '350px' }}>
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <h6 className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                Chart Configuration
              </h6>
              <button 
                className="btn btn-sm"
                style={{ backgroundColor: 'white', borderColor: '#aa0000', color: '#aa0000', fontSize: '0.75rem' }}
                onClick={() => setShowConfig(!showConfig)}
                title={showConfig ? 'Collapse configuration' : 'Expand configuration'}
              >
                Hide Config
              </button>
            </div>
            <div className="flex-grow-1" style={{ overflow: 'auto' }}>
              <ChartConfig 
                key={tabId} // Force remount when switching tabs
                queryResults={queryResults}
                columns={columns}
                onConfigChange={onChartConfigChange}
                initialConfig={chartConfig}
                tabId={tabId}
              />
            </div>
          </div>

        </>
      ) : (
        <div className="d-flex justify-content-center align-items-center flex-grow-1">
          <div className="text-center text-muted">
            <i className="bi bi-graph-up display-4 mb-3"></i>
            <div>No Analysis Available</div>
            <small>Execute a query to see execution metadata and configure charts</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ChartTab);