import React, { createContext, useContext, useState } from 'react';

const SelectContext = createContext(null);

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = '', ...props }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  return (
    <button type="button" onClick={() => ctx.setOpen(!ctx.open)} className={`px-3 py-2 bg-white ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SelectValue({ placeholder = '', className = '' }) {
  const ctx = useContext(SelectContext);
  const display = ctx?.value ?? '';
  return <span className={className}>{display || placeholder}</span>;
}

export function SelectContent({ children, className = '' }) {
  const ctx = useContext(SelectContext);
  if (!ctx || !ctx.open) return null;
  return (
    <div className={`absolute z-40 mt-2 bg-white border rounded shadow ${className}`}>
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = '' }) {
  const ctx = useContext(SelectContext);
  const handleClick = () => {
    ctx?.onValueChange?.(value);
    ctx?.setOpen?.(false);
  };
  return (
    <div onClick={handleClick} className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${className}`}> {children} </div>
  );
}

export default Select;
