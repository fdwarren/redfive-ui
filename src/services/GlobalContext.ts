export interface ChartSettings {
    chart_type: 'bar' | 'line' | 'area' | 'scatter' | 'pie';
    x_key: string | null;
    y_key: string | null;
    series_key: string | null;
    series: any[];
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
  
export class GlobalContext {
    static instance: GlobalContext = new GlobalContext();

    private models: Model[] = [];
    private savedQueries: SavedQuery[] = [];

    private schemaMap: Record<string, Record<string, any[]>> = {};
    private modelsChangedListeners: (() => void)[] = [];
    private savedQueriesChangedListeners: (() => void)[] = [];

    private spatialColumns: string[] = [];

    private constructor() {
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

    // private chartSettings: ChartSettings = {
    //     chart_type: 'bar',
    //     x_key: null,
    //     y_key: null,
    //     series_key: null,
    //     series: []
    // };

    // public getChartSettings(): ChartSettings {
    //     return this.chartSettings;
    // }

    // public setChartSettings(settings: ChartSettings) {
    //     this.chartSettings = settings;
    // }
}