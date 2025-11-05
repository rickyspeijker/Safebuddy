import React from 'react';

export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#2C3E91] text-white hover:opacity-95 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
