// src/components/views/RepricingView.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import Badge from '../common/Badge';
import StatCard from '../common/StatCard';
import EmptyState from '../common/EmptyState';
import { formatCurrency } from '../../utils/helpers';

const RepricingView = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getRepricing();
      const json = await res.json();
      if (res.ok && json.status === 'success') setData(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <section className="view active"><p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Caricamento...</p></section>;

  const totalRevRisk = data.reduce((s, c) => s + c.revenue_a_rischio, 0);
  const totalDeltaRec = data.reduce((s, c) => s + (c.proposte.find(p => p.fascia === 'raccomandata')?.delta_revenue_annuo || 0), 0);

  return (
    <section className="view active">
      {/* Aggregate KPIs */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon="ri-calendar-todo-line" value={data.length} label="Contratti da Rinegoziare" color="orange" />
        <StatCard icon="ri-money-euro-circle-line" value={formatCurrency(totalRevRisk)} label="Revenue a Rischio" color="danger" />
        <StatCard icon="ri-arrow-up-circle-line" value={formatCurrency(totalDeltaRec)} label="Delta Revenue Potenziale" color="green" />
      </div>

      {data.length === 0 ? (
        <EmptyState icon="ri-checkbox-circle-line" message="Nessun contratto in scadenza entro 20 giorni. Tutto sotto controllo." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {data.map(c => (
            <Card key={c.contract_id}>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1rem', margin: 0 }}>{c.cliente}</h2>
                  <Badge variant={c.prodotto === 'Freader' ? 'purple' : 'warning'}>{c.prodotto}</Badge>
                  <Badge variant="danger">{c.giorni_scadenza}gg alla scadenza</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Confidenza</span>
                  <div style={{
                    width: '60px', height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${c.indice_confidenza}%`, height: '100%', borderRadius: '4px',
                      background: c.confidenza_label === 'alta' ? 'var(--color-success)' : c.confidenza_label === 'media' ? 'var(--color-warning)' : 'var(--color-danger)'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.indice_confidenza}</span>
                </div>
              </Card.Header>
              <Card.Body>
                {/* Current info */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>Canone attuale</span><br /><strong>{formatCurrency(c.canone_attuale)}/trim</strong></div>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>Scadenza</span><br /><strong>{c.scadenza}</strong></div>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>Revenue annuo a rischio</span><br /><strong style={{ color: 'var(--color-danger)' }}>{formatCurrency(c.revenue_a_rischio)}</strong></div>
                </div>

                {/* Pricing proposals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {c.proposte.map(p => {
                    // Raccomandata based on confidence: 0-30→conservativa, 30-70→raccomandata, 70+→aggressiva
                    const recFascia = c.indice_confidenza >= 70 ? 'aggressiva' : c.indice_confidenza >= 30 ? 'raccomandata' : 'conservativa';
                    const isRec = p.fascia === recFascia;
                    return (
                      <div key={p.fascia} style={{
                        border: `2px solid ${isRec ? 'var(--accent)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)', padding: '1rem',
                        background: isRec ? 'rgba(99,102,241,0.05)' : 'transparent',
                        position: 'relative'
                      }}>
                        {isRec && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>RACCOMANDATA</div>}
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>{p.fascia}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>+{p.percentuale}%</div>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{formatCurrency(p.nuovo_canone)}/trim</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', marginTop: '0.5rem' }}>+{formatCurrency(p.delta_revenue_annuo)}/anno</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ width: `${p.probabilita_accettazione}%`, height: '100%', background: p.probabilita_accettazione > 80 ? 'var(--color-success)' : p.probabilita_accettazione > 60 ? 'var(--color-warning)' : 'var(--color-danger)', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.probabilita_accettazione}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Motivations */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {c.motivazioni.map((m, i) => (
                    <span key={i} style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default RepricingView;
