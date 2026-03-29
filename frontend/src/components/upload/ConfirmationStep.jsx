// src/components/upload/ConfirmationStep.jsx
import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

const ConfirmationStep = ({ savedIds, onViewContracts, onUploadAnother }) => {
  const isBatch = Array.isArray(savedIds);
  
  return (
    <div className="step-content active">
      <Card>
        <Card.Body style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="success-animation">
            <i className="ri-checkbox-circle-line"></i>
          </div>
          <h2 style={{ marginTop: '1.5rem', color: 'var(--color-success)' }}>
            {isBatch ? `${savedIds.length} Contratti Salvati!` : 'Contratto Salvato!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {isBatch 
              ? `Tutti i ${savedIds.length} contratti registrati con successo.`
              : 'Il contratto è stato registrato con successo nel database.'
            }
          </p>
          <p style={{ color: 'var(--text-tertiary)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
            {isBatch ? (
              savedIds.map(id => (
                <code key={id} style={{ fontSize: '0.7rem', margin: '2px' }}>
                  {id.substring(0, 8)}...
                </code>
              ))
            ) : (
              <>ID: <code>{savedIds}</code></>
            )}
          </p>
          <div className="step-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
            <Button variant="ghost" onClick={onViewContracts}>
              <i className="ri-file-list-3-line"></i> Vai ai Contratti
            </Button>
            <Button variant="primary" onClick={onUploadAnother}>
              <i className="ri-add-line"></i> Carica Altro Contratto
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ConfirmationStep;
