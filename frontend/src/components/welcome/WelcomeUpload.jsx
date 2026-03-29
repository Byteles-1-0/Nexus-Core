// src/components/welcome/WelcomeUpload.jsx
import React, { useRef, useState } from 'react';
import { formatFileSize } from '../../utils/helpers';

const WelcomeUpload = ({ onFilesSelected, onStartAnalysis }) => {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilesChange = (files) => {
    const allowed = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
    const valid = files.filter(f => 
      allowed.includes(f.name.split('.').pop().toLowerCase())
    );
    
    if (valid.length === 0) {
      alert('Formato non supportato. Usa PDF, DOCX, JPG o PNG.');
      return;
    }
    
    setSelectedFiles(valid);
    onFilesSelected(valid);
  };

  const handleRemove = () => {
    setSelectedFiles([]);
    onFilesSelected([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  const displayName = selectedFiles.length === 1 
    ? selectedFiles[0].name 
    : `${selectedFiles.length} file selezionati`;

  return (
    <div className="welcome-phase active">
      <div className="welcome-logo">
        <div className="welcome-logo-icon">
          <i className="ri-file-shield-2-line"></i>
        </div>
        <h1 className="welcome-title">FOCO</h1>
        <p className="welcome-tagline">Contract Intelligence Platform</p>
      </div>

      <div className="welcome-hero-text">
        <h2>
          Gestisci i tuoi contratti<br />
          con l'<span className="gradient-text">Intelligenza Artificiale</span>
        </h2>
        <p className="welcome-subtitle">
          Carica il contratto del tuo cliente e il nostro sistema AI estrarrà automaticamente tutti i dati.
        </p>
      </div>

      <div className="welcome-upload-area">
        {selectedFiles.length === 0 ? (
          <div
            className={`welcome-dropzone ${isDragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files.length) {
                handleFilesChange(Array.from(e.dataTransfer.files));
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              multiple
              hidden
              onChange={(e) => handleFilesChange(Array.from(e.target.files))}
            />
            <div className="welcome-dropzone-content">
              <div className="welcome-dropzone-icon">
                <i className="ri-upload-cloud-2-line"></i>
              </div>
              <h3>Trascina qui il contratto</h3>
              <p>oppure <span className="welcome-browse-link">sfoglia i file</span></p>
              <div className="welcome-formats">
                <span>PDF</span>
                <span>DOCX</span>
                <span>JPG</span>
                <span>PNG</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="welcome-file-selected">
            <div className="welcome-file-info">
              <i className="ri-file-text-line"></i>
              <div>
                <span className="welcome-file-name">{displayName}</span>
                <span className="welcome-file-size">{formatFileSize(totalSize)}</span>
              </div>
            </div>
            <button className="welcome-file-remove" onClick={handleRemove}>
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}

        <button
          className="welcome-btn-start"
          disabled={selectedFiles.length === 0}
          onClick={() => onStartAnalysis(selectedFiles)}
        >
          <i className="ri-sparkling-2-line"></i>
          <span>Analizza Contratto</span>
          <i className="ri-arrow-right-line"></i>
        </button>
      </div>

      <div className="welcome-footer-hint">
        <i className="ri-shield-check-line"></i>
        <span>I tuoi documenti sono trattati in modo sicuro e conforme al GDPR</span>
      </div>
    </div>
  );
};

export default WelcomeUpload;
