import React from 'react';

export function Dialog({ open = false, onOpenChange, children }) {
  // Controlled by `open` prop or internal state; we simply render when open is true
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
}

export default Dialog;
