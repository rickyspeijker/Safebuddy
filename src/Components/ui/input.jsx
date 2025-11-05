import React from 'react';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A5FC1] ${className}`}
      {...props}
    />
  );
}

export default Input;
