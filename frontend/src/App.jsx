// src/App.jsx
import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import { useToast } from './hooks/useToast';

// Layout
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Common
import LoadingOverlay from './components/common/LoadingOverlay';
import ToastContainer from './components/common/ToastContainer';

// Welcome
import WelcomePage from './components/welcome/WelcomePage';

// Views
import OverviewView from './components/views/OverviewView';
import CostsView from './components/views/CostsView';
import UploadView from './components/upload/UploadView';
import ContractsView from './components/views/ContractsView';
import RadarView from './components/views/RadarView';
import TopClientsView from './components/views/TopClientsView';
import AdvisorView from './components/views/AdvisorView';
import ContractDetailView from './components/views/ContractDetailView';
import SimulatorView from './components/views/SimulatorView';

function App() {
  // State
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentView, setCurrentView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('Elaborazione in corso...');
  const [contracts, setContracts] = useState([]);
  const [tenantName, setTenantName] = useState('Acme Corp SaaS');
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [initialAnalysis, setInitialAnalysis] = useState(null);

  const { toasts, showToast, removeToast } = useToast();

  const handleResetInitialAnalysis = () => {
    setInitialAnalysis(null);
  };

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const res = await api.checkHealth();
      if (res.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch {
      setApiStatus('offline');
    }
  };

  const loadContracts = async () => {
    try {
      const res = await api.listContracts();
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setContracts(data.data || []);
      }
    } catch (err) {
      console.error('Error loading contracts:', err);
    }
  };

  const handleWelcomeComplete = (data) => {
    setShowWelcome(false);
    
    if (data.batchResults && data.batchResults.length > 0) {
      setTenantName(`${data.batchResults.length} contratti`);
      setInitialAnalysis({ type: 'batch', data: data.batchResults });
    } else if (data.analysisResult) {
      const companyName = data.analysisResult?.anagrafica?.cliente_ragione_sociale || 'Cliente';
      setTenantName(companyName);
      setInitialAnalysis({ type: 'single', data: data.analysisResult });
    }
    
    setCurrentView('overview');
    loadContracts();
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedContractId(null);
    setSidebarOpen(false);
  };

  const handleContractClick = (contractId) => {
    setSelectedContractId(contractId);
    setCurrentView('detail');
  };

  const showLoader = (text) => {
    setLoaderText(text);
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
  };

  const viewTitles = {
    overview: 'Overview',
    costs: 'Reparto Costi',
    upload: 'Carica Contratto',
    contracts: 'Contratti',
    radar: 'Risk Radar',
    topclients: 'Top Clients',
    advisor: 'AI Advisor',
    simulator: 'Simulatore Scenari',
    detail: 'Dettaglio Contratto'
  };

  return (
    <>
      {/* Welcome Page */}
      <WelcomePage
        isActive={showWelcome}
        onComplete={handleWelcomeComplete}
      />

      {/* App Shell */}
      {!showWelcome && (
        <div className="app-shell active">
          <Sidebar
            activeView={currentView}
            onViewChange={handleViewChange}
            tenantName={tenantName}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="main-content">
            <Topbar
              title={viewTitles[currentView] || 'FOCO'}
              apiStatus={apiStatus}
              onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Views */}
            {currentView === 'overview' && (
              <OverviewView
                contracts={contracts}
                onRefresh={loadContracts}
                onViewChange={handleViewChange}
              />
            )}

            {currentView === 'costs' && <CostsView />}

            {currentView === 'upload' && (
              <UploadView
                onViewChange={handleViewChange}
                onShowLoader={showLoader}
                onHideLoader={hideLoader}
                onShowToast={showToast}
                onContractsUpdated={loadContracts}
                initialAnalysis={initialAnalysis}
                onResetInitialAnalysis={handleResetInitialAnalysis}
              />
            )}

            {currentView === 'contracts' && (
              <ContractsView
                contracts={contracts}
                onRefresh={loadContracts}
                onContractClick={handleContractClick}
              />
            )}

            {currentView === 'radar' && <RadarView />}

            {currentView === 'topclients' && <TopClientsView />}

            {currentView === 'advisor' && <AdvisorView />}

            {currentView === 'simulator' && <SimulatorView />}

            {currentView === 'detail' && (
              <ContractDetailView
                contractId={selectedContractId}
                onBack={() => handleViewChange('contracts')}
                onShowToast={showToast}
                onShowLoader={showLoader}
                onHideLoader={hideLoader}
              />
            )}
          </main>
        </div>
      )}

      {/* Global Components */}
      <LoadingOverlay isVisible={loading} text={loaderText} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
