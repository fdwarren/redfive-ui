import React, { useState, useEffect, useMemo, useRef } from 'react';
import simpleChartSchema from '../../assets/simple-chart.schema.json';

interface ChartConfigProps {
  queryResults: any[];
  columns: string[];
  onConfigChange: (config: any) => void;
  initialConfig?: any;
  className?: string;
}

interface ChartConfigData {
  chart_type: 'bar' | 'line' | 'area' | 'scatter' | 'pie';
  x_key: string | null;
  y_key: string | null;
  series_key: string | null;
  showMarkers: boolean;
  series: Array<{
    type: string;
    xKey: string | null;
    yKey: string | null;
    seriesValue?: any;
  }>;
  filteredData?: any[];
  selectedSeriesValues?: string[];
}

const ChartConfig: React.FC<ChartConfigProps> = ({ 
  queryResults, 
  columns, 
  onConfigChange, 
  initialConfig,
  className = ''
}) => {
  const [config, setConfig] = useState<ChartConfigData>(() => {
    if (initialConfig) {
      return {
        chart_type: initialConfig.chart_type || 'bar',
        x_key: initialConfig.x_key || null,
        y_key: initialConfig.y_key || null,
        series_key: initialConfig.series_key || null,
        showMarkers: initialConfig.showMarkers !== undefined ? initialConfig.showMarkers : true,
        series: initialConfig.series || []
      };
    }
    return {
      chart_type: 'bar',
      x_key: null,
      y_key: null,
      series_key: null,
      showMarkers: true,
      series: []
    };
  });

  const [selectedSeriesValues, setSelectedSeriesValues] = useState<string[]>(() => {
    return initialConfig?.selectedSeriesValues || [];
  });

  // Ref to track previous config to avoid unnecessary updates
  const prevConfigRef = useRef<any>(null);
  
  // Helper function to create a stable config object for comparison
  const createConfigForComparison = (config: ChartConfigData, filteredData: any[], selectedSeriesValues: string[]) => {
    return {
      chart_type: config.chart_type,
      x_key: config.x_key,
      y_key: config.y_key,
      series_key: config.series_key,
      showMarkers: config.showMarkers,
      series: config.series,
      filteredData: filteredData,
      selectedSeriesValues: selectedSeriesValues
    };
  };

  // Reset state when initialConfig changes (e.g., when switching tabs)
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        chart_type: initialConfig.chart_type || 'bar',
        x_key: initialConfig.x_key || null,
        y_key: initialConfig.y_key || null,
        series_key: initialConfig.series_key || null,
        showMarkers: initialConfig.showMarkers !== undefined ? initialConfig.showMarkers : true,
        series: initialConfig.series || []
      });
      setSelectedSeriesValues(initialConfig.selectedSeriesValues || []);
    } else {
      setConfig({
        chart_type: 'bar',
        x_key: null,
        y_key: null,
        series_key: null,
        showMarkers: true,
        series: []
      });
      setSelectedSeriesValues([]);
    }
  }, [initialConfig]);


  // Get available chart types from schema
  const chartTypes = useMemo(() => {
    const chartTypeProperty = simpleChartSchema.properties.chart_type;
    return chartTypeProperty.description?.split(', ') || ['line', 'bar', 'area', 'scatter', 'pie'];
  }, []);

  // Get distinct series values when series_key is selected
  const distinctSeriesValues = useMemo(() => {
    if (!config.series_key || !queryResults || queryResults.length === 0) return [];
    
    const uniqueValues = [...new Set(
      queryResults
        .map(row => config.series_key ? row[config.series_key] : null)
        .filter(val => val !== null && val !== undefined)
    )];
    
    return uniqueValues.sort();
  }, [config.series_key, queryResults]);

  // Get filtered data based on selected series values
  const filteredData = useMemo(() => {
    if (!config.series_key || selectedSeriesValues.length === 0) {
      return queryResults;
    }
    
    return queryResults.filter(row => 
      config.series_key ? selectedSeriesValues.includes(row[config.series_key]) : false
    );
  }, [queryResults, config.series_key, selectedSeriesValues]);

  // Update series when x_key, y_key, series_key, or chart_type change
  useEffect(() => {
    if (config.x_key && config.y_key && config.series_key && queryResults && queryResults.length > 0) {
      // Get unique values from the series_key column
      const uniqueSeriesValues = [...new Set(queryResults.map(row => config.series_key ? row[config.series_key] : null).filter(val => val !== null && val !== undefined))];
      
      const newSeries = uniqueSeriesValues.map(seriesValue => ({
        type: config.chart_type,
        xKey: config.x_key,
        yKey: config.y_key,
        seriesValue: seriesValue
      }));
      
      setConfig(prev => ({
        ...prev,
        series: newSeries
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        series: []
      }));
    }
  }, [config.x_key, config.y_key, config.series_key, config.chart_type, queryResults]);


  // Notify parent of config changes
  useEffect(() => {
    // Only notify if config has meaningful changes and avoid empty configs
    if (config.x_key && config.y_key) {
      const newConfig = createConfigForComparison(config, filteredData, selectedSeriesValues);
      
      // Only call onConfigChange if the config actually changed
      // Use a more efficient comparison by checking key properties
      const hasChanged = !prevConfigRef.current || 
        prevConfigRef.current.chart_type !== newConfig.chart_type ||
        prevConfigRef.current.x_key !== newConfig.x_key ||
        prevConfigRef.current.y_key !== newConfig.y_key ||
        prevConfigRef.current.series_key !== newConfig.series_key ||
        prevConfigRef.current.showMarkers !== newConfig.showMarkers ||
        prevConfigRef.current.selectedSeriesValues?.length !== newConfig.selectedSeriesValues?.length ||
        (prevConfigRef.current.selectedSeriesValues && newConfig.selectedSeriesValues &&
         !prevConfigRef.current.selectedSeriesValues.every((val: any, index: number) => val === newConfig.selectedSeriesValues![index])) ||
        prevConfigRef.current.filteredData?.length !== newConfig.filteredData?.length;
      
      if (hasChanged) {
        prevConfigRef.current = newConfig;
        onConfigChange(newConfig);
      }
    }
  }, [config.x_key, config.y_key, config.series_key, config.chart_type, config.showMarkers, config.series, filteredData, selectedSeriesValues, onConfigChange]);

  const handleChartTypeChange = (chartType: string) => {
    setConfig(prev => ({
      ...prev,
      chart_type: chartType as 'bar' | 'line' | 'area' | 'scatter' | 'pie',
      series: prev.series.map(series => ({
        ...series,
        type: chartType
      }))
    }));
  };

  const handleXKeyChange = (xKey: string) => {
    setConfig(prev => ({
      ...prev,
      x_key: xKey || null
    }));
  };

  const handleYKeyChange = (yKey: string) => {
    setConfig(prev => ({
      ...prev,
      y_key: yKey || null
    }));
  };

  const handleSeriesKeyChange = (seriesKey: string) => {
    // Batch both state updates together
    setConfig(prev => ({
      ...prev,
      series_key: seriesKey || null
    }));
    
    // Reset selected series values when series key changes
    setSelectedSeriesValues([]);
  };

  const handleSeriesValueToggle = (seriesValue: string) => {
    setSelectedSeriesValues(prev => {
      const newValues = prev.includes(seriesValue)
        ? prev.filter(val => val !== seriesValue)
        : [...prev, seriesValue];
      
      // Don't call onConfigChange here - let the useEffect handle it
      // This prevents double updates and flickering
      return newValues;
    });
  };

  const handleSelectAllSeries = () => {
    setSelectedSeriesValues(distinctSeriesValues);
  };

  const handleDeselectAllSeries = () => {
    setSelectedSeriesValues([]);
  };

  const handleShowMarkersChange = (showMarkers: boolean) => {
    setConfig(prev => ({
      ...prev,
      showMarkers: showMarkers
    }));
  };


  // Get numeric columns for y-axis selection (values/measurements)
  const numericColumns = useMemo(() => {
    if (!queryResults || queryResults.length === 0) return columns;
    
    return columns.filter(column => {
      // Sample multiple rows to get a better sense of the data type
      const sampleSize = Math.min(5, queryResults.length);
      const sampleValues = queryResults.slice(0, sampleSize).map(row => row[column]);
      
      // Remove null/undefined values for type checking
      const validValues = sampleValues.filter(val => val !== null && val !== undefined);
      
      if (validValues.length === 0) return false; // Exclude if all samples are null
      
      // Check if most values are numeric and can be used for mathematical operations
      const numericCount = validValues.filter(val => {
        return (typeof val === 'number' && !isNaN(val)) || 
               (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '');
      }).length;
      
      // At least 80% of sample values should be numeric for Y-axis
      return (numericCount / validValues.length) >= 0.8;
    });
  }, [columns, queryResults]);

  // Get columns suitable for x-axis (categorical) - be more inclusive
  const categoricalColumns = useMemo(() => {
    if (!queryResults || queryResults.length === 0) return columns;
    
    return columns.filter(column => {
      // Sample multiple rows to get a better sense of the data type
      const sampleSize = Math.min(5, queryResults.length);
      const sampleValues = queryResults.slice(0, sampleSize).map(row => row[column]);
      
      // Remove null/undefined values for type checking
      const validValues = sampleValues.filter(val => val !== null && val !== undefined);
      
      if (validValues.length === 0) return true; // Include if all samples are null (let user decide)
      
      // Check the types of valid values
      const types = validValues.map(val => typeof val);
      const uniqueTypes = [...new Set(types)];
      
      // Include columns that are:
      // - Strings (text, categories)
      // - Numbers (can be used categorically - years, IDs, etc.)
      // - Booleans (categorical true/false)
      // - Dates (objects that might be dates)
      // - Mixed types (let user decide)
      return uniqueTypes.some(type => 
        type === 'string' || 
        type === 'number' || 
        type === 'boolean' || 
        type === 'object'
      );
    });
  }, [columns, queryResults]);

  if (!queryResults || queryResults.length === 0) {
    return (
      <div className={`p-3 text-center text-muted ${className}`}>
        <i className="bi bi-bar-chart display-4 mb-3"></i>
        <div>No Data Available</div>
        <small>Execute a query to configure charts</small>
      </div>
    );
  }

  return (
    <div className={`px-3 py-2 ${className}`} style={{ fontSize: '0.85rem' }}>
      <div className="mb-2">
        <h6 className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
        </h6>
      </div>

      <div className="row g-2">
        {/* Chart Type Selection */}
        <div className="col-md-6">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            Chart Type
          </label>
          <select 
            className="form-select"
            value={config.chart_type}
            onChange={(e) => handleChartTypeChange(e.target.value)}
            style={{ borderColor: '#aa0000', fontSize: '0.8rem' }}
          >
            {chartTypes.map((type: string) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Show Markers Checkbox */}
        <div className="col-md-6">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            Visual Options
          </label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="showMarkers"
              checked={config.showMarkers}
              onChange={(e) => handleShowMarkersChange(e.target.checked)}
              style={{ accentColor: '#aa0000' }}
            />
            <label className="form-check-label" htmlFor="showMarkers" style={{ fontSize: '0.8rem' }}>
              Show Markers
            </label>
          </div>
          <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
            Display data point markers on the chart
          </div>
        </div>

        {/* X-Axis Selection */}
        <div className="col-12">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            X-Axis (Category)
          </label>
          <select 
            className="form-select"
            value={config.x_key || ''}
            onChange={(e) => handleXKeyChange(e.target.value)}
            style={{ borderColor: '#aa0000', fontSize: '0.8rem' }}
          >
            <option value="">Select X-axis column</option>
            {categoricalColumns.map(column => {
              // Determine column type hint for display
              const sampleValue = queryResults?.[0]?.[column];
              let typeHint = '';
              if (sampleValue !== null && sampleValue !== undefined) {
                const type = typeof sampleValue;
                if (type === 'string') typeHint = ' (text)';
                else if (type === 'number') typeHint = ' (numeric)';
                else if (type === 'boolean') typeHint = ' (true/false)';
                else if (sampleValue instanceof Date) typeHint = ' (date)';
                else if (type === 'object') typeHint = ' (object)';
              }
              
              return (
                <option key={column} value={column}>
                  {column}{typeHint}
                </option>
              );
            })}
          </select>
          {categoricalColumns.length === 0 && (
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              No suitable columns found for X-axis
            </div>
          )}
          <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
            Categories, dates, or grouping columns
          </div>
        </div>

        {/* Y-Axis Selection */}
        <div className="col-12">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            Y-Axis (Values)
          </label>
          <select 
            className="form-select"
            value={config.y_key || ''}
            onChange={(e) => handleYKeyChange(e.target.value)}
            style={{ borderColor: '#aa0000', fontSize: '0.8rem' }}
          >
            <option value="">Select Y-axis column</option>
            {numericColumns.map(column => {
              // Determine column type hint for display
              const sampleValue = queryResults?.[0]?.[column];
              let typeHint = '';
              if (sampleValue !== null && sampleValue !== undefined) {
                const type = typeof sampleValue;
                if (type === 'number') typeHint = ' (number)';
                else if (typeof sampleValue === 'string' && !isNaN(Number(sampleValue))) {
                  typeHint = ' (numeric text)';
                }
              }
              
              return (
                <option key={column} value={column}>
                  {column}{typeHint}
                </option>
              );
            })}
          </select>
          {numericColumns.length === 0 && (
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              No numeric columns found for Y-axis
            </div>
          )}
          <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
            Numeric values for measurements or counts
          </div>
        </div>

        {/* Series Differentiation Selection */}
        <div className="col-12">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            Series Differentiation
          </label>
          <select 
            className="form-select"
            value={config.series_key || ''}
            onChange={(e) => handleSeriesKeyChange(e.target.value)}
            style={{ borderColor: '#aa0000', fontSize: '0.8rem' }}
          >
            <option value="">Select series column</option>
            {categoricalColumns.map(column => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
            Column that groups data into different series
          </div>
        </div>

        {/* Series Filter Checkboxes */}
        {config.series_key && distinctSeriesValues.length > 0 && (
          <div className="col-12">
            <div className="border-top pt-3 mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold mb-0" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
                  Filter Series
                </label>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleSelectAllSeries}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleDeselectAllSeries}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              {selectedSeriesValues.length === 0 && (
                <div className="alert alert-warning py-2 px-3 mb-2" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  No series selected. Click "Select All" to show all data series in the chart.
                </div>
              )}
              <div className="d-flex flex-column gap-2">
                {distinctSeriesValues.map((seriesValue, index) => (
                  <div key={seriesValue} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`series-${index}`}
                      checked={selectedSeriesValues.includes(seriesValue)}
                      onChange={() => handleSeriesValueToggle(seriesValue)}
                      style={{ accentColor: '#aa0000' }}
                    />
                    <label className="form-check-label" htmlFor={`series-${index}`}>
                      {String(seriesValue)}
                    </label>
                  </div>
                ))}
              </div>
              <div className="text-muted small mt-2" style={{ fontSize: '0.75rem' }}>
                Showing {selectedSeriesValues.length === 0 ? distinctSeriesValues.length : selectedSeriesValues.length} of {distinctSeriesValues.length} series
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ChartConfig;
