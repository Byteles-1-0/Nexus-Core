// src/components/upload/UploadStep.jsx
import React from 'react';
import Card from '../common/Card';
import Dropzone from '../common/Dropzone';
import Button from '../common/Button';
import { formatFileSize } from '../../utils/helpers';

const UploadStep = ({ files, onFilesSelect, onRemoveFile, onUpload }) => {
  return (
    <div className="step-content active">
      <Card>
        <Card.Header>
          <h2><i className="ri-upload-cloud-2-line"></i> Carica Contratto</h2>
        </Card.Header>
        <Card.Body>
          {files.length === 0 ? (
            <Dropzone onFilesSelected={onFilesSelect} multiple />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="ri-file-text-line" style={{ color: 'var(--accent)' }}></i>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{file.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRemoveFile(idx)}
                    style={{ padding: '2px 6px' }}
                  >
                    <i className="ri-close-line"></i>
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <Button
            variant="primary"
            size="lg"
            full
            disabled={files.length === 0}
            onClick={onUpload}
          >
            <i className="ri-sparkling-2-line"></i> Analizza con AI
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UploadStep;
