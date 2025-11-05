import React from 'react';

export function Switch({ checked = false, onChange, className = '' }) {
  return (
    <label className={`inline-flex items-center cursor-pointer ${className}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#4A5FC1]' : 'bg-gray-300'}`} />
    </label>
  );
}

export default Switch;
