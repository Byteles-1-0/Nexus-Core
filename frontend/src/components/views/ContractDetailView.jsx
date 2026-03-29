// src/components/views/ContractDetailView.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import AddVersionModal from './AddVersionModal';
import { formatCurrency } from '../../utils/helpers';

const ContractDetailView = ({ contractId, onBack, onShowToast, onShowLoader, onHideLoader }) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDocument, setShowDocument] = useState(false);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [documentFilename, setDocumentFilename] = useState(null);

  useEffect(() => {
    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  const loadContract = async () => {
    setLoading(true);
    try {
      const res = await api.getContract(contractId);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setContract(data.data);
          setDocumentFilename(data.data.filename);
        }
      }
    } catch (err) {
      console.error('Error loading contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVersion = async (versionData) => {
    if (onShowLoader) onShowLoader('Creazione nuova versione...');
    
    try {
      const res = await api.addContractVersion(contractId, versionData);
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setShowAddVersion(false);
        if (onShowToast) onShowToast(`Versione ${data.new_version} creata!`, 'success');
        loadContract(); // Reload to show new version
      } else {
        if (onShowToast) onShowToast(data.message || 'Errore creazione versione', 'error');
      }
    } catch (err) {
      console.error('Error adding version:', err);
      if (onShowToast) onShowToast('Errore di rete', 'error');
    } finally {
      if (onHideLoader) onHideLoader();
    }
  };

  if (loading) {
    return (
      <section className="view active">
        <p>Caricamento...</p>
      </section>
    );
  }

  if (!contract) {
    return (
      <section className="view active">
        <p>Contratto non trovato.</p>
      </section>
    );
  }

  const history = contract.history || [];

  return (
    <section className="view active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Button variant="ghost" onClick={onBack}>
          <i className="ri-arrow-left-line"></i> Torna alla lista
        </Button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {documentFilename && (
            <Button variant="ghost" onClick={() => setShowDocument(!showDocument)}>
              <i className={showDocument ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
              {showDocument ? 'Nascondi' : 'Visualizza'} Documento
            </Button>
          )}
          <Button variant="primary" onClick={() => setShowAddVersion(true)}>
            <i className="ri-add-line"></i> Nuova Versione
          </Button>
        </div>
      </div>

      {showDocument && documentFilename && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <Card.Header>
            <h2><i className="ri-file-pdf-line"></i> Documento Originale</h2>
            <Button variant="ghost" onClick={() => setShowDocument(false)}>
              <i className="ri-close-line"></i>
            </Button>
          </Card.Header>
          <Card.Body>
            <iframe
              src={api.downloadFile(documentFilename)}
              style={{
                width: '100%',
                height: '600px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
              title="Contract Document"
            />
          </Card.Body>
        </Card>
      )}
      
      <Card>
        <Card.Header>
          <h2><i className="ri-file-info-line"></i> Dettaglio Contratto</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Badge variant={contract.prodotto === 'Freader' ? 'purple' : 'warning'}>
              {contract.prodotto}
            </Badge>
            {documentFilename && (
              <Badge variant="info">
                <i className="ri-file-line"></i> {documentFilename}
              </Badge>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="detail-header">
            <h3>{contract.cliente}</h3>
            {contract.sede && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                <i className="ri-map-pin-line"></i> {contract.sede}
              </p>
            )}
          </div>
          
          <div className="detail-meta">
            <div className="detail-meta-item">
              ID: <strong><code>{contract.id}</code></strong>
            </div>
            <div className="detail-meta-item">
              Prodotto: <strong>{contract.prodotto}</strong>
            </div>
          </div>

          <h4 style={{ margin: '0.75rem 0', fontSize: '0.95rem' }}>
            <i className="ri-time-line" style={{ color: 'var(--accent)' }}></i> Storico Versioni
          </h4>
          
          <div className="version-timeline">
            {history.length > 0 ? (
              history.map((v, idx) => {
                const details = contract.prodotto === 'Freader'
                  ? `Data firma: ${v.data_firma || 'N/A'} | Canone: ${formatCurrency(v.canone)}`
                  : `Piano: ${v.piano || 'N/A'} | Canone: ${formatCurrency(v.canone)}`;
                
                return (
                  <div key={idx} className="version-item">
                    <div className="version-number">Versione {v.version}</div>
                    <div className="version-details">
                      <span>{details}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-tertiary)' }}>Nessuna versione trovata.</p>
            )}
          </div>
        </Card.Body>
      </Card>

      {showAddVersion && (
        <AddVersionModal
          contract={contract}
          onClose={() => setShowAddVersion(false)}
          onSave={handleAddVersion}
        />
      )}
    </section>
  );
};

export default ContractDetailView;
