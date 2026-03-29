// src/components/common/SearchBox.jsx
import React from 'react';

const SearchBox = ({ value, onChange, placeholder = 'Cerca...' }) => {
  return (
    <div className="search-box">
      <i className="ri-search-line"></i>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBox;
