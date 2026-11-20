import React, { useId } from 'react';

export const FormInput = ({
  label,
  name,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  step,
  min,
  max,
  className = '',
  suffix
}) => {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          </span>
        </label>
      )}
      <div className="relative rounded-lg shadow-2xs">
        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 ${
            error ? 'border-rose-300 focus:ring-rose-500 text-rose-900' : 'border-slate-300 hover:border-slate-400'
          } ${suffix ? 'pr-14' : ''}`}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{suffix}</span>
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={helpId} className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export const FormSelect = ({
  label,
  name,
  id,
  value,
  onChange,
  options = [], // [{ value, label }] OR ['Option 1', 'Option 2']
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
  placeholder = 'Select an option...'
}) => {
  const generatedId = useId();
  const selectId = id || name || generatedId;
  const errorId = `${selectId}-error`;
  const helpId = `${selectId}-help`;

  // Normalize options to support both string arrays and object arrays { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.label,
        label: opt.label !== undefined ? opt.label : opt.value
      };
    }
    return {
      value: opt,
      label: String(opt)
    };
  });

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          </span>
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helpText ? helpId : undefined}
        disabled={disabled}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 shadow-2xs cursor-pointer ${
          error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalizedOptions.map((opt, idx) => (
          <option key={`${opt.value}-${idx}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={helpId} className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export const FormTextarea = ({
  label,
  name,
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  error,
  helpText,
  disabled = false,
  className = ''
}) => {
  const generatedId = useId();
  const textareaId = id || name || generatedId;
  const errorId = `${textareaId}-error`;
  const helpId = `${textareaId}-help`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-slate-700 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          </span>
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helpText ? helpId : undefined}
        disabled={disabled}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 shadow-2xs ${
          error ? 'border-rose-300 focus:ring-rose-500 text-rose-900' : 'border-slate-300 hover:border-slate-400'
        }`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={helpId} className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  );
};
