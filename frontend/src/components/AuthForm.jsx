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
        {fields.map((field) => (
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
        ))}
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
