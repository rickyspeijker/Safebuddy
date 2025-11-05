import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`rounded-lg bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
