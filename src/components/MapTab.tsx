import React, { memo, useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';

interface MapTabProps {
  results?: any[];
  columns?: string[];
  onRowSelect?: (rowIndex: number) => void;
  selectedRowIndex?: number | null;
}

const MapTab: React.FC<MapTabProps> = ({ results, columns, onRowSelect, selectedRowIndex }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapViewRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGraphicId, setSelectedGraphicId] = useState<number | null>(null);
  const currentDatasetHashRef = useRef<string>('');

  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Load ArcGIS CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://js.arcgis.com/4.29/esri/themes/light/main.css';
        document.head.appendChild(cssLink);

        // Create map
        const map = new Map({
          basemap: 'gray-vector'
        });

        // Create map view
        const view = new MapView({
          container: mapRef.current!,
          map: map,
          center: [-98.5795, 39.8283], // Center of US
          zoom: 4
        });

        mapViewRef.current = view;

        // Wait for view to be ready
        await view.when();
        setMapLoaded(true);

        // Add click event handler for graphics
        view.on('click', (event: any) => {
          view.hitTest(event).then((response: any) => {
            if (response.results.length > 0) {
              const graphic = response.results[0].graphic;
              if (graphic && graphic.attributes && graphic.attributes.id !== undefined) {
                const rowIndex = graphic.attributes.id;
                setSelectedGraphicId(rowIndex);
                if (onRowSelect) {
                  onRowSelect(rowIndex);
                }
              }
            }
          });
        });

        // Add graphics layer for spatial data
        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        // Process results if available
        if (results && results.length > 0) {
          processSpatialData(results, columns, graphicsLayer, true);
        }

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapViewRef.current) {
        mapViewRef.current.destroy();
        mapViewRef.current = null;
      }
    };
  }, []);

  // Create a hash of the current dataset to detect changes
  const createDatasetHash = (results: any[], columns: string[]) => {
    const dataString = JSON.stringify({ results, columns });
    return btoa(dataString).slice(0, 16); // Create a short hash
  };

  // Process spatial data when results change
  useEffect(() => {
    if (mapLoaded && results && results.length > 0 && mapViewRef.current) {
      const graphicsLayer = mapViewRef.current.map.layers.find((layer: any) => layer.type === 'graphics');
      if (graphicsLayer) {
        const newDatasetHash = createDatasetHash(results, columns || []);
        const isNewDataset = newDatasetHash !== currentDatasetHashRef.current;
        
        console.log('MapTab: Processing spatial data', { 
          isNewDataset, 
          currentHash: currentDatasetHashRef.current, 
          newHash: newDatasetHash 
        });
        
        graphicsLayer.removeAll();
        processSpatialData(results, columns || [], graphicsLayer, isNewDataset);
        
        if (isNewDataset) {
          currentDatasetHashRef.current = newDatasetHash;
        }
      }
    }
  }, [results, columns, mapLoaded]);

  // Update graphic symbols when selection changes
  useEffect(() => {
    if (mapLoaded && mapViewRef.current) {
      const graphicsLayer = mapViewRef.current.map.layers.find((layer: any) => layer.type === 'graphics');
      if (graphicsLayer) {
        updateGraphicSymbols(graphicsLayer, selectedGraphicId);
      }
    }
  }, [selectedGraphicId, mapLoaded]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!results || results.length === 0 || !onRowSelect) return;
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = selectedRowIndex ?? -1;
        const newIndex = Math.min(currentIndex + 1, results.length - 1);
        onRowSelect(newIndex);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = selectedRowIndex ?? 0;
        const newIndex = Math.max(currentIndex - 1, 0);
        onRowSelect(newIndex);
      }
    };

    // Add event listener to the map container
    const mapElement = mapRef.current;
    if (mapElement) {
      mapElement.addEventListener('keydown', handleKeyDown);
      return () => mapElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [results, selectedRowIndex, onRowSelect]);

  // Sync selectedGraphicId with selectedRowIndex from parent
  useEffect(() => {
    if (selectedRowIndex !== null && selectedRowIndex !== undefined && selectedRowIndex !== selectedGraphicId) {
      setSelectedGraphicId(selectedRowIndex);
    }
  }, [selectedRowIndex, selectedGraphicId]);

  const updateGraphicSymbols = (graphicsLayer: any, selectedId: number | null) => {
    if (!graphicsLayer) return;
    
    graphicsLayer.graphics.forEach((graphic: any) => {
      const isSelected = graphic.attributes.id === selectedId;
      
      if (graphic.geometry.type === 'point') {
        graphic.symbol = new SimpleMarkerSymbol({
          color: isSelected ? 'white' : '#aa0000',
          size: isSelected ? 12 : 8,
          outline: isSelected ? {
            color: '#aa0000',
            width: 2
          } : {
            color: '#aa0000',
            width: 2
          },
          style: 'circle'
        });
      } else if (graphic.geometry.type === 'polyline') {
        graphic.symbol = new SimpleLineSymbol({
          color: isSelected ? '#ff0000' : '#aa0000',
          width: isSelected ? 5 : 3
        });
      } else if (graphic.geometry.type === 'polygon') {
        graphic.symbol = new SimpleFillSymbol({
          color: isSelected ? [255, 0, 0, 0.5] : [170, 0, 0, 0.3],
          outline: {
            color: isSelected ? '#ff0000' : '#aa0000',
            width: isSelected ? 3 : 2
          }
        });
      }
    });
  };

  const processSpatialData = (data: any[], columns: string[] = [], graphicsLayer: any, shouldZoom: boolean = true) => {
    if (!data || data.length === 0) return;

    // Find spatial columns
    const spatialColumns = columns.filter(col => 
      data.some(row => row[col] && typeof row[col] === 'string' && 
        (row[col].includes('POINT') || row[col].includes('LINESTRING') || row[col].includes('POLYGON') ||
         row[col].startsWith('point:') || row[col].startsWith('linestring:') || row[col].startsWith('polygon:'))
      )
    );

    if (spatialColumns.length === 0) {
      console.log('No spatial data found in results');
      return;
    }

    data.forEach((row, index) => {
      spatialColumns.forEach(spatialCol => {
        const spatialData = row[spatialCol];
        if (!spatialData) return;

        try {
          let geometry;
          let symbol;

          // Check for new format first
          if (spatialData.startsWith('point:')) {
            const parsedPoint = parseNewFormatPoint(spatialData);
            if (parsedPoint) {
              geometry = new Point({
                longitude: parsedPoint.longitude,
                latitude: parsedPoint.latitude,
                spatialReference: { wkid: parsedPoint.crs }
              });
              symbol = new SimpleMarkerSymbol({
                color: 'white',
                size: 8,
                outline: {
                  color: '#aa0000',
                  width: 2
                },
                style: 'circle'
              });
            }
          } else if (spatialData.startsWith('linestring:')) {
            const parsedLine = parseNewFormatLine(spatialData);
            if (parsedLine) {
              geometry = new Polyline({
                paths: [parsedLine.coordinates],
                spatialReference: { wkid: parsedLine.crs }
              });
              symbol = new SimpleLineSymbol({
                color: '#aa0000',
                width: 3
              });
            }
          } else if (spatialData.startsWith('polygon:')) {
            const parsedPolygon = parseNewFormatPolygon(spatialData);
            if (parsedPolygon) {
              geometry = new Polygon({
                rings: parsedPolygon.rings,
                spatialReference: { wkid: parsedPolygon.crs }
              });
              symbol = new SimpleFillSymbol({
                color: [170, 0, 0, 0.3],
                outline: {
                  color: '#aa0000',
                  width: 2
                }
              });
            }
          } else if (spatialData.includes('POINT')) {
            // Parse POINT geometry (WKT format)
            const coords = parsePointGeometry(spatialData);
            if (coords) {
              geometry = new Point({
                longitude: coords[0],
                latitude: coords[1],
                spatialReference: { wkid: 4326 }
              });
              symbol = new SimpleMarkerSymbol({
                color: 'white',
                size: 8,
                outline: {
                  color: '#aa0000',
                  width: 2
                },
                style: 'circle'
              });
            }
          } else if (spatialData.includes('LINESTRING')) {
            // Parse LINESTRING geometry
            const coords = parseLineGeometry(spatialData);
            if (coords) {
              geometry = new Polyline({
                paths: [coords],
                spatialReference: { wkid: 4326 }
              });
              symbol = new SimpleLineSymbol({
                color: '#aa0000',
                width: 3
              });
            }
          } else if (spatialData.includes('POLYGON')) {
            // Parse POLYGON geometry
            const coords = parsePolygonGeometry(spatialData);
            if (coords) {
              geometry = new Polygon({
                rings: coords,
                spatialReference: { wkid: 4326 }
              });
              symbol = new SimpleFillSymbol({
                color: [170, 0, 0, 0.3],
                outline: {
                  color: '#aa0000',
                  width: 2
                }
              });
            }
          }

          if (geometry && symbol) {
            const graphic = new Graphic({
              geometry,
              symbol,
              attributes: {
                id: index,
                ...row
              }
            });
            graphicsLayer.add(graphic);
          }
        } catch (err) {
          console.warn(`Error processing spatial data for row ${index}:`, err);
        }
      });
    });

    // Fit view to graphics only if this is a new dataset
    console.log('MapTab: processSpatialData', { shouldZoom, graphicsCount: graphicsLayer.graphics.length });
    if (shouldZoom && graphicsLayer.graphics.length > 0) {
      console.log('MapTab: Zooming to graphics');
      mapViewRef.current?.goTo(graphicsLayer.graphics);
    }
  };

  const parsePointGeometry = (wkt: string): number[] | null => {
    const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
  };

  const parseNewFormatPoint = (spatialData: string): { longitude: number; latitude: number; crs: number } | null => {
    // Parse format: "point:longitude,latitude,crs"
    const match = spatialData.match(/^point:\s*([-\d.]+),\s*([-\d.]+),\s*(\d+)$/i);
    if (match) {
      return {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2]),
        crs: parseInt(match[3])
      };
    }
    return null;
  };

  const parseNewFormatLine = (spatialData: string): { coordinates: number[][]; crs: number } | null => {
    // Parse format: "linestring:lon1,lat1,lon2,lat2,...,crs"
    const match = spatialData.match(/^linestring:\s*([^,]+(?:,[^,]+)*),\s*(\d+)$/i);
    if (match) {
      const coordPairs = match[1].split(',');
      if (coordPairs.length >= 4 && coordPairs.length % 2 === 0) {
        const coordinates: number[][] = [];
        for (let i = 0; i < coordPairs.length; i += 2) {
          coordinates.push([parseFloat(coordPairs[i]), parseFloat(coordPairs[i + 1])]);
        }
        return {
          coordinates,
          crs: parseInt(match[2])
        };
      }
    }
    return null;
  };

  const parseNewFormatPolygon = (spatialData: string): { rings: number[][][]; crs: number } | null => {
    // Parse format: "polygon:(lon1,lat1,lon2,lat2,...),crs"
    const match = spatialData.match(/^polygon:\s*\(([^)]+)\),\s*(\d+)$/i);
    if (match) {
      const coordPairs = match[1].split(',');
      if (coordPairs.length >= 6 && coordPairs.length % 2 === 0) {
        const ring: number[][] = [];
        for (let i = 0; i < coordPairs.length; i += 2) {
          ring.push([parseFloat(coordPairs[i]), parseFloat(coordPairs[i + 1])]);
        }
        return {
          rings: [ring],
          crs: parseInt(match[2])
        };
      }
    }
    return null;
  };

  const parseLineGeometry = (wkt: string): number[][] | null => {
    const match = wkt.match(/LINESTRING\s*\((.*?)\)/i);
    if (match) {
      const coords = match[1].split(',').map(coord => {
        const [lon, lat] = coord.trim().split(/\s+/);
        return [parseFloat(lon), parseFloat(lat)];
      });
      return coords;
    }
    return null;
  };

  const parsePolygonGeometry = (wkt: string): number[][][] | null => {
    const match = wkt.match(/POLYGON\s*\((.*?)\)/i);
    if (match) {
      const rings = match[1].split('),(').map(ring => {
        const coords = ring.replace(/[()]/g, '').split(',').map(coord => {
          const [lon, lat] = coord.trim().split(/\s+/);
          return [parseFloat(lon), parseFloat(lat)];
        });
        return coords;
      });
      return rings;
    }
    return null;
  };

  return (
    <div className="flex-grow-1 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
      {error ? (
        <div className="d-flex justify-content-center align-items-center flex-grow-1">
          <div className="text-center text-danger">
            <i className="bi bi-exclamation-triangle display-4 mb-3"></i>
            <div>Map Error</div>
            <small>{error}</small>
          </div>
        </div>
      ) : (
        <div 
          ref={mapRef} 
          className="flex-grow-1" 
          style={{ 
            height: '100%',
            width: '100%'
          }}
          tabIndex={0}
          onFocus={() => {
            // Ensure the map is focused when clicked
            if (mapRef.current) {
              mapRef.current.focus();
            }
          }}
        />
      )}
    </div>
  );
};

export default memo(MapTab);
