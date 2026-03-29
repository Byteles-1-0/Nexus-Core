// src/components/views/OverviewView.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import StatCard from '../common/StatCard';
import Card from '../common/Card';
import DataTable from '../common/DataTable';
import Badge from '../common/Badge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { escapeHtml, formatCurrency } from '../../utils/helpers';

const OverviewView = ({ contracts, onRefresh, onViewChange }) => {
  const [kpi, setKpi] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [costsData, setCostsData] = useState(null);
  const [showCostsPopup, setShowCostsPopup] = useState(false);

  useEffect(() => {
    loadKpi();
    loadExpiring();
    loadCosts();
  }, []);

  const loadKpi = async () => {
    try {
      const res = await api.getKpi();
      if (res.ok) setKpi(await res.json());
    } catch (err) { console.error(err); }
  };
  const loadExpiring = async () => {
    try {
      const res = await api.getExpiring();
      if (res.ok) setExpiring((await res.json()) || []);
    } catch (err) { console.error(err); }
  };
  const loadCosts = async () => {
    try {
      const res = await api.getCosts('totale');
      if (res.ok) setCostsData(await res.json());
    } catch (err) { console.error(err); }
  };

  return (
    <section className="view active">
      {/* Action button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button variant="primary" onClick={() => onViewChange('upload')}>
          <i className="ri-sparkling-2-line"></i> Analizza Contratto
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="stats-grid">
        {kpi ? (
          <>
            <StatCard icon="ri-money-euro-circle-line" value={`€ ${(kpi.fatturato_totale / 1000).toFixed(0)}k`} label={`Fatturato Annuo +${kpi.yoy_growth}% YoY`} color="blue" />
            <StatCard icon="ri-line-chart-line" value={`${kpi.margine_pct}%`} label={`Margine Operativo +${kpi.mom_margine}% MoM`} color="green" />
            <StatCard icon="ri-check-double-line" value={kpi.attivi} label={`Contratti Attivi ${kpi.in_scadenza_90} in scadenza`} color="purple" />
            <StatCard icon="ri-trend-up-line" value={`${kpi.mom_growth}%`} label="Tasso di Crescita Mensile" color="orange" />
          </>
        ) : (
          <EmptyState message="Dati KPI non disponibili. Carica il primo contratto." />
        )}
      </div>

      {/* Costs Widget */}
      {costsData && (
        <div style={{ marginTop: '1.5rem' }}>
          <div
            onClick={() => setShowCostsPopup(!showCostsPopup)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', cursor: 'pointer',
              transition: 'border-color 0.15s',
              borderColor: showCostsPopup ? 'var(--accent)' : 'var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ri-pie-chart-2-line" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Reparto Costi</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Fissi: {formatCurrency(costsData.tot_fissi)} · Variabili: {formatCurrency(costsData.tot_variabili)} · Costo/contratto: {formatCurrency(costsData.costo_unit_trad)}
                </div>
              </div>
            </div>
            <i className={`ri-arrow-${showCostsPopup ? 'up' : 'down'}-s-line`} style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}></i>
          </div>

          {showCostsPopup && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Costi Fissi</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCurrency(costsData.tot_fissi)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Costi Variabili</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCurrency(costsData.tot_variabili)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Costo / Contratto</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCurrency(costsData.costo_unit_trad)}</div>
                </div>
              </div>

              {costsData.fissi && costsData.fissi.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Costi Fissi</h4>
                  <table className="data-table" style={{ fontSize: '0.82rem' }}>
                    <thead><tr><th>Voce</th><th>Tipo</th><th>Importo</th></tr></thead>
                    <tbody>
                      {costsData.fissi.map((f, i) => (
                        <tr key={i}>
                          <td>{f.voce}</td>
                          <td><Badge variant="info">{f.tipo}</Badge></td>
                          <td><strong>{formatCurrency(f.importo)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {costsData.variabili && costsData.variabili.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Costi Variabili</h4>
                  <table className="data-table" style={{ fontSize: '0.82rem' }}>
                    <thead><tr><th>Voce</th><th>Tipo</th><th>Costo</th></tr></thead>
                    <tbody>
                      {costsData.variabili.map((v, i) => (
                        <tr key={i}>
                          <td>{v.voce}</td>
                          <td><Badge variant="purple">{v.tipo}</Badge></td>
                          <td><strong>{v.unita || 'N/A'}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="dashboard-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <Card>
          <Card.Header>
            <h2><i className="ri-list-check-2"></i> Ultime Attività</h2>
            <Button variant="ghost" onClick={onRefresh}><i className="ri-refresh-line"></i> Aggiorna</Button>
          </Card.Header>
          <Card.Body>
            {contracts && contracts.length > 0 ? (
              <DataTable headers={['Cliente', 'Prodotto', 'Stato']}>
                {contracts.slice(0, 5).map((c) => (
                  <tr key={c.id} onClick={() => onViewChange('contracts')} style={{ cursor: 'pointer' }}>
                    <td>{escapeHtml(c.cliente)}</td>
                    <td><Badge variant={c.prodotto === 'Freader' ? 'purple' : 'warning'}>{c.prodotto}</Badge></td>
                    <td><Badge variant="success">{c.status}</Badge></td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptyState message="Nessun contratto ancora. Usa 'Analizza Contratto' per iniziare." />
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
                <div key={idx} className="anomaly-item" style={{ marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => onViewChange('contracts')}>
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
