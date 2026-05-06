import { useState } from 'react';

function PasswordField({ field }) {
  const [show, setShow] = useState(false);

  return (
    <label className="field" key={field.name} htmlFor={field.name}>
      <span className="field__label">{field.label}</span>
      <div className="field__password-wrapper">
        <input
          id={field.name}
          name={field.name}
          type={show ? 'text' : 'password'}
          value={field.value}
          onChange={field.onChange}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          aria-invalid={Boolean(field.error)}
          aria-describedby={field.error ? `${field.name}-error` : undefined}
          required
        />
        <button
          type="button"
          className="field__password-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {field.error ? (
        <span className="field__error" id={`${field.name}-error`}>
          {field.error}
        </span>
      ) : null}
    </label>
  );
}

export default function AuthForm({
  title,
  description,
  submitLabel,
  footer,
  onSubmit,
  fields,
  error,
  success,
  isSubmitting,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-form__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="auth-form__fields">
        {fields.map((field) =>
          field.type === 'password' ? (
            <PasswordField key={field.name} field={field} />
          ) : (
            <label className="field" key={field.name} htmlFor={field.name}>
              <span className="field__label">{field.label}</span>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={field.value}
                onChange={field.onChange}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(field.error)}
                aria-describedby={field.error ? `${field.name}-error` : undefined}
                required
              />
              {field.error ? (
                <span className="field__error" id={`${field.name}-error`}>
                  {field.error}
                </span>
              ) : null}
            </label>
          )
        )}
      </div>

      {error ? <div className="auth-message auth-message--error">{error}</div> : null}
      {success ? <div className="auth-message auth-message--success">{success}</div> : null}

      <button className="auth-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait...' : submitLabel}
      </button>

      {footer}
    </form>
  );
}
