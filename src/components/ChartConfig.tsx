import React, { useState, useEffect, useMemo } from 'react';
import simpleChartSchema from '../assets/simple-chart.schema.json';

interface ChartConfigProps {
  queryResults: any[];
  columns: string[];
  onConfigChange: (config: any) => void;
  initialConfig?: any;
  className?: string;
}

interface ChartConfigData {
  chart_type: string;
  x_key: string;
  y_key: string;
  series_key: string;
  series: Array<{
    type: string;
    xKey: string;
    yKey: string;
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
        x_key: initialConfig.x_key || '',
        y_key: initialConfig.y_key || '',
        series_key: initialConfig.series_key || '',
        series: initialConfig.series || []
      };
    }
    return {
      chart_type: 'bar',
      x_key: '',
      y_key: '',
      series_key: '',
      series: []
    };
  });

  const [selectedSeriesValues, setSelectedSeriesValues] = useState<string[]>(() => {
    return initialConfig?.selectedSeriesValues || [];
  });


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
        .map(row => row[config.series_key])
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
      selectedSeriesValues.includes(row[config.series_key])
    );
  }, [queryResults, config.series_key, selectedSeriesValues]);

  // Update series when x_key, y_key, series_key, or chart_type change
  useEffect(() => {
    if (config.x_key && config.y_key && config.series_key && filteredData && filteredData.length > 0) {
      // Get unique values from the series_key column using filtered data
      const uniqueSeriesValues = [...new Set(filteredData.map(row => row[config.series_key]).filter(val => val !== null && val !== undefined))];
      
      const newSeries = uniqueSeriesValues.map(seriesValue => ({
        type: config.chart_type,
        xKey: config.x_key,
        yKey: config.y_key,
        seriesValue: seriesValue
      }));
      
      setConfig(prev => ({
        ...prev,
        series: newSeries,
        filteredData: filteredData,
        selectedSeriesValues: selectedSeriesValues
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        series: [],
        filteredData: queryResults,
        selectedSeriesValues: selectedSeriesValues
      }));
    }
  }, [config.x_key, config.y_key, config.series_key, config.chart_type, filteredData, selectedSeriesValues, queryResults]);

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handleChartTypeChange = (chartType: string) => {
    setConfig(prev => ({
      ...prev,
      chart_type: chartType,
      series: prev.series.map(series => ({
        ...series,
        type: chartType
      }))
    }));
  };

  const handleXKeyChange = (xKey: string) => {
    setConfig(prev => ({
      ...prev,
      x_key: xKey
    }));
  };

  const handleYKeyChange = (yKey: string) => {
    setConfig(prev => ({
      ...prev,
      y_key: yKey
    }));
  };

  const handleSeriesKeyChange = (seriesKey: string) => {
    setConfig(prev => ({
      ...prev,
      series_key: seriesKey
    }));
    
    // Reset selected series values when series key changes
    setSelectedSeriesValues([]);
  };

  const handleSeriesValueToggle = (seriesValue: string) => {
    setSelectedSeriesValues(prev => {
      if (prev.includes(seriesValue)) {
        return prev.filter(val => val !== seriesValue);
      } else {
        return [...prev, seriesValue];
      }
    });
  };

  const handleSelectAllSeries = () => {
    setSelectedSeriesValues(distinctSeriesValues);
  };

  const handleDeselectAllSeries = () => {
    setSelectedSeriesValues([]);
  };


  // Get numeric columns for y-axis selection
  const numericColumns = useMemo(() => {
    if (!queryResults || queryResults.length === 0) return columns;
    
    return columns.filter(column => {
      const sampleValue = queryResults[0]?.[column];
      return typeof sampleValue === 'number' || !isNaN(Number(sampleValue));
    });
  }, [columns, queryResults]);

  // Get string columns for x-axis selection
  const stringColumns = useMemo(() => {
    if (!queryResults || queryResults.length === 0) return columns;
    
    return columns.filter(column => {
      const sampleValue = queryResults[0]?.[column];
      return typeof sampleValue === 'string' || typeof sampleValue === 'object';
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
            {chartTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* X-Axis Selection */}
        <div className="col-12">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            X-Axis (Category)
          </label>
          <select 
            className="form-select"
            value={config.x_key}
            onChange={(e) => handleXKeyChange(e.target.value)}
            style={{ borderColor: '#aa0000', fontSize: '0.8rem' }}
          >
            <option value="">Select X-axis column</option>
            {stringColumns.map(column => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        {/* Y-Axis Selection */}
        <div className="col-12">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            Y-Axis (Values)
          </label>
          <select 
            className="form-select"
            value={config.y_key}
            onChange={(e) => handleYKeyChange(e.target.value)}
            style={{ borderColor: '#aa0000', fontSize: '0.8rem' }}
          >
            <option value="">Select Y-axis column</option>
            {numericColumns.map(column => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          {numericColumns.length === 0 && (
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              No numeric columns found for Y-axis
            </div>
          )}
        </div>

        {/* Series Differentiation Selection */}
        <div className="col-12">
          <label className="form-label fw-bold" style={{ color: '#aa0000', fontSize: '0.8rem' }}>
            Series Differentiation
          </label>
          <select 
            className="form-select"
            value={config.series_key}
            onChange={(e) => handleSeriesKeyChange(e.target.value)}
            style={{ borderColor: '#aa0000', fontSize: '0.8rem' }}
          >
            <option value="">Select series column</option>
            {stringColumns.map(column => (
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
