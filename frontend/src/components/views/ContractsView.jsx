// src/components/views/ContractsView.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import StatCard from '../common/StatCard';
import Card from '../common/Card';
import DataTable from '../common/DataTable';
import SearchBox from '../common/SearchBox';
import Badge from '../common/Badge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import ItalyMap from '../common/ItalyMap';
import { escapeHtml } from '../../utils/helpers';

const ContractsView = ({ contracts, onRefresh, onContractClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    try {
      const res = await api.getAnomalies();
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data || []);
      }
    } catch (err) {
      console.error('Error loading anomalies:', err);
    }
  };

  const filteredContracts = contracts.filter(c =>
    c.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prodotto.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;

  return (
    <section className="view active">
      <div className="stats-grid">
        <StatCard
          icon="ri-folder-shield-2-line"
          value={contracts.length}
          label="Contratti Totali"
          color="blue"
        />
        <StatCard
          icon="ri-checkbox-circle-line"
          value={activeContracts}
          label="Attivi"
          color="green"
        />
        <StatCard
          icon="ri-error-warning-line"
          value={anomalies.length}
          label="Anomalie"
          color="danger"
        />
      </div>

      {anomalies.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Card style={{ borderColor: 'var(--color-danger)', background: 'var(--color-danger-bg)' }}>
            <Card.Header style={{ borderBottom: 'none' }}>
              <h2 style={{ color: 'var(--color-danger)' }}>
                <i className="ri-alarm-warning-fill"></i> {anomalies.length} anomalie
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="anomalies-list">
                {anomalies.map((a, idx) => (
                  <div key={idx} className={`anomaly-item hs-${a.gravita}`}>
                    <i
                      className={a.gravita === 'alta' ? 'ri-close-circle-line' : 'ri-error-warning-line'}
                      style={{ fontSize: '1.5rem', color: 'var(--color-danger)' }}
                    ></i>
                    <div style={{ flex: 1 }}>
                      <div className="a-title">
                        {a.tipo.toUpperCase().replace('_', ' ')}: {a.cliente}
                      </div>
                      <div className="a-desc">{a.desc}</div>
                    </div>
                    <div className="a-client">{a.prodotto}</div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <Card>
          <Card.Header>
            <h2><i className="ri-file-list-3-line"></i> Tutti i Contratti</h2>
            <div className="card-header-actions">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cerca cliente..."
              />
              <Button variant="ghost" onClick={onRefresh}>
                <i className="ri-refresh-line"></i>
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {filteredContracts.length > 0 ? (
              <DataTable headers={['Cliente', 'Prodotto', 'Stato', 'Ver.', 'ID']}>
                {filteredContracts.map((c) => (
                  <tr key={c.id} onClick={() => onContractClick(c.id)}>
                    <td>{escapeHtml(c.cliente)}</td>
                    <td>
                      <Badge variant={c.prodotto === 'Freader' ? 'purple' : 'warning'}>
                        {c.prodotto}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'info'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td>{c.versioni}</td>
                    <td>
                      <code style={{ fontSize: '0.7rem' }}>{c.id.substring(0, 8)}...</code>
                    </td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptyState message="Nessun contratto trovato" />
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h2><i className="ri-map-pin-line"></i> Distribuzione Geografica</h2>
          </Card.Header>
          <Card.Body style={{ padding: '1rem' }}>
            <ItalyMap />
          </Card.Body>
        </Card>
      </div>
    </section>
  );
};

export default ContractsView;
