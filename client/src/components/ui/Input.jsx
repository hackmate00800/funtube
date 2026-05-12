import React from 'react';

const GlassInput = ({ label, error, icon: Icon, className = '', ...props }) => {
  const id = props.id || props.name || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          className={`input-field ${Icon ? 'pl-10' : ''} ${error ? 'input-field-error' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error && <p id={`${id}-error`} className="text-xs text-red-400" role="alert">{error}</p>}
    </div>
  );
};

export const GlassTextarea = ({ label, error, className = '', ...props }) => {
  const id = props.id || props.name || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <textarea
        id={id}
        className={`input-field resize-none min-h-[100px] ${error ? 'input-field-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && <p id={`${id}-error`} className="text-xs text-red-400" role="alert">{error}</p>}
    </div>
  );
};

export const GlassSelect = ({ label, error, icon: Icon, children, className = '', ...props }) => {
  const id = props.id || props.name || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          id={id}
          className={`input-field ${Icon ? 'pl-10' : ''} appearance-none cursor-pointer ${error ? 'input-field-error' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p id={`${id}-error`} className="text-xs text-red-400" role="alert">{error}</p>}
    </div>
  );
};

export default GlassInput;
