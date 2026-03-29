// src/components/views/CostsView.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import StatCard from '../common/StatCard';
import Card from '../common/Card';
import DataTable from '../common/DataTable';
import Badge from '../common/Badge';

const CostsView = () => {
  const [selectedProd, setSelectedProd] = useState('totale');
  const [costsData, setCostsData] = useState(null);

  useEffect(() => {
    loadCosts(selectedProd);
  }, [selectedProd]);

  const loadCosts = async (prod) => {
    try {
      // Map frontend values to backend expected values
      const prodMap = {
        'totale': 'totale',
        'freader': 'prodotto1',
        'cutai': 'prodotto2'
      };
      const res = await api.getCosts(prodMap[prod] || prod);
      if (res.ok) {
        const data = await res.json();
        setCostsData(data);
      }
    } catch (err) {
      console.error('Error loading costs:', err);
    }
  };

  return (
    <section className="view active">
      <div className="segmented-control">
        <button
          className={`seg-btn ${selectedProd === 'totale' ? 'active' : ''}`}
          onClick={() => setSelectedProd('totale')}
        >
          Totale Portafoglio
        </button>
        <button
          className={`seg-btn ${selectedProd === 'freader' ? 'active' : ''}`}
          onClick={() => setSelectedProd('freader')}
        >
          Piattaforma Freader
        </button>
        <button
          className={`seg-btn ${selectedProd === 'cutai' ? 'active' : ''}`}
          onClick={() => setSelectedProd('cutai')}
        >
          Piattaforma CutAI
        </button>
      </div>

      <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
        {costsData ? (
          <>
            <StatCard
              icon="ri-building-line"
              value={`€ ${(costsData.tot_fissi / 1000).toFixed(0)}k`}
              label="Costi Fissi"
              color="blue"
            />
            <StatCard
              icon="ri-arrow-up-down-line"
              value={`€ ${(costsData.tot_variabili / 1000).toFixed(0)}k`}
              label="Costi Variabili"
              color="orange"
            />
            <StatCard
              icon="ri-pie-chart-line"
              value={`€ ${costsData.costo_unit_trad.toFixed(0)}`}
              label="Costo Medio / Contratto"
              color="green"
            />
          </>
        ) : (
          <p>Caricamento...</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <Card>
          <Card.Header>
            <h2><i className="ri-money-euro-box-line"></i> Costi Fissi</h2>
          </Card.Header>
          <Card.Body>
            {costsData?.fissi && costsData.fissi.length > 0 ? (
              <DataTable headers={['Voce', 'Tipo', 'Importo']}>
                {costsData.fissi.map((f, idx) => (
                  <tr key={idx}>
                    <td>{f.voce}</td>
                    <td><Badge variant="info">{f.tipo}</Badge></td>
                    <td><strong>€ {f.importo.toLocaleString('it-IT')}</strong></td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <p>Nessun costo fisso.</p>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h2><i className="ri-line-chart-line"></i> Costi Variabili</h2>
          </Card.Header>
          <Card.Body>
            {costsData?.variabili && costsData.variabili.length > 0 ? (
              <DataTable headers={['Voce', 'Tipo', 'Costo']}>
                {costsData.variabili.map((v, idx) => (
                  <tr key={idx}>
                    <td>{v.voce}</td>
                    <td><Badge variant="purple">{v.tipo}</Badge></td>
                    <td><strong>{v.unita || 'N/A'}</strong></td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <p>Nessun costo variabile.</p>
            )}
          </Card.Body>
        </Card>
      </div>
    </section>
  );
};

export default CostsView;
