export interface ChartSettings {
    chart_type: 'bar' | 'line' | 'area' | 'scatter' | 'pie';
    x_key: string | null;
    y_key: string | null;
    series_key: string | null;
    series: any[];
    filteredData?: any[];
    selectedSeriesValues?: string[];
}

export interface ChartState {
    // Per-tab chart configurations
    tabConfigs: Record<string, ChartSettings>;
    // Global chart preferences
    defaultChartType: 'bar' | 'line' | 'area' | 'scatter' | 'pie';
    // Chart display preferences
    showLegend: boolean;
    showDataLabels: boolean;
    colorPalette: string[];
}

export interface Model {
    name: string;
    schema_name: string;
    description: string;
    columns: any[];
}

export interface SavedQuery {
    guid: string;
    name: string;
    description: string;
    sqlText: string;
    chartConfig: any;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ToastNotification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
    isVisible: boolean;
}

export interface UIState {
    leftPanelWidth: number;
    rightPanelWidth: number;
    isChatCollapsed: boolean;
    isResultsDetailsCollapsed: boolean;
    queryEditorHeight: number;
    resultsDetailsWidth: number;
}

export interface SelectionState {
    selectedTable: any;
    selectedSchema: string | null;
    selectedQuery: any;
    selectedRowIndex: number | null;
}

export interface SqlGenerationState {
    generatedSql: string | null;
    isGenerating: boolean;
    lastPrompt: string | null;
}

export interface ExecutionState {
    isExecuting: boolean;
    activeTabId: string | null;
    executionHistory: Array<{
        timestamp: number;
        sql: string;
        tabId: string;
        success: boolean;
        error?: string;
    }>;
}
  
export class GlobalContext {
    static instance: GlobalContext = new GlobalContext();

    private models: Model[] = [];
    private savedQueries: SavedQuery[] = [];
    private schemaMap: Record<string, Record<string, any[]>> = {};
    private spatialColumns: string[] = [];

    // New state management
    private uiState: UIState = {
        leftPanelWidth: 312,
        rightPanelWidth: 437,
        isChatCollapsed: false,
        isResultsDetailsCollapsed: true,
        queryEditorHeight: 50,
        resultsDetailsWidth: 300
    };

    private selectionState: SelectionState = {
        selectedTable: null,
        selectedSchema: null,
        selectedQuery: null,
        selectedRowIndex: null
    };

    private sqlGenerationState: SqlGenerationState = {
        generatedSql: null,
        isGenerating: false,
        lastPrompt: null
    };

    private executionState: ExecutionState = {
        isExecuting: false,
        activeTabId: null,
        executionHistory: []
    };

    private notifications: ToastNotification[] = [];

    private chartState: ChartState = {
        tabConfigs: {},
        defaultChartType: 'bar',
        showLegend: true,
        showDataLabels: false,
        colorPalette: [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
            '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
            '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
        ]
    };

    // Event listeners
    private modelsChangedListeners: (() => void)[] = [];
    private savedQueriesChangedListeners: (() => void)[] = [];
    private uiStateChangedListeners: (() => void)[] = [];
    private selectionStateChangedListeners: (() => void)[] = [];
    private sqlGenerationStateChangedListeners: (() => void)[] = [];
    private executionStateChangedListeners: (() => void)[] = [];
    private notificationsChangedListeners: (() => void)[] = [];
    private chartStateChangedListeners: (() => void)[] = [];

    private constructor() {
        // Load UI state from localStorage if available
        this.loadUIStateFromStorage();
        this.loadChartStateFromStorage();
    }

    public getModels(): Model[] {
        return this.models;
    }

    public setModels(models: Model[]) {
        this.models = models;
        this.organizeModelsBySchema();
        this.extractSpatialColumns();
        this.modelsChangedListeners.forEach(listener => listener());
    }

    public getSavedQueries(): SavedQuery[] {
        return this.savedQueries;
    }

    public setSavedQueries(savedQueries: SavedQuery[]) {
        this.savedQueries = savedQueries;
        this.savedQueriesChangedListeners.forEach(listener => listener());
        console.log('Saved queries set', this.savedQueries);
    }

    public getSpatialColumns(): string[] {
        return this.spatialColumns;
    }

    public setSpatialColumns(spatialColumns: string[]) {
        this.spatialColumns = spatialColumns;
    }

    public getSchemaMap(): Record<string, Record<string, any[]>> {
        return this.schemaMap;
    }

    public addModelsChangedListener(listener: () => void) {
        this.modelsChangedListeners.push(listener);
    }

    public removeModelsChangedListener(listener: () => void) {
        this.modelsChangedListeners = this.modelsChangedListeners.filter(l => l !== listener);
    }

    public addSavedQueriesChangedListener(listener: () => void) {
        this.savedQueriesChangedListeners.push(listener);
    }

    public removeSavedQueriesChangedListener(listener: () => void) {
        this.savedQueriesChangedListeners = this.savedQueriesChangedListeners.filter(l => l !== listener);
    }

    private extractSpatialColumns() {
        this.spatialColumns = [];
        
        this.models.forEach(model => {
          if (model.columns && Array.isArray(model.columns)) {
            model.columns.forEach((column: any) => {
              if (column.spatial_type && column.spatial_type !== null && column.spatial_type !== '') {
                this.spatialColumns.push(column.name);
              }
            });
          }
        });
      };
    
    private organizeModelsBySchema() {
        this.models.forEach(model => {
          if (!this.schemaMap[model.schema_name]) {
            this.schemaMap[model.schema_name] = {};
          }
          if (!this.schemaMap[model.schema_name][model.name]) {
            this.schemaMap[model.schema_name][model.name] = [];
          }
          
          if (model.columns) {
            this.schemaMap[model.schema_name][model.name] = model.columns;
          }
        });
        
        console.log('Schema map', this.schemaMap);
        return this.schemaMap;
    };

    // ============ UI STATE MANAGEMENT ============
    public getUIState(): UIState {
        return { ...this.uiState };
    }

    public setUIState(uiState: Partial<UIState>) {
        this.uiState = { ...this.uiState, ...uiState };
        this.saveUIStateToStorage();
        this.uiStateChangedListeners.forEach(listener => listener());
    }

    public addUIStateChangedListener(listener: () => void) {
        this.uiStateChangedListeners.push(listener);
    }

    public removeUIStateChangedListener(listener: () => void) {
        this.uiStateChangedListeners = this.uiStateChangedListeners.filter(l => l !== listener);
    }

    private loadUIStateFromStorage() {
        try {
            const stored = localStorage.getItem('redfive_ui_state');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.uiState = { 
                    ...this.uiState, 
                    ...parsed, 
                    // Always default to collapsed details pane
                    isResultsDetailsCollapsed: true 
                };
            }
        } catch (error) {
            console.warn('Failed to load UI state from storage:', error);
        }
    }

    private saveUIStateToStorage() {
        try {
            localStorage.setItem('redfive_ui_state', JSON.stringify(this.uiState));
        } catch (error) {
            console.warn('Failed to save UI state to storage:', error);
        }
    }

    // ============ SELECTION STATE MANAGEMENT ============
    public getSelectionState(): SelectionState {
        return { ...this.selectionState };
    }

    public setSelectionState(selectionState: Partial<SelectionState>) {
        this.selectionState = { ...this.selectionState, ...selectionState };
        this.selectionStateChangedListeners.forEach(listener => listener());
    }

    public addSelectionStateChangedListener(listener: () => void) {
        this.selectionStateChangedListeners.push(listener);
    }

    public removeSelectionStateChangedListener(listener: () => void) {
        this.selectionStateChangedListeners = this.selectionStateChangedListeners.filter(l => l !== listener);
    }

    // ============ SQL GENERATION STATE MANAGEMENT ============
    public getSqlGenerationState(): SqlGenerationState {
        return { ...this.sqlGenerationState };
    }

    public setSqlGenerationState(sqlGenerationState: Partial<SqlGenerationState>) {
        this.sqlGenerationState = { ...this.sqlGenerationState, ...sqlGenerationState };
        this.sqlGenerationStateChangedListeners.forEach(listener => listener());
    }

    public addSqlGenerationStateChangedListener(listener: () => void) {
        this.sqlGenerationStateChangedListeners.push(listener);
    }

    public removeSqlGenerationStateChangedListener(listener: () => void) {
        this.sqlGenerationStateChangedListeners = this.sqlGenerationStateChangedListeners.filter(l => l !== listener);
    }

    // ============ EXECUTION STATE MANAGEMENT ============
    public getExecutionState(): ExecutionState {
        return { ...this.executionState };
    }

    public setExecutionState(executionState: Partial<ExecutionState>) {
        this.executionState = { ...this.executionState, ...executionState };
        this.executionStateChangedListeners.forEach(listener => listener());
    }

    public addExecutionStateChangedListener(listener: () => void) {
        this.executionStateChangedListeners.push(listener);
    }

    public removeExecutionStateChangedListener(listener: () => void) {
        this.executionStateChangedListeners = this.executionStateChangedListeners.filter(l => l !== listener);
    }

    public addToExecutionHistory(entry: Omit<ExecutionState['executionHistory'][0], 'timestamp'>) {
        const historyEntry = {
            ...entry,
            timestamp: Date.now()
        };
        this.executionState.executionHistory.unshift(historyEntry);
        // Keep only last 50 entries
        if (this.executionState.executionHistory.length > 50) {
            this.executionState.executionHistory = this.executionState.executionHistory.slice(0, 50);
        }
        this.executionStateChangedListeners.forEach(listener => listener());
    }

    // ============ NOTIFICATION MANAGEMENT ============
    public getNotifications(): ToastNotification[] {
        return [...this.notifications];
    }

    public addNotification(notification: Omit<ToastNotification, 'id' | 'isVisible'>) {
        const newNotification: ToastNotification = {
            ...notification,
            id: crypto.randomUUID(),
            isVisible: true,
            duration: notification.duration || 3000
        };
        
        this.notifications.push(newNotification);
        this.notificationsChangedListeners.forEach(listener => listener());

        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(newNotification.id);
        }, newNotification.duration);

        return newNotification.id;
    }

    public removeNotification(id: string) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications[index].isVisible = false;
            // Remove after animation completes
            setTimeout(() => {
                this.notifications = this.notifications.filter(n => n.id !== id);
                this.notificationsChangedListeners.forEach(listener => listener());
            }, 300);
            this.notificationsChangedListeners.forEach(listener => listener());
        }
    }

    public clearAllNotifications() {
        this.notifications.forEach(n => n.isVisible = false);
        setTimeout(() => {
            this.notifications = [];
            this.notificationsChangedListeners.forEach(listener => listener());
        }, 300);
        this.notificationsChangedListeners.forEach(listener => listener());
    }

    public addNotificationsChangedListener(listener: () => void) {
        this.notificationsChangedListeners.push(listener);
    }

    public removeNotificationsChangedListener(listener: () => void) {
        this.notificationsChangedListeners = this.notificationsChangedListeners.filter(l => l !== listener);
    }

    // ============ CONVENIENCE METHODS ============
    public showSuccess(message: string, duration?: number) {
        return this.addNotification({ message, type: 'success', duration });
    }

    public showError(message: string, duration?: number) {
        return this.addNotification({ message, type: 'error', duration: duration || 5000 });
    }

    public showInfo(message: string, duration?: number) {
        return this.addNotification({ message, type: 'info', duration });
    }

    // ============ CHART STATE MANAGEMENT ============
    public getChartState(): ChartState {
        return { ...this.chartState };
    }

    public setChartState(chartState: Partial<ChartState>) {
        this.chartState = { ...this.chartState, ...chartState };
        this.saveChartStateToStorage();
        this.chartStateChangedListeners.forEach(listener => listener());
    }

    public getTabChartConfig(tabId: string): ChartSettings | null {
        return this.chartState.tabConfigs[tabId] || null;
    }

    public setTabChartConfig(tabId: string, config: ChartSettings) {
        this.chartState.tabConfigs = {
            ...this.chartState.tabConfigs,
            [tabId]: { ...config }
        };
        this.saveChartStateToStorage();
        this.chartStateChangedListeners.forEach(listener => listener());
    }

    public removeTabChartConfig(tabId: string) {
        const { [tabId]: removed, ...rest } = this.chartState.tabConfigs;
        this.chartState.tabConfigs = rest;
        this.saveChartStateToStorage();
        this.chartStateChangedListeners.forEach(listener => listener());
    }

    public getDefaultChartConfig(columns: string[]): ChartSettings {
        // Auto-detect best columns for charting
        const numericColumns = columns.filter(col => 
            !['id', 'guid', 'uuid'].some(suffix => col.toLowerCase().includes(suffix))
        );
        
        return {
            chart_type: this.chartState.defaultChartType,
            x_key: columns[0] || null,
            y_key: numericColumns[0] || columns[1] || null,
            series_key: null,
            series: [],
            filteredData: [],
            selectedSeriesValues: []
        };
    }


    public addChartStateChangedListener(listener: () => void) {
        this.chartStateChangedListeners.push(listener);
    }

    public removeChartStateChangedListener(listener: () => void) {
        this.chartStateChangedListeners = this.chartStateChangedListeners.filter(l => l !== listener);
    }

    private loadChartStateFromStorage() {
        try {
            const stored = localStorage.getItem('redfive_chart_state');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.chartState = { ...this.chartState, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load chart state from storage:', error);
        }
    }

    private saveChartStateToStorage() {
        try {
            localStorage.setItem('redfive_chart_state', JSON.stringify(this.chartState));
        } catch (error) {
            console.warn('Failed to save chart state to storage:', error);
        }
    }

    // ============ CHART CONVENIENCE METHODS ============
    public setDefaultChartType(chartType: 'bar' | 'line' | 'area' | 'scatter' | 'pie') {
        this.setChartState({ defaultChartType: chartType });
    }

    public updateChartPreferences(preferences: {
        showLegend?: boolean;
        showDataLabels?: boolean;
        colorPalette?: string[];
    }) {
        this.setChartState(preferences);
    }

    public getColorPalette(): string[] {
        return [...this.chartState.colorPalette];
    }

    public resetChartState() {
        this.chartState = {
            tabConfigs: {},
            defaultChartType: 'bar',
            showLegend: true,
            showDataLabels: false,
            colorPalette: [
                '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
                '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
                '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
            ]
        };
        this.saveChartStateToStorage();
        this.chartStateChangedListeners.forEach(listener => listener());
    }
}