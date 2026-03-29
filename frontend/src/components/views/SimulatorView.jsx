// src/components/views/SimulatorView.jsx
import React, { useState } from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatCard from '../common/StatCard';

const SimulatorView = () => {
  const [scenarioType, setScenarioType] = useState('increase_cutai_pct');
  const [targetPct, setTargetPct] = useState(40);
  const [numClients, setNumClients] = useState(5);
  const [product, setProduct] = useState('CutAI');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    
    const params = scenarioType === 'increase_cutai_pct' 
      ? { target_pct: targetPct }
      : { num_clients: numClients, product: product };
    
    try {
      const res = await fetch('http://localhost:5001/api/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'tenant-test-123'
        },
        body: JSON.stringify({
          type: scenarioType,
          params: params
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setResult(data.scenario);
      }
    } catch (err) {
      console.error('Error running simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (val) => {
    if (Math.abs(val) >= 1000) {
      return `€${(val / 1000).toFixed(0)}k`;
    }
    return `€${val.toFixed(0)}`;
  };

  const getDeltaColor = (val) => {
    if (val > 0) return 'var(--color-success)';
    if (val < 0) return 'var(--color-danger)';
    return 'var(--text-secondary)';
  };

  return (
    <section className="view active">
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <h2><i className="ri-flask-line"></i> Simulatore Scenari</h2>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Scenario Type Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Tipo Scenario
              </label>
              <select 
                value={scenarioType}
                onChange={(e) => setScenarioType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              >
                <option value="increase_cutai_pct">Aumenta % CutAI</option>
                <option value="add_clients">Aggiungi Clienti</option>
              </select>
            </div>

            {/* Parameters */}
            {scenarioType === 'increase_cutai_pct' ? (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Target % CutAI
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={targetPct}
                  onChange={(e) => setTargetPct(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Prodotto
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="CutAI">CutAI</option>
                    <option value="Freader">Freader</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Numero Clienti
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numClients}
                    onChange={(e) => setNumClients(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <Button 
            onClick={runSimulation} 
            disabled={loading}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            <i className="ri-play-line"></i> {loading ? 'Simulazione...' : 'Esegui Simulazione'}
          </Button>
        </Card.Body>
      </Card>

      {result && (
        <>
          {/* Hero Insight */}
          <Card style={{ 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
            borderColor: 'rgba(99, 102, 241, 0.3)'
          }}>
            <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <i className="ri-lightbulb-flash-line" style={{ fontSize: '3rem', color: 'var(--accent)' }}></i>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--accent)' }}>
                    {result.description}
                  </h3>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>
                    Revenue: <strong style={{ color: 'var(--color-success)' }}>
                      +{formatValue(result.delta.revenue)}
                    </strong> | 
                    Margine: <strong style={{ color: getDeltaColor(result.delta.margin) }}>
                      {result.delta.margin > 0 ? '+' : ''}{formatValue(result.delta.margin)}
                    </strong> | 
                    Timeline: <strong>{result.delta.months_estimate} mesi</strong>
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Comparison Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Card>
              <Card.Header>
                <h2><i className="ri-bar-chart-line"></i> Situazione Attuale</h2>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="sim-metric">
                    <span>Fatturato Totale</span>
                    <strong>{formatValue(result.current.total_revenue)}</strong>
                  </div>
                  <div className="sim-metric">
                    <span>Freader</span>
                    <strong>{formatValue(result.current.freader_revenue)}</strong>
                  </div>
                  <div className="sim-metric">
                    <span>CutAI</span>
                    <strong>{formatValue(result.current.cutai_revenue)} ({result.current.cutai_pct}%)</strong>
                  </div>
                  <div className="sim-metric">
                    <span>Margine</span>
                    <strong style={{ color: getDeltaColor(result.current.margin) }}>
                      {formatValue(result.current.margin)} ({result.current.margin_pct}%)
                    </strong>
                  </div>
                  <div className="sim-metric">
                    <span>Contratti</span>
                    <strong>{result.current.contracts}</strong>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2><i className="ri-line-chart-line"></i> Scenario Simulato</h2>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="sim-metric">
                    <span>Fatturato Totale</span>
                    <strong style={{ color: 'var(--color-success)' }}>
                      {formatValue(result.simulated.total_revenue)}
                      <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--color-success)' }}>
                        (+{result.delta.revenue_pct}%)
                      </span>
                    </strong>
                  </div>
                  <div className="sim-metric">
                    <span>Freader</span>
                    <strong>{formatValue(result.simulated.freader_revenue)}</strong>
                  </div>
                  <div className="sim-metric">
                    <span>CutAI</span>
                    <strong style={{ color: 'var(--color-success)' }}>
                      {formatValue(result.simulated.cutai_revenue)} ({result.simulated.cutai_pct}%)
                    </strong>
                  </div>
                  <div className="sim-metric">
                    <span>Margine</span>
                    <strong style={{ color: getDeltaColor(result.simulated.margin) }}>
                      {formatValue(result.simulated.margin)} ({result.simulated.margin_pct}%)
                      <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: getDeltaColor(result.delta.margin_pct) }}>
                        ({result.delta.margin_pct > 0 ? '+' : ''}{result.delta.margin_pct}pp)
                      </span>
                    </strong>
                  </div>
                  <div className="sim-metric">
                    <span>Contratti</span>
                    <strong style={{ color: 'var(--color-success)' }}>
                      {result.simulated.contracts}
                      <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                        (+{result.simulated.contracts - result.current.contracts})
                      </span>
                    </strong>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <Card.Header>
              <h2><i className="ri-task-line"></i> Azioni Consigliate</h2>
            </Card.Header>
            <Card.Body>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.actions.map((action, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '3px solid var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <i className="ri-checkbox-circle-line" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {!result && (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem' }}>
            <i className="ri-flask-line" style={{ fontSize: '4rem', color: 'var(--accent)', opacity: 0.5 }}></i>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Simulatore Scenari</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Configura i parametri sopra e clicca "Esegui Simulazione" per vedere l'impatto
            </p>
          </Card.Body>
        </Card>
      )}
    </section>
  );
};

export default SimulatorView;
