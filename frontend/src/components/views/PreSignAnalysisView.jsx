// src/components/views/PreSignAnalysisView.jsx
import React, { useState } from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import DataTable from '../common/DataTable';

const PreSignAnalysisView = ({ contractData, onBack, onShowLoader, onHideLoader, onShowToast }) => {
  const [analysis, setAnalysis] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('soft');
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    onShowLoader('Analisi pre-firma in corso...');
    
    try {
      const res = await api.preSignAnalysis(contractData);
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setAnalysis(data.data);
        onShowToast('Analisi completata', 'success');
      } else {
        onShowToast(data.message || 'Errore durante l\'analisi', 'error');
      }
    } catch (err) {
      console.error('Error in pre-sign analysis:', err);
      onShowToast('Errore di connessione', 'error');
    } finally {
      setLoading(false);
      onHideLoader();
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 'alto') return 'var(--color-danger)';
    if (risk === 'medio') return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const getLevelColor = (level) => {
    if (level === 'soft') return 'var(--color-success)';
    if (level === 'media') return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <section className="view active">
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button variant="ghost" onClick={onBack}>
          <i className="ri-arrow-left-line"></i> Indietro
        </Button>
        <h1 style={{ margin: 0, flex: 1 }}>
          <i className="ri-shield-check-line"></i> Analisi Pre-Firma
        </h1>
        {!analysis && (
          <Button onClick={runAnalysis} disabled={loading}>
            <i className="ri-brain-line"></i> Avvia Analisi AI
          </Button>
        )}
      </div>

      {/* Contract Summary */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <h2><i className="ri-file-text-line"></i> Contratto in Analisi</h2>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Cliente</div>
              <div style={{ fontWeight: 600 }}>{contractData.cliente}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Prodotto</div>
              <Badge variant={contractData.prodotto === 'Freader' ? 'purple' : 'warning'}>
                {contractData.prodotto}
              </Badge>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Canone Trimestrale</div>
              <div style={{ fontWeight: 600 }}>€ {contractData.canone_trim?.toLocaleString('it-IT')}</div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {analysis && (
        <>
          {/* Risk Score */}
          <Card style={{ 
            marginBottom: '1.5rem',
            borderColor: analysis.risk_score > 70 ? 'var(--color-danger)' : analysis.risk_score > 40 ? 'var(--color-warning)' : 'var(--color-success)'
          }}>
            <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: `conic-gradient(${analysis.risk_score > 70 ? 'var(--color-danger)' : analysis.risk_score > 40 ? 'var(--color-warning)' : 'var(--color-success)'} ${analysis.risk_score * 3.6}deg, var(--bg-secondary) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}>
                  {analysis.risk_score}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Risk Score</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{analysis.summary}</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Comparison Table */}
          <Card style={{ marginBottom: '1.5rem' }}>
            <Card.Header>
              <h2><i className="ri-bar-chart-box-line"></i> Confronto con Storico</h2>
            </Card.Header>
            <Card.Body>
              <DataTable headers={['Metrica', 'Valore Attuale', 'Media Storica', 'Deviazione', 'Rischio']}>
                {analysis.comparison.map((comp, idx) => (
                  <tr key={idx}>
                    <td><strong>{comp.metric}</strong></td>
                    <td>{comp.current}</td>
                    <td>{comp.historical_avg}</td>
                    <td style={{ color: comp.deviation.startsWith('+') ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {comp.deviation}
                    </td>
                    <td>
                      <Badge 
                        variant={comp.risk === 'alto' ? 'danger' : comp.risk === 'medio' ? 'warning' : 'success'}
                      >
                        {comp.risk}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </Card.Body>
          </Card>

          {/* Modification Levels */}
          <Card>
            <Card.Header>
              <h2><i className="ri-edit-box-line"></i> Modifiche Suggerite</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                  variant={selectedLevel === 'soft' ? 'primary' : 'ghost'}
                  onClick={() => setSelectedLevel('soft')}
                  style={{ borderColor: getLevelColor('soft') }}
                >
                  Soft
                </Button>
                <Button 
                  variant={selectedLevel === 'media' ? 'primary' : 'ghost'}
                  onClick={() => setSelectedLevel('media')}
                  style={{ borderColor: getLevelColor('media') }}
                >
                  Media
                </Button>
                <Button 
                  variant={selectedLevel === 'strong' ? 'primary' : 'ghost'}
                  onClick={() => setSelectedLevel('strong')}
                  style={{ borderColor: getLevelColor('strong') }}
                >
                  Strong
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analysis[selectedLevel]?.map((mod, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '1.5rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${getLevelColor(selectedLevel)}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0 }}>
                        <i className="ri-file-edit-line"></i> {mod.clause}
                      </h3>
                      <Badge variant={selectedLevel === 'soft' ? 'success' : selectedLevel === 'media' ? 'warning' : 'danger'}>
                        {selectedLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Valore Attuale</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-danger)' }}>
                          {mod.current}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Valore Suggerito</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-success)' }}>
                          {mod.suggested}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <i className="ri-money-euro-circle-line"></i> Impatto
                      </div>
                      <div style={{ color: 'var(--color-success)' }}>{mod.impact}</div>
                    </div>
                    
                    <div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <i className="ri-lightbulb-line"></i> Motivazione
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{mod.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {!analysis && !loading && (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem' }}>
            <i className="ri-shield-check-line" style={{ fontSize: '4rem', color: 'var(--accent)', opacity: 0.5 }}></i>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Analisi Pre-Firma</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Confronta questo contratto con lo storico aziendale per identificare clausole rischiose
            </p>
            <Button onClick={runAnalysis}>
              <i className="ri-brain-line"></i> Avvia Analisi AI
            </Button>
          </Card.Body>
        </Card>
      )}
    </section>
  );
};

export default PreSignAnalysisView;
