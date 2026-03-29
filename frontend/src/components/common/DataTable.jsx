// src/components/common/DataTable.jsx
import React from 'react';

const DataTable = ({ headers, children }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {headers.map((header, idx) => (
            <th key={idx}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  );
};

export default DataTable;
