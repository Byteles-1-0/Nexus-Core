// src/components/common/ItalyMap.jsx
// Mappa Italia con Leaflet vanilla
// Pin viola (#6366f1) per Freader, gialli (#f59e0b) per CutAI
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../utils/api';

const COLORS = {
  Freader: '#6366f1',
  CutAI: '#f59e0b',
};

const ItalyMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [hasPoints, setHasPoints] = useState(false);

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [42.5, 12.5],
        zoom: 5,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current);

      loadMapData();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const loadMapData = async () => {
    try {
      const res = await api.getMapContracts();
      if (res.ok) {
        const data = await res.json();
        
        if (data.features && data.features.length > 0) {
          setHasPoints(true);
          
          data.features.forEach((feature) => {
            const [lng, lat] = feature.geometry.coordinates;
            const { prodotto, cliente, sede, canone } = feature.properties;
            const color = COLORS[prodotto] || '#888';

            const circle = L.circleMarker([lat, lng], {
              radius: 8,
              fillColor: color,
              fillOpacity: 0.8,
              color: 'white',
              weight: 2,
            });

            const popupContent = `
              <div style="min-width: 150px;">
                <div style="font-weight: 700; margin-bottom: 4px;">${cliente}</div>
                <div style="color: ${color}; font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">
                  ${prodotto}
                </div>
                ${sede ? `<div style="opacity: 0.7; font-size: 0.85rem; margin-bottom: 4px;">${sede}</div>` : ''}
                ${canone != null ? `<div style="font-size: 0.85rem;">Canone: <strong>€${canone.toLocaleString('it-IT')}/trim</strong></div>` : ''}
              </div>
            `;

            circle.bindPopup(popupContent);
            circle.addTo(mapInstanceRef.current);
          });
        } else {
          setHasPoints(false);
        }
      }
    } catch (err) {
      console.error('Error loading map contracts:', err);
      setHasPoints(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '340px' }}>
      {/* Leaflet CSS override for dark theme */}
      <style>{`
        .leaflet-container {
          background: var(--bg-secondary) !important;
          border-radius: var(--radius-md);
          height: 100%;
        }
        .leaflet-tile {
          filter: brightness(0.7) saturate(0.4) hue-rotate(200deg);
        }
        .leaflet-popup-content-wrapper {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-color) !important;
          color: var(--text-primary) !important;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .leaflet-popup-tip {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-color) !important;
        }
        .leaflet-control-zoom a {
          background: var(--bg-card) !important;
          color: var(--text-primary) !important;
          border-color: var(--border-color) !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.4) !important;
          color: var(--text-tertiary) !important;
          font-size: 0.6rem;
        }
        .leaflet-control-attribution a { color: var(--text-tertiary) !important; }
      `}</style>

      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} />

      {/* Empty state overlay */}
      {!loading && !hasPoints && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-tertiary)',
          fontSize: '0.85rem',
          gap: '0.5rem',
          pointerEvents: 'none',
          zIndex: 1000,
        }}>
          <i className="ri-map-pin-line" style={{ fontSize: '2rem', opacity: 0.4 }}></i>
          <span>Nessun contratto con sede riconosciuta</span>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px',
        display: 'flex', gap: '12px',
        fontSize: '0.72rem',
        zIndex: 1000,
      }}>
        {Object.entries(COLORS).map(([name, color]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: color, display: 'inline-block',
              border: '2px solid white',
            }} />
            {name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItalyMap;
