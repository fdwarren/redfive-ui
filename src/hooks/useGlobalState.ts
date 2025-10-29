import { useEffect, useState } from 'react';
import { GlobalContext, type UIState, type SelectionState, type SqlGenerationState, type ExecutionState, type ChartState, type ChartSettings } from '../services/GlobalContext';

// Custom hook for UI state
export const useUIState = () => {
  const [uiState, setUIState] = useState<UIState>(GlobalContext.instance.getUIState());

  useEffect(() => {
    const handleChange = () => {
      setUIState(GlobalContext.instance.getUIState());
    };

    GlobalContext.instance.addUIStateChangedListener(handleChange);
    return () => GlobalContext.instance.removeUIStateChangedListener(handleChange);
  }, []);

  const updateUIState = (updates: Partial<UIState>) => {
    GlobalContext.instance.setUIState(updates);
  };

  return [uiState, updateUIState] as const;
};

// Custom hook for selection state
export const useSelectionState = () => {
  const [selectionState, setSelectionState] = useState<SelectionState>(GlobalContext.instance.getSelectionState());

  useEffect(() => {
    const handleChange = () => {
      setSelectionState(GlobalContext.instance.getSelectionState());
    };

    GlobalContext.instance.addSelectionStateChangedListener(handleChange);
    return () => GlobalContext.instance.removeSelectionStateChangedListener(handleChange);
  }, []);

  const updateSelectionState = (updates: Partial<SelectionState>) => {
    GlobalContext.instance.setSelectionState(updates);
  };

  return [selectionState, updateSelectionState] as const;
};

// Custom hook for SQL generation state
export const useSqlGenerationState = () => {
  const [sqlGenerationState, setSqlGenerationState] = useState<SqlGenerationState>(GlobalContext.instance.getSqlGenerationState());

  useEffect(() => {
    const handleChange = () => {
      setSqlGenerationState(GlobalContext.instance.getSqlGenerationState());
    };

    GlobalContext.instance.addSqlGenerationStateChangedListener(handleChange);
    return () => GlobalContext.instance.removeSqlGenerationStateChangedListener(handleChange);
  }, []);

  const updateSqlGenerationState = (updates: Partial<SqlGenerationState>) => {
    GlobalContext.instance.setSqlGenerationState(updates);
  };

  return [sqlGenerationState, updateSqlGenerationState] as const;
};

// Custom hook for execution state
export const useExecutionState = () => {
  const [executionState, setExecutionState] = useState<ExecutionState>(GlobalContext.instance.getExecutionState());

  useEffect(() => {
    const handleChange = () => {
      setExecutionState(GlobalContext.instance.getExecutionState());
    };

    GlobalContext.instance.addExecutionStateChangedListener(handleChange);
    return () => GlobalContext.instance.removeExecutionStateChangedListener(handleChange);
  }, []);

  const updateExecutionState = (updates: Partial<ExecutionState>) => {
    GlobalContext.instance.setExecutionState(updates);
  };

  const addToExecutionHistory = (entry: Omit<ExecutionState['executionHistory'][0], 'timestamp'>) => {
    GlobalContext.instance.addToExecutionHistory(entry);
  };

  return [executionState, updateExecutionState, addToExecutionHistory] as const;
};

// Custom hook for chart state
export const useChartState = () => {
  const [chartState, setChartState] = useState<ChartState>(GlobalContext.instance.getChartState());

  useEffect(() => {
    const handleChange = () => {
      setChartState(GlobalContext.instance.getChartState());
    };

    GlobalContext.instance.addChartStateChangedListener(handleChange);
    return () => GlobalContext.instance.removeChartStateChangedListener(handleChange);
  }, []);

  const updateChartState = (updates: Partial<ChartState>) => {
    GlobalContext.instance.setChartState(updates);
  };

  const getTabChartConfig = (tabId: string): ChartSettings | null => {
    return GlobalContext.instance.getTabChartConfig(tabId);
  };

  const setTabChartConfig = (tabId: string, config: ChartSettings) => {
    GlobalContext.instance.setTabChartConfig(tabId, config);
  };

  const removeTabChartConfig = (tabId: string) => {
    GlobalContext.instance.removeTabChartConfig(tabId);
  };

  const getDefaultChartConfig = (columns: string[]): ChartSettings => {
    return GlobalContext.instance.getDefaultChartConfig(columns);
  };


  const setDefaultChartType = (chartType: 'bar' | 'line' | 'area' | 'scatter' | 'pie') => {
    GlobalContext.instance.setDefaultChartType(chartType);
  };

  const updateChartPreferences = (preferences: {
    showLegend?: boolean;
    showDataLabels?: boolean;
    colorPalette?: string[];
  }) => {
    GlobalContext.instance.updateChartPreferences(preferences);
  };

  const getColorPalette = () => {
    return GlobalContext.instance.getColorPalette();
  };

  return {
    chartState,
    updateChartState,
    getTabChartConfig,
    setTabChartConfig,
    removeTabChartConfig,
    getDefaultChartConfig,
    setDefaultChartType,
    updateChartPreferences,
    getColorPalette,
  };
};

// Combined hook for common operations
export const useGlobalState = () => {
  const [uiState, updateUIState] = useUIState();
  const [selectionState, updateSelectionState] = useSelectionState();
  const [sqlGenerationState, updateSqlGenerationState] = useSqlGenerationState();
  const [executionState, updateExecutionState, addToExecutionHistory] = useExecutionState();
  const chartHooks = useChartState();

  // Convenience methods
  const showSuccess = (message: string, duration?: number) => {
    return GlobalContext.instance.showSuccess(message, duration);
  };

  const showError = (message: string, duration?: number) => {
    return GlobalContext.instance.showError(message, duration);
  };

  const showInfo = (message: string, duration?: number) => {
    return GlobalContext.instance.showInfo(message, duration);
  };

  return {
    uiState,
    updateUIState,
    selectionState,
    updateSelectionState,
    sqlGenerationState,
    updateSqlGenerationState,
    executionState,
    updateExecutionState,
    addToExecutionHistory,
    showSuccess,
    showError,
    showInfo,
    // Chart state and methods
    ...chartHooks,
  };
};
