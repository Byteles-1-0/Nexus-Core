// src/components/views/AddVersionModal.jsx
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

const AddVersionModal = ({ contract, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    change_reason: '',
    data_firma: '',
    durata_mesi: '',
    preavviso_giorni: '',
    canone_trimestrale: '',
    prezzo_fascia_1: '',
    prezzo_fascia_2: '',
    prezzo_fascia_3: '',
    profilo_commerciale: '',
    soglia_utenti_inclusi: '',
    fee_utente_extra: '',
    credito_uptime: '',
    credito_ticketing: '',
    tetto_crediti: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const isFreader = contract?.prodotto === 'Freader';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <Card>
          <Card.Header>
            <h2><i className="ri-add-circle-line"></i> Nuova Versione Contratto</h2>
            <Button variant="ghost" onClick={onClose}>
              <i className="ri-close-line"></i>
            </Button>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  Motivo Modifica
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="es. Rinegoziazione, Rinnovo, Modifica SLA"
                  value={formData.change_reason}
                  onChange={(e) => handleChange('change_reason', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Data Firma
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.data_firma}
                    onChange={(e) => handleChange('data_firma', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Durata (mesi)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.durata_mesi}
                    onChange={(e) => handleChange('durata_mesi', e.target.value)}
                  />
                </div>
              </div>

              {isFreader ? (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      Canone Trimestrale (€)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.canone_trimestrale}
                      onChange={(e) => handleChange('canone_trimestrale', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Fascia 1 (cent)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={formData.prezzo_fascia_1}
                        onChange={(e) => handleChange('prezzo_fascia_1', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Fascia 2 (cent)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={formData.prezzo_fascia_2}
                        onChange={(e) => handleChange('prezzo_fascia_2', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Fascia 3 (cent)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={formData.prezzo_fascia_3}
                        onChange={(e) => handleChange('prezzo_fascia_3', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Profilo Commerciale
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="es. Standard, Premium"
                        value={formData.profilo_commerciale}
                        onChange={(e) => handleChange('profilo_commerciale', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Canone Base Trimestrale (€)
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.canone_trimestrale}
                        onChange={(e) => handleChange('canone_trimestrale', e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Utenti Inclusi
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.soglia_utenti_inclusi}
                        onChange={(e) => handleChange('soglia_utenti_inclusi', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Fee Utente Extra (€)
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.fee_utente_extra}
                        onChange={(e) => handleChange('fee_utente_extra', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Credito Uptime (%)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.credito_uptime}
                    onChange={(e) => handleChange('credito_uptime', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Credito Ticketing (%)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.credito_ticketing}
                    onChange={(e) => handleChange('credito_ticketing', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Tetto Crediti (%)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.tetto_crediti}
                    onChange={(e) => handleChange('tetto_crediti', e.target.value)}
                  />
                </div>
              </div>

              <div className="step-actions" style={{ marginTop: '1rem' }}>
                <Button variant="ghost" onClick={onClose}>
                  Annulla
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  <i className="ri-save-line"></i> Salva Nuova Versione
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default AddVersionModal;
