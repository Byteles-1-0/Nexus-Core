// src/components/upload/RiskComparisonStep.jsx
import React from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import Button from '../common/Button';
import StatCard from '../common/StatCard';

const RiskComparisonStep = ({ analysisResult, originalRisk, modifications, onBack, onSave, onShowToast }) => {
  if (!originalRisk) return null;

  const savedIds = new Set(
    Object.entries(modifications).filter(([_, m]) => m.saved).map(([id]) => id)
  );
  const savedCount = savedIds.size;

  // Recalculate risk score mirroring backend logic but reducing for resolved points
  const sla = analysisResult?.sla || {};
  const det = analysisResult?.dettagli_contratto || {};
  const prodotto = (analysisResult?.prodotto || '').toLowerCase();
  const comm = prodotto.includes('freader')
    ? analysisResult?.commerciale_freader || {}
    : analysisResult?.commerciale_cutai || {};
  const canone = comm.canone_trimestrale || comm.canone_base_trimestrale || 0;
  const tetto = sla.tetto_crediti || 0;
  const uptime = sla.credito_uptime || 0;
  const ticketing = sla.credito_ticketing || 0;
  const preavviso = det.preavviso_giorni || 30;
  const durata = det.durata_mesi || 12;

  // Base score (same as backend)
  let newScore = 15;
  
  // SLA risk — reduce if those points were fixed
  let slaRisk = 0;
  slaRisk += savedIds.has('pc_tetto') ? Math.min(15, tetto * 1.0) * 0.3 : Math.min(15, tetto * 1.0);
  slaRisk += savedIds.has('pc_uptime') ? Math.min(8, uptime * 1.2) * 0.3 : Math.min(8, uptime * 1.2);
  slaRisk += savedIds.has('pc_ticketing') ? Math.min(7, ticketing * 1.0) * 0.3 : Math.min(7, ticketing * 1.0);
  newScore += slaRisk;

  // Terms risk — reduce if those points were fixed
  let termsRisk = 0;
  if (preavviso < 30) termsRisk += savedIds.has('pc_preavviso_basso') ? 3 : 12;
  else if (preavviso < 60) termsRisk += 5;
  if (durata > 36) termsRisk += savedIds.has('pc_durata') ? 2 : 8;
  else if (durata > 24) termsRisk += 3;
  if (canone > 0 && canone < 3000) termsRisk += 5;
  newScore += termsRisk;

  // Remaining critical points bonus (only unresolved ones)
  const remainingPoints = (originalRisk.punti_critici || []).filter(p => !savedIds.has(p.id));
  const weights = { alta: 4, media: 2, bassa: 1 };
  const criticalBonus = remainingPoints.reduce((s, p) => s + (weights[p.gravita] || 1), 0);
  newScore += Math.min(20, criticalBonus);

  // No spelling errors after review
  // If all critical points resolved, risk is negligible
  if (remainingPoints.length === 0) {
    newScore = 0;
  }
  newScore = Math.min(95, Math.max(0, Math.round(newScore)));

  const origScore = originalRisk.risk_score || 0;
  const origCritical = originalRisk.punti_critici?.length || 0;
  const newCritical = remainingPoints.length;
  const origSpelling = originalRisk.errori_ortografici?.length || 0;

  const rows = [
    { label: 'Risk Score', before: origScore, after: newScore, unit: '%' },
    { label: 'Punti Critici', before: origCritical, after: newCritical, unit: '' },
    { label: 'Errori Ortografici', before: origSpelling, after: 0, unit: '' },
    { label: 'Modifiche Applicate', before: 0, after: savedCount, unit: '', positive: true },
  ];

  // Generate downloadable modified contract PDF via backend
  const handleDownload = async () => {
    try {
      const res = await api.downloadModifiedPdf(
        analysisResult,
        originalRisk,
        Object.fromEntries(
          Object.entries(modifications).filter(([_, m]) => m.saved)
        ),
        newScore
      );
      if (!res.ok) {
        onShowToast('Errore generazione PDF', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const clientName = (analysisResult?.anagrafica?.cliente_ragione_sociale || 'contratto').replace(/\s+/g, '_');
      a.download = `contratto_modificato_${clientName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      onShowToast('Errore download PDF', 'error');
    }
  };

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
        <i className="ri-bar-chart-grouped-line" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Confronto KPI <strong style={{ color: 'var(--text-primary)' }}>prima</strong> e <strong style={{ color: 'var(--text-primary)' }}>dopo</strong> le modifiche proposte.
        </p>
      </div>

      {/* Before/After KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon="ri-shield-check-line" value={`${origScore}%`} label="Risk Score — Prima" color={origScore < 30 ? 'green' : origScore < 60 ? 'orange' : 'danger'} />
        <StatCard icon="ri-shield-check-line" value={`${newScore}%`} label="Risk Score — Dopo" color={newScore < 30 ? 'green' : newScore < 60 ? 'orange' : 'danger'} />
      </div>

      {/* Comparison table */}
      <Card>
        <Card.Header>
          <h2 style={{ fontSize: '0.9rem' }}><i className="ri-bar-chart-grouped-line"></i> Confronto Dettagliato</h2>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>KPI</th><th>Prima</th><th>Dopo</th><th>Delta</th></tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const delta = row.after - row.before;
                const improved = row.positive ? delta > 0 : delta < 0;
                const worse = row.positive ? delta < 0 : delta > 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td>{row.before}{row.unit}</td>
                    <td style={{ fontWeight: 600 }}>{row.after}{row.unit}</td>
                    <td style={{
                      color: improved ? 'var(--color-success)' : worse ? 'var(--color-danger)' : 'var(--text-tertiary)',
                      fontWeight: 600
                    }}>
                      {delta > 0 ? '+' : ''}{delta}{row.unit}
                      {improved ? ' ✓' : worse ? ' ✗' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card.Body>
      </Card>

      {/* Resolved points */}
      {savedCount > 0 && (
        <Card style={{ marginTop: '1rem' }}>
          <Card.Header>
            <h2 style={{ fontSize: '0.9rem' }}><i className="ri-check-double-line" style={{ color: 'var(--color-success)' }}></i> Punti Critici Risolti</h2>
          </Card.Header>
          <Card.Body>
            {(originalRisk.punti_critici || []).filter(p => savedIds.has(p.id)).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <i className="ri-checkbox-circle-fill" style={{ color: 'var(--color-success)' }}></i>
                <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{p.sezione}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{p.valore_attuale} → modificato</span>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      <div className="step-actions" style={{ marginTop: '1.5rem' }}>
        <Button variant="ghost" onClick={onBack}>
          <i className="ri-arrow-left-line"></i> Torna ai Punti Critici
        </Button>
        <Button variant="primary" onClick={handleDownload}>
          <i className="ri-file-pdf-2-line"></i> Scarica PDF Modificato
        </Button>
        <Button variant="success" size="lg" onClick={onSave}>
          <i className="ri-save-3-line"></i> Salva Contratto
        </Button>
      </div>
    </div>
  );
};

export default RiskComparisonStep;
