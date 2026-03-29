// src/components/welcome/WelcomePage.jsx
import React, { useState } from 'react';
import { api } from '../../utils/api';
import { sleep } from '../../utils/helpers';
import WelcomeUpload from './WelcomeUpload';
import WelcomeProcessing from './WelcomeProcessing';
import WelcomeGreeting from './WelcomeGreeting';

const WelcomePage = ({ isActive, onComplete }) => {
  const [phase, setPhase] = useState('upload'); // upload, processing, greeting
  const [currentFiles, setCurrentFiles] = useState([]);
  const [processingStep, setProcessingStep] = useState(1);
  const [statusText, setStatusText] = useState('Estrazione testo dal documento');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);

  const handleStartAnalysis = async (files) => {
    setPhase('processing');
    
    try {
      if (files.length > 1) {
        setStatusText(`Caricamento di ${files.length} file...`);
        setProcessingStep(1);
        
        const res = await api.uploadAndAnalyzeBatch(files);
        const data = await res.json();
        
        if (!res.ok || data.status !== 'success') {
          throw new Error(data.message || 'Errore batch upload');
        }
        
        setProcessingStep(2);
        setStatusText('Analisi AI completata...');
        setBatchResults(data.data || []);
        
        await sleep(800);
        setProcessingStep(3);
        setStatusText(`${data.data.length} contratti riconosciuti!`);
      } else {
        setProcessingStep(1);
        setStatusText('Estrazione testo dal documento...');
        
        const uploadRes = await api.uploadFile(files[0]);
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok || uploadData.status !== 'success') {
          throw new Error(uploadData.message || 'Errore upload');
        }
        
        const extractedText = uploadData.data.extracted_text;
        
        setProcessingStep(2);
        setStatusText('Analisi AI in corso...');
        
        const analyzeRes = await api.analyzeText(extractedText);
        const analyzeData = await analyzeRes.json();
        
        if (!analyzeRes.ok || analyzeData.status !== 'success') {
          throw new Error(analyzeData.message || 'Errore analisi');
        }
        
        setAnalysisResult(analyzeData.data);
        
        setProcessingStep(3);
        setStatusText('Riconoscimento completato!');
      }
      
      await sleep(800);
      setPhase('greeting');
    } catch (err) {
      alert(err.message || 'Errore durante l\'elaborazione.');
      setPhase('upload');
      console.error(err);
    }
  };

  const handleContinue = () => {
    onComplete({
      analysisResult,
      batchResults
    });
  };

  if (!isActive) return null;

  return (
    <div className="welcome-page active">
      <div className="welcome-bg">
        <div className="welcome-orb welcome-orb--1"></div>
        <div className="welcome-orb welcome-orb--2"></div>
        <div className="welcome-orb welcome-orb--3"></div>
      </div>

      <div className="welcome-container">
        {phase === 'upload' && (
          <WelcomeUpload
            onFilesSelected={setCurrentFiles}
            onStartAnalysis={handleStartAnalysis}
          />
        )}
        
        {phase === 'processing' && (
          <WelcomeProcessing
            currentStep={processingStep}
            statusText={statusText}
          />
        )}
        
        {phase === 'greeting' && (
          <WelcomeGreeting onContinue={handleContinue} />
        )}
      </div>
    </div>
  );
};

export default WelcomePage;
