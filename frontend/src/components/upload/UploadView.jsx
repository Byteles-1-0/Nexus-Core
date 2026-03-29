// src/components/upload/UploadView.jsx
import React, { useState } from 'react';
import { api } from '../../utils/api';
import PipelineSteps from './PipelineSteps';
import UploadStep from './UploadStep';
import AnalysisStep from './AnalysisStep';
import ConfirmationStep from './ConfirmationStep';
import PreSignAnalysisView from '../views/PreSignAnalysisView';

const UploadView = ({ onViewChange, onShowLoader, onHideLoader, onShowToast, onContractsUpdated, initialAnalysis, onResetInitialAnalysis }) => {
  const [currentStep, setCurrentStep] = useState(initialAnalysis ? 2 : 1);
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(initialAnalysis?.type === 'single' ? initialAnalysis.data : null);
  const [batchResults, setBatchResults] = useState(initialAnalysis?.type === 'batch' ? initialAnalysis.data : []);
  const [savedIds, setSavedIds] = useState(null);
  const [currentFilename, setCurrentFilename] = useState(null);
  const [showPreSign, setShowPreSign] = useState(false);

  // Reset initial analysis after first render
  React.useEffect(() => {
    if (initialAnalysis) {
      onResetInitialAnalysis();
    }
  }, []);

  const handleFilesSelect = (selectedFiles) => {
    const allowed = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
    const valid = selectedFiles.filter(f => 
      allowed.includes(f.name.split('.').pop().toLowerCase())
    );
    
    if (valid.length === 0) {
      onShowToast('Nessun formato supportato.', 'error');
      return;
    }
    
    setFiles(valid);
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, idx) => idx !== index);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (!files.length) return;

    if (files.length > 1) {
      onShowLoader(`Caricamento e analisi di ${files.length} file...`);
      try {
        const res = await api.uploadAndAnalyzeBatch(files);
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
          setBatchResults(data.data || []);
          setCurrentStep(2);
          onShowToast(`${data.data.length} contratti analizzati!`, 'success');
        } else {
          onShowToast(data.message || 'Errore batch upload', 'error');
        }
      } catch (err) {
        onShowToast('Impossibile contattare il server.', 'error');
      } finally {
        onHideLoader();
      }
      return;
    }

    // Single file: upload + analyze in one step
    onShowLoader(`Caricamento e analisi ${files[0].name}...`);
    try {
      const uploadRes = await api.uploadFile(files[0]);
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok || uploadData.status !== 'success') {
        onShowToast(uploadData.message || 'Errore upload', 'error');
        onHideLoader();
        return;
      }

      const extractedText = uploadData.data.extracted_text;
      const filename = uploadData.data.filename;
      setCurrentFilename(filename);
      
      // Analyze immediately
      const analyzeRes = await api.analyzeText(extractedText);
      const analyzeData = await analyzeRes.json();
      
      if (analyzeRes.ok && analyzeData.status === 'success') {
        setAnalysisResult(analyzeData.data);
        setCurrentStep(2);
        onShowToast('Analisi completata!', 'success');
      } else {
        onShowToast(analyzeData.message || 'Errore analisi', 'error');
      }
    } catch (err) {
      onShowToast('Impossibile contattare il server.', 'error');
    } finally {
      onHideLoader();
    }
  };

  const handleSave = async () => {
    if (!analysisResult) return;

    onShowLoader('Salvataggio contratto...');
    try {
      const res = await api.saveContract(analysisResult, currentFilename);
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setSavedIds(data.contract_id);
        setCurrentStep(3);
        onShowToast('Contratto salvato!', 'success');
        onContractsUpdated();
      } else {
        onShowToast(data.message || 'Errore', 'error');
      }
    } catch (err) {
      onShowToast('Errore di rete.', 'error');
    } finally {
      onHideLoader();
    }
  };

  const handleSaveAll = async () => {
    if (!batchResults.length) return;

    onShowLoader(`Salvataggio di ${batchResults.length} contratti...`);
    const savedIdsList = [];
    
    for (const r of batchResults) {
      try {
        const res = await api.saveContract(r.analysis, r.filename);
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
          savedIdsList.push(data.contract_id);
        }
      } catch (err) {
        console.error('Error saving contract:', err);
      }
    }
    
    onHideLoader();
    
    if (savedIdsList.length > 0) {
      setSavedIds(savedIdsList);
      setCurrentStep(3);
      onShowToast(`${savedIdsList.length} contratti salvati!`, 'success');
      onContractsUpdated();
    } else {
      onShowToast('Errore nel salvataggio.', 'error');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFiles([]);
    setAnalysisResult(null);
    setBatchResults([]);
    setSavedIds(null);
    setCurrentFilename(null);
    setShowPreSign(false);
  };

  const handlePreSignAnalysis = () => {
    setShowPreSign(true);
  };

  const handleBackFromPreSign = () => {
    setShowPreSign(false);
  };

  // Prepare contract data for pre-sign analysis
  const getContractDataForPreSign = () => {
    if (!analysisResult) return null;
    
    const prodotto = analysisResult.prodotto;
    const ana = analysisResult.anagrafica || {};
    const det = analysisResult.dettagli_contratto || {};
    const sla = analysisResult.sla || {};
    
    if (prodotto === 'Freader') {
      const comm = analysisResult.commerciale_freader || {};
      return {
        prodotto: 'Freader',
        cliente: ana.cliente_ragione_sociale,
        canone_trim: comm.canone_trimestrale,
        durata_mesi: det.durata_mesi,
        preavviso_gg: det.preavviso_giorni,
        tetto_cred: sla.tetto_crediti,
        credito_uptime: sla.credito_uptime,
        credito_ticketing: sla.credito_ticketing
      };
    } else {
      const comm = analysisResult.commerciale_cutai || {};
      return {
        prodotto: 'CutAI',
        cliente: ana.cliente_ragione_sociale,
        canone_trim: comm.canone_base_trimestrale,
        durata_mesi: det.durata_mesi,
        preavviso_gg: det.preavviso_giorni,
        tetto_cred: sla.tetto_crediti,
        credito_uptime: sla.credito_uptime,
        credito_ticketing: sla.credito_ticketing
      };
    }
  };

  return (
    <section className="view active">
      {showPreSign ? (
        <PreSignAnalysisView
          contractData={getContractDataForPreSign()}
          onBack={handleBackFromPreSign}
          onShowLoader={onShowLoader}
          onHideLoader={onHideLoader}
          onShowToast={onShowToast}
        />
      ) : (
        <>
          <PipelineSteps currentStep={currentStep} />

          {currentStep === 1 && (
            <UploadStep
              files={files}
              onFilesSelect={handleFilesSelect}
              onRemoveFile={handleRemoveFile}
              onUpload={handleUpload}
            />
          )}

          {currentStep === 2 && (
            <AnalysisStep
              analysisResult={analysisResult}
              batchResults={batchResults}
              onBack={() => setCurrentStep(1)}
              onSave={handleSave}
              onSaveAll={handleSaveAll}
              onPreSignAnalysis={analysisResult && !batchResults.length ? handlePreSignAnalysis : null}
            />
          )}

          {currentStep === 3 && (
            <ConfirmationStep
              savedIds={savedIds}
              onViewContracts={() => onViewChange('contracts')}
              onUploadAnother={handleReset}
            />
          )}
        </>
      )}
    </section>
  );
};

export default UploadView;
