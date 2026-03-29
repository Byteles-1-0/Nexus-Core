// src/components/views/RadarView.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import Badge from '../common/Badge';

const RadarView = () => {
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    try {
      const res = await api.getAnomalies();
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data || []);
      }
    } catch (err) {
      console.error('Error loading anomalies:', err);
    }
  };

  return (
    <section className="view active">
      <Card>
        <Card.Header>
          <h2>
            <i className="ri-radar-fill" style={{ color: 'var(--color-danger)' }}></i> Radar delle Criticità
          </h2>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {anomalies.length > 0 ? (
              anomalies.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: '1 1 300px',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${a.gravita === 'alta' ? 'var(--color-danger)' : 'var(--border-color)'}`,
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{a.cliente}</h3>
                    <Badge variant={a.gravita === 'alta' ? 'danger' : 'warning'}>
                      {a.gravita.toUpperCase()}
                    </Badge>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    <i className="ri-alert-line"></i> {a.tipo.replace('_', ' ')}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{a.desc}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Nessuna anomalia rilevata. Ottimo!</p>
            )}
          </div>
        </Card.Body>
      </Card>
    </section>
  );
};

export default RadarView;
