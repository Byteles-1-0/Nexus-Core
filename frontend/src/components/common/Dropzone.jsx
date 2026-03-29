// src/components/common/Dropzone.jsx
import React, { useRef, useState } from 'react';

const Dropzone = ({ onFilesSelected, accept = '.pdf,.docx,.jpg,.jpeg,.png', multiple = false }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={handleFileChange}
      />
      <div className="dropzone-content">
        <div className="dropzone-icon">
          <i className="ri-file-upload-line"></i>
        </div>
        <h3>Trascina qui i tuoi contratti</h3>
        <p>oppure <span className="dropzone-link">sfoglia i file</span></p>
        <div className="dropzone-formats">
          <span className="format-badge">PDF</span>
          <span className="format-badge">DOCX</span>
          <span className="format-badge">JPG</span>
          <span className="format-badge">PNG</span>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;
