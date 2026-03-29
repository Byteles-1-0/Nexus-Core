// src/components/views/OverviewView.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import StatCard from '../common/StatCard';
import Card from '../common/Card';
import DataTable from '../common/DataTable';
import Badge from '../common/Badge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { escapeHtml } from '../../utils/helpers';

const OverviewView = ({ contracts, onRefresh, onViewChange }) => {
  const [kpi, setKpi] = useState(null);
  const [expiring, setExpiring] = useState([]);

  useEffect(() => {
    loadKpi();
    loadExpiring();
  }, []);

  const loadKpi = async () => {
    try {
      const res = await api.getKpi();
      if (res.ok) {
        const data = await res.json();
        setKpi(data);
      }
    } catch (err) {
      console.error('Error loading KPI:', err);
    }
  };

  const loadExpiring = async () => {
    try {
      const res = await api.getExpiring();
      if (res.ok) {
        const data = await res.json();
        setExpiring(data || []);
      }
    } catch (err) {
      console.error('Error loading expiring:', err);
    }
  };

  return (
    <section className="view active">
      <div className="stats-grid">
        {kpi ? (
          <>
            <StatCard
              icon="ri-money-euro-circle-line"
              value={`€ ${(kpi.fatturato_totale / 1000).toFixed(0)}k`}
              label={`Fatturato Annuo +${kpi.yoy_growth}% YoY`}
              color="blue"
            />
            <StatCard
              icon="ri-line-chart-line"
              value={`${kpi.margine_pct}%`}
              label={`Margine Operativo +${kpi.mom_margine}% MoM`}
              color="green"
            />
            <StatCard
              icon="ri-check-double-line"
              value={kpi.attivi}
              label={`Contratti Attivi ${kpi.in_scadenza_90} in scadenza`}
              color="purple"
            />
            <StatCard
              icon="ri-trend-up-line"
              value={`${kpi.mom_growth}%`}
              label="Tasso di Crescita Mensile"
              color="orange"
            />
          </>
        ) : (
          <EmptyState message="Dati KPI non disponibili. Carica il primo contratto." />
        )}
      </div>

      <div className="dashboard-split" style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '1.5rem', 
        marginTop: '1.5rem' 
      }}>
        <Card>
          <Card.Header>
            <h2><i className="ri-list-check-2"></i> Ultime Attività</h2>
            <Button variant="ghost" onClick={onRefresh}>
              <i className="ri-refresh-line"></i> Aggiorna
            </Button>
          </Card.Header>
          <Card.Body>
            {contracts && contracts.length > 0 ? (
              <DataTable headers={['Cliente', 'Prodotto', 'Stato']}>
                {contracts.slice(0, 5).map((c) => (
                  <tr key={c.id} onClick={() => onViewChange('contracts')} style={{ cursor: 'pointer' }}>
                    <td>{escapeHtml(c.cliente)}</td>
                    <td>
                      <Badge variant={c.prodotto === 'Freader' ? 'purple' : 'warning'}>
                        {c.prodotto}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="success">{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptyState message="Nessun contratto ancora. Carica il primo dalla sezione Upload." />
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h2><i className="ri-alarm-warning-line"></i> Prossime Scadenze</h2>
          </Card.Header>
          <Card.Body>
            {expiring.length > 0 ? (
              expiring.map((e, idx) => (
                <div
                  key={idx}
                  className="anomaly-item"
                  style={{ marginBottom: '0.5rem', cursor: 'pointer' }}
                  onClick={() => onViewChange('contracts')}
                >
                  <div style={{ flex: 1 }}>
                    <div className="a-title">{e.cliente}</div>
                    <div className="a-desc">Scade il {e.scadenza} — {e.prodotto}</div>
                  </div>
                  <div className="a-client">€ {e.canone_trim}/trim</div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-tertiary)' }}>Nessuna scadenza imminente.</p>
            )}
          </Card.Body>
        </Card>
      </div>
    </section>
  );
};

export default OverviewView;
