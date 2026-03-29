// src/components/upload/AnalysisStep.jsx
import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency, escapeHtml } from '../../utils/helpers';

const AnalysisStep = ({ 
  analysisResult, 
  batchResults, 
  onBack, 
  onSave, 
  onSaveAll,
  onPreSignAnalysis
}) => {
  const buildSection = (title, icon, fields) => {
    return (
      <div className="analysis-section">
        <div className="analysis-section-title">
          <i className={icon}></i> {title}
        </div>
        {Object.entries(fields).map(([label, value]) => (
          <div key={label} className="analysis-field">
            <span className="analysis-field-label">{label}</span>
            <span className="analysis-field-value">{value ?? 'N/A'}</span>
          </div>
        ))}
      </div>
    );
  };

  // Single file analysis
  if (analysisResult && !batchResults.length) {
    const prodotto = analysisResult.prodotto || 'N/A';
    const ana = analysisResult.anagrafica || {};
    const det = analysisResult.dettagli_contratto || {};
    const sla = analysisResult.sla || {};

    return (
      <div className="step-content active">
        <Card>
          <Card.Header>
            <h2><i className="ri-robot-2-line"></i> Risultato Analisi AI</h2>
            <Badge variant={prodotto === 'Freader' ? 'purple' : 'warning'}>
              {prodotto}
            </Badge>
          </Card.Header>
          <Card.Body>
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.08)', 
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <i className="ri-information-line" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Verifica i dati estratti dall'AI. Se corretti, clicca <strong style={{ color: 'var(--text-primary)' }}>Conferma e Salva</strong> per registrare il contratto nel database.
              </p>
            </div>
            
            <div className="analysis-grid">
              {buildSection('Anagrafica', 'ri-building-2-line', {
                'Ragione Sociale': ana.cliente_ragione_sociale,
                'Sede Legale': ana.cliente_sede_legale
              })}
              
              {buildSection('Dettagli Contratto', 'ri-calendar-line', {
                'Data Firma': det.data_firma,
                'Durata': det.durata_mesi ? `${det.durata_mesi} mesi` : 'N/A',
                'Preavviso': det.preavviso_giorni ? `${det.preavviso_giorni} giorni` : 'N/A'
              })}

              {prodotto.toLowerCase().includes('freader') ? (
                buildSection('Commerciale Freader', 'ri-money-euro-circle-line', {
                  'Canone Trimestrale': formatCurrency(analysisResult.commerciale_freader?.canone_trimestrale),
                  'Fascia 1': analysisResult.commerciale_freader?.prezzo_fascia_1 != null 
                    ? `${analysisResult.commerciale_freader.prezzo_fascia_1} cent` : 'N/A',
                  'Fascia 2': analysisResult.commerciale_freader?.prezzo_fascia_2 != null 
                    ? `${analysisResult.commerciale_freader.prezzo_fascia_2} cent` : 'N/A',
                  'Fascia 3': analysisResult.commerciale_freader?.prezzo_fascia_3 != null 
                    ? `${analysisResult.commerciale_freader.prezzo_fascia_3} cent` : 'N/A'
                })
              ) : (
                buildSection('Commerciale CutAI', 'ri-money-euro-circle-line', {
                  'Profilo': analysisResult.commerciale_cutai?.profilo_commerciale,
                  'Canone Trimestrale': formatCurrency(analysisResult.commerciale_cutai?.canone_base_trimestrale),
                  'Utenti Inclusi': analysisResult.commerciale_cutai?.soglia_utenti_inclusi,
                  'Fee Extra': formatCurrency(analysisResult.commerciale_cutai?.fee_utente_extra)
                })
              )}

              {buildSection('SLA', 'ri-shield-check-line', {
                'Credito Uptime': sla.credito_uptime ? `${sla.credito_uptime}%` : 'N/A',
                'Credito Ticketing': sla.credito_ticketing ? `${sla.credito_ticketing}%` : 'N/A',
                'Tetto Crediti': sla.tetto_crediti ? `${sla.tetto_crediti}%` : 'N/A'
              })}
            </div>
            
            <div className="step-actions">
              <Button variant="ghost" onClick={onBack}>
                <i className="ri-arrow-left-line"></i> Indietro
              </Button>
              {onPreSignAnalysis && (
                <Button variant="primary" onClick={onPreSignAnalysis}>
                  <i className="ri-shield-check-line"></i> Analisi Pre-Firma
                </Button>
              )}
              <Button variant="success" size="lg" onClick={onSave}>
                <i className="ri-save-3-line"></i> Conferma e Salva
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Batch analysis
  return (
    <div className="step-content active">
      <div style={{ 
        background: 'rgba(99, 102, 241, 0.08)', 
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <i className="ri-information-line" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Verifica i <strong style={{ color: 'var(--text-primary)' }}>{batchResults.length} contratti</strong> analizzati. Se corretti, clicca <strong style={{ color: 'var(--text-primary)' }}>Conferma e Salva Tutti</strong>.
        </p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {batchResults.map((result, idx) => {
          const a = result.analysis || {};
          const prodotto = a.prodotto || 'N/A';
          const ana = a.anagrafica || {};
          const det = a.dettagli_contratto || {};
          
          return (
            <Card key={idx}>
              <Card.Header>
                <h2 style={{ fontSize: '0.9rem' }}>
                  <i className="ri-file-text-line"></i> {escapeHtml(result.filename)}
                </h2>
                <Badge variant={prodotto === 'Freader' ? 'purple' : 'warning'}>
                  {prodotto}
                </Badge>
              </Card.Header>
              <Card.Body style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '1rem', 
                fontSize: '0.85rem' 
              }}>
                <div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    color: 'var(--text-tertiary)', 
                    marginBottom: '4px' 
                  }}>
                    Anagrafica
                  </div>
                  <strong>{escapeHtml(ana.cliente_ragione_sociale || 'N/A')}</strong>
                  <br />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {escapeHtml(ana.cliente_sede_legale || 'N/A')}
                  </span>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    color: 'var(--text-tertiary)', 
                    marginBottom: '4px' 
                  }}>
                    Contratto
                  </div>
                  Firma: {det.data_firma || '-'}<br />
                  Durata: {det.durata_mesi || '-'} mesi
                </div>
                <div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    color: 'var(--text-tertiary)', 
                    marginBottom: '4px' 
                  }}>
                    Commerciale
                  </div>
                  {prodotto.toLowerCase().includes('freader') ? (
                    <span>Canone: <strong>{formatCurrency(a.commerciale_freader?.canone_trimestrale)}</strong>/trim</span>
                  ) : (
                    <>
                      <span>Profilo: <strong>{a.commerciale_cutai?.profilo_commerciale || '-'}</strong></span>
                      <br />
                      <span>Canone: <strong>{formatCurrency(a.commerciale_cutai?.canone_base_trimestrale)}</strong>/trim</span>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
      
      <div className="step-actions" style={{ marginTop: '1.5rem' }}>
        <Button variant="ghost" onClick={onBack}>
          <i className="ri-arrow-left-line"></i> Indietro
        </Button>
        <Button variant="success" size="lg" onClick={onSaveAll}>
          <i className="ri-save-3-line"></i> Conferma e Salva Tutti
        </Button>
      </div>
    </div>
  );
};

export default AnalysisStep;
