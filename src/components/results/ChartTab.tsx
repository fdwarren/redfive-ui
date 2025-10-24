import React, { memo, useMemo, useState, useRef, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';
import ChartConfig from './ChartConfig';

// Chart state is now managed by parent component to persist across tab switches

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
  const [showConfig, setShowConfig] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [chartHeight, setChartHeight] = useState(400);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const heightUpdateTimeoutRef = useRef<number | null>(null);

  // Debounced height update function
  const debouncedUpdateHeight = (newHeight: number) => {
    if (heightUpdateTimeoutRef.current) {
      clearTimeout(heightUpdateTimeoutRef.current);
    }
    
    heightUpdateTimeoutRef.current = setTimeout(() => {
      setChartHeight(newHeight);
    }, 50); // Small delay to prevent flickering
  };

  // Resize observer to track container height changes
  useEffect(() => {
    const updateChartHeight = () => {
      if (chartContainerRef.current) {
        const containerHeight = chartContainerRef.current.clientHeight;
        if (containerHeight > 0 && containerHeight !== chartHeight) {
          debouncedUpdateHeight(containerHeight);
        }
      }
    };

    // Delay initial height calculation to ensure container is properly sized
    const timeoutId = setTimeout(() => {
      updateChartHeight();
    }, 100);

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateChartHeight();
    });

    // Also listen for window resize events
    const handleResize = () => {
      updateChartHeight();
    };

    window.addEventListener('resize', handleResize);

    // Set up observer after a short delay to ensure container is ready
    const observerTimeoutId = setTimeout(() => {
      if (chartContainerRef.current) {
        resizeObserver.observe(chartContainerRef.current);
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(observerTimeoutId);
      if (heightUpdateTimeoutRef.current) {
        clearTimeout(heightUpdateTimeoutRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [chartHeight]);

  // Effect to handle initial height setup when data changes
  useEffect(() => {
    const updateHeight = () => {
      if (chartContainerRef.current) {
        const containerHeight = chartContainerRef.current.clientHeight;
        if (containerHeight > 0) {
          debouncedUpdateHeight(containerHeight);
        }
      }
    };

    // Only update height once when data changes, not multiple times
    const timeoutId = setTimeout(updateHeight, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [queryResults?.length, chartConfig?.chart_type]); // Only re-run when data structure changes

  // Create chart configurations based on user configuration
  const chartOptions = useMemo(() => {
    if (!chartConfig || !queryResults || queryResults.length === 0) return null;

    const { chart_type, x_key, y_key, series_key, filteredData, selectedSeriesValues } = chartConfig;

    // Use filtered data if available, otherwise fall back to all query results
    const dataToUse = filteredData && filteredData.length > 0 ? filteredData : queryResults;

    // Define a consistent color palette
    const colorPalette = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
      '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
    ];

    // Transform data based on configuration
    let chartData: any[] = [];
    let seriesConfig: any[] = [];
    
    if (series_key && y_key) {
      // Group data by series_key values
      const groupedData: { [key: string]: any[] } = {};
      
      (dataToUse || []).forEach((row: { [x: string]: any; }) => {
        const seriesValue = row[series_key];
        if (seriesValue !== null && seriesValue !== undefined) {
          // Only include series values that are selected (if filtering is applied)
          if (!selectedSeriesValues || selectedSeriesValues.length === 0 || selectedSeriesValues.includes(seriesValue)) {
            if (!groupedData[seriesValue]) {
              groupedData[seriesValue] = [];
            }
            groupedData[seriesValue].push(row);
          }
        }
      });
      
      // Create separate series for each series value with filtered data
      const seriesValues = Object.keys(groupedData);
      seriesConfig = seriesValues.map((seriesValue, index) => ({
        type: chart_type,
        xKey: x_key,
        yKey: y_key,
        yName: seriesValue,
        data: groupedData[seriesValue],
        connectMissingData: false,
        style: {
          fill: colorPalette[index % colorPalette.length],
          stroke: colorPalette[index % colorPalette.length]
        },
        marker: {
          enabled: false
        }
      }));
      
      // For the main chart data, we'll use all the data (AG Charts will handle the filtering per series)
      chartData = dataToUse || [];
    } else {
      // Fallback to simple mapping if series_key is not available
      chartData = dataToUse || [];
      seriesConfig = [{
        type: chart_type,
        xKey: x_key,
        yKey: y_key,
        data: chartData,
        connectMissingData: false,
        style: {
          fill: colorPalette[0],
          stroke: colorPalette[0]
        },
        marker: {
          enabled: false
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
            text: x_key || 'X-Axis'
          }
        },
        {
          type: 'number',
          position: 'left',
          title: {
            text: y_key || 'Y-Axis'
          }
        }
      ],
      legend: {
        enabled: seriesConfig.length > 1,
        item: {
          marker: {
            shape: 'square',
            size: 12
          }
        }
      },
      width: '100%',
      height: chartHeight
    };


    return chartOptions;
  }, [chartConfig, queryResults, chartHeight]);

  return (
    <div className="flex-grow-1 d-flex position-relative" style={{ height: '100%', overflow: 'hidden' }}>
      {queryResults && queryResults.length > 0 ? (
        <>
          {/* Chart Area */}
          <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden', minHeight: 0 }}>
            {chartOptions ? (
              <div ref={chartContainerRef} className="flex-grow-1" style={{ width: '100%', height: '100%', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%' }}>
                  <AgCharts options={chartOptions as any} />
                </div>
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