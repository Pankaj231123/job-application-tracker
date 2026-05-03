import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createJob } from '../lib/api';

const statusOptions = [
  'saved',
  'applied',
  'interview',
  'technical',
  'offer',
  'rejected',
  'ghosted',
];

const initialForm = {
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

export default function AddJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  }

  function validate() {
    if (!form.company.trim()) return 'Company is required.';
    if (!form.title.trim()) return 'Job title is required.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createJob({
        company: form.company.trim(),
        title: form.title.trim(),
        url: form.url.trim(),
        location: form.location.trim(),
        salary: form.salary.trim(),
        status: form.status,
        applied_date: form.applied_date,
        deadline: form.deadline,
        notes: form.notes.trim(),
      });

      setSuccessMessage('Job added successfully. Returning to dashboard...');
      setTimeout(() => navigate('/dashboard', { replace: true }), 700);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="dashboard dashboard--form">
      <section className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">Job Application Tracker</span>
          <h1>Add New Job</h1>
          <p>Capture a new application so it appears in your dashboard metrics immediately.</p>
        </div>

        <Link className="dashboard__secondary-action" to="/dashboard">
          Back to dashboard
        </Link>
      </section>

      <form className="job-form" onSubmit={handleSubmit}>
        <div className="job-form__grid">
          <label className="job-field">
            <span>Company</span>
            <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." />
          </label>

          <label className="job-field">
            <span>Title</span>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Backend Engineer" />
          </label>

          <label className="job-field job-field--full">
            <span>Job URL</span>
            <input name="url" value={form.url} onChange={handleChange} placeholder="https://..." />
          </label>

          <label className="job-field">
            <span>Location</span>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Remote" />
          </label>

          <label className="job-field">
            <span>Salary</span>
            <input name="salary" value={form.salary} onChange={handleChange} placeholder="$90k - $120k" />
          </label>

          <label className="job-field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="job-field">
            <span>Applied Date</span>
            <input name="applied_date" type="date" value={form.applied_date} onChange={handleChange} />
          </label>

          <label className="job-field">
            <span>Deadline</span>
            <input name="deadline" type="date" value={form.deadline} onChange={handleChange} />
          </label>

          <label className="job-field job-field--full">
            <span>Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Interview details, referral info, follow-up notes..."
              rows="5"
            />
          </label>
        </div>

        {errorMessage ? <div className="auth-message auth-message--error">{errorMessage}</div> : null}
        {successMessage ? <div className="auth-message auth-message--success">{successMessage}</div> : null}

        <div className="job-form__actions">
          <button className="auth-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Job'}
          </button>
          <Link className="job-form__cancel" to="/dashboard">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}