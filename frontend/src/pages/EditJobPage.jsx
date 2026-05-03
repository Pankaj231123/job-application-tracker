import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import JobForm, { normalizeJobForm } from '../components/JobForm';
import { getJob, updateJob } from '../lib/api';

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadJob() {
      try {
        const response = await getJob(id);
        if (!isActive) return;
        setJob(response.job);
      } catch (error) {
        if (!isActive) return;
        setErrorMessage(error.message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadJob();

    return () => {
      isActive = false;
    };
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const company = String(formData.get('company') || '').trim();
    const title = String(formData.get('title') || '').trim();

    if (!company) {
      setErrorMessage('Company is required.');
      return;
    }

    if (!title) {
      setErrorMessage('Job title is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await updateJob(id, {
        company,
        title,
        url: String(formData.get('url') || '').trim(),
        location: String(formData.get('location') || '').trim(),
        salary: String(formData.get('salary') || '').trim(),
        status: String(formData.get('status') || 'saved'),
        applied_date: String(formData.get('applied_date') || ''),
        deadline: String(formData.get('deadline') || ''),
        notes: String(formData.get('notes') || '').trim(),
      });

      setSuccessMessage('Job updated successfully. Returning to jobs list...');
      setTimeout(() => navigate('/jobs', { replace: true }), 700);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="dashboard dashboard--centered">
        <div className="dashboard-loading">Loading job details...</div>
      </div>
    );
  }

  if (errorMessage && !job) {
    return (
      <div className="dashboard dashboard--centered">
        <div className="dashboard-error">
          <h2>Unable to load job</h2>
          <p>{errorMessage}</p>
          <button type="button" className="auth-button" onClick={() => navigate('/jobs', { replace: true })}>
            Back to Jobs List
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="dashboard dashboard--form">
      <section className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">Job Application Tracker</span>
          <h1>Edit Job</h1>
          <p>Update the application details and keep your pipeline accurate.</p>
        </div>

        <div className="dashboard__actions">
          <Link className="dashboard__secondary-action" to="/jobs">
            Back to jobs list
          </Link>
        </div>
      </section>

      <JobForm
        title="Edit Job"
        description="Same job form, already filled with the existing application data."
        submitLabel="Update Job"
        cancelLabel="Back to jobs list"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/jobs', { replace: true })}
        errorMessage={errorMessage}
        successMessage={successMessage}
        isSubmitting={isSubmitting}
        initialValues={normalizeJobForm(job)}
      />
    </main>
  );
}