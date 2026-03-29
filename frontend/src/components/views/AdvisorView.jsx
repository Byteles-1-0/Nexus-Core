// src/components/views/AdvisorView.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import Badge from '../common/Badge';

const AdvisorView = () => {
  const [advice, setAdvice] = useState([]);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
    try {
      const res = await api.getAiAdvice();
      if (res.ok) {
        const data = await res.json();
        setAdvice(data || []);
      }
    } catch (err) {
      console.error('Error loading advice:', err);
    }
  };

  return (
    <section className="view active">
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <i className="ri-brain-line" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-hover)' }}>Consigli Strategici AI</h2>
      </div>

      {advice.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {advice.map((a, idx) => (
            <div key={idx} style={{
              flex: '1 1 calc(50% - 0.5rem)',
              minWidth: '300px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <i className="ri-robot-2-fill" style={{ color: 'var(--accent)' }}></i>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.titolo}</span>
                </div>
                <Badge variant={a.priorita === 'alta' ? 'danger' : 'purple'}>
                  {a.categoria}
                </Badge>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{a.desc}</p>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                marginTop: 'auto'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '0.25rem' }}>Azione consigliata</span>
                {a.azione}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
          Nessun consiglio disponibile al momento.
        </p>
      )}
    </section>
  );
};

export default AdvisorView;
