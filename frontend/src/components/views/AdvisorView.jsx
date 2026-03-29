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
      <Card style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
        borderColor: 'rgba(99, 102, 241, 0.3)'
      }}>
        <Card.Header style={{ borderBottomColor: 'rgba(99, 102, 241, 0.2)' }}>
          <h2 style={{ color: 'var(--accent-hover)' }}>
            <i className="ri-brain-line"></i> Consigli Strategici AI
          </h2>
        </Card.Header>
        <Card.Body style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {advice.length > 0 ? (
            advice.map((a, idx) => (
              <div key={idx} className="advisor-card">
                <div className="adv-icon">
                  <i className="ri-robot-2-fill"></i>
                </div>
                <div className="adv-content">
                  <div className="adv-title">
                    {a.titolo}{' '}
                    <Badge variant={a.priorita === 'alta' ? 'danger' : 'purple'}>
                      {a.categoria}
                    </Badge>
                  </div>
                  <div className="adv-desc">{a.desc}</div>
                  <button className="adv-action">{a.azione}</button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>
              Nessun consiglio disponibile al momento.
            </p>
          )}
        </Card.Body>
      </Card>
    </section>
  );
};

export default AdvisorView;
