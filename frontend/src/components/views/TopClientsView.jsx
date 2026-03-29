// src/components/views/TopClientsView.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import Card from '../common/Card';
import DataTable from '../common/DataTable';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';

const TopClientsView = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadTopClients();
  }, []);

  const loadTopClients = async () => {
    try {
      const res = await api.getTopClients();
      if (res.ok) {
        const data = await res.json();
        setClients(data || []);
      }
    } catch (err) {
      console.error('Error loading top clients:', err);
    }
  };

  return (
    <section className="view active">
      <Card>
        <Card.Header>
          <h2><i className="ri-medal-line"></i> Classifica Portfolio Clienti</h2>
        </Card.Header>
        <Card.Body>
          {clients.length > 0 ? (
            <DataTable headers={['Rank', 'Cliente', 'Score', 'Prodotto', 'Canone']}>
              {clients.map((c) => (
                <tr key={c.index}>
                  <td>#{c.index + 1}</td>
                  <td><strong>{c.cliente}</strong></td>
                  <td>
                    <span className="rank-score">{c.rating}/100</span>
                  </td>
                  <td>
                    <Badge variant={c.rating > 90 ? 'success' : 'info'}>
                      {c.prodotto}
                    </Badge>
                  </td>
                  <td>€ {c.canone_trim}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState message="Nessun cliente. Carica contratti per vedere la classifica." />
          )}
        </Card.Body>
      </Card>
    </section>
  );
};

export default TopClientsView;
