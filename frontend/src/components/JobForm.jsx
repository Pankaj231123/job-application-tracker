import { useMemo } from 'react';

const defaultStatusOptions = ['saved', 'applied', 'interview', 'technical', 'offer', 'rejected', 'ghosted'];

const emptyForm = {
  company: '',
  title: '',
  url: '',
  location: '',
  salary: '',
  status: 'saved',
  applied_date: '',
  deadline: '',
  notes: '',
};

function toDateInputValue(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

export function normalizeJobForm(job = {}) {
  return {
    company: job.company || '',
    title: job.title || '',
    url: job.url || '',
    location: job.location || '',
    salary: job.salary || '',
    status: job.status || 'saved',
    applied_date: toDateInputValue(job.applied_date || job.appliedDate),
    deadline: toDateInputValue(job.deadline),
    notes: job.notes || '',
  };
}

export default function JobForm({
  title,
  description,
  submitLabel,
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  errorMessage,
  successMessage,
  isSubmitting,
  initialValues,
  statusOptions = defaultStatusOptions,
}) {
  const values = useMemo(() => ({ ...emptyForm, ...normalizeJobForm(initialValues) }), [initialValues]);

  return (
    <form className="job-form" onSubmit={onSubmit} noValidate>
      <div className="job-form__header">
        <div>
          <span className="dashboard__eyebrow">Job Application Tracker</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="job-form__grid">
        <label className="job-field">
          <span>Company name</span>
          <input name="company" defaultValue={values.company} placeholder="Acme Inc." />
        </label>

        <label className="job-field">
          <span>Job title</span>
          <input name="title" defaultValue={values.title} placeholder="Backend Engineer" />
        </label>

        <label className="job-field job-field--full">
          <span>Job URL</span>
          <input name="url" defaultValue={values.url} placeholder="https://company.jobs/posting" />
        </label>

        <label className="job-field">
          <span>Location</span>
          <input name="location" defaultValue={values.location} placeholder="Remote" />
        </label>

        <label className="job-field">
          <span>Salary</span>
          <input name="salary" defaultValue={values.salary} placeholder="$90k - $120k" />
        </label>

        <label className="job-field">
          <span>Status</span>
          <select name="status" defaultValue={values.status}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="job-field">
          <span>Applied date</span>
          <input name="applied_date" type="date" defaultValue={values.applied_date} />
        </label>

        <label className="job-field">
          <span>Deadline</span>
          <input name="deadline" type="date" defaultValue={values.deadline} />
        </label>

        <label className="job-field job-field--full">
          <span>Notes</span>
          <textarea
            name="notes"
            defaultValue={values.notes}
            placeholder="Interview details, follow-up reminders, referral notes..."
            rows="5"
          />
        </label>
      </div>

      {errorMessage ? <div className="auth-message auth-message--error">{errorMessage}</div> : null}
      {successMessage ? <div className="auth-message auth-message--success">{successMessage}</div> : null}

      <div className="job-form__actions">
        <button className="auth-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>

        {onCancel ? (
          <button className="job-form__cancel" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}