import React from 'react';

export default function EmployeeCategoryFields({ category, salesSegment, onChange, disabled = false }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
        Employee Category *
        <select className="form-select" required disabled={disabled} value={category}
          onChange={(e) => onChange({ category: e.target.value, salesSegment: e.target.value === 'Sales' ? (salesSegment || 'B2C') : '' })}>
          <option value="" disabled>Select category</option>
          <option value="Academic">Academic</option>
          <option value="Sales">Sales</option>
        </select>
      </label>
      {category === 'Sales' && (
        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
          Sales Segment *
          <select className="form-select" required disabled={disabled} value={salesSegment}
            onChange={(e) => onChange({ category, salesSegment: e.target.value })}>
            <option value="" disabled>Select segment</option>
            <option value="B2C">B2C</option>
            <option value="B2B2C">B2B2C</option>
          </select>
        </label>
      )}
    </div>
  );
}
