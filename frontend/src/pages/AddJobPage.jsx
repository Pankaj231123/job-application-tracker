import { Link, useNavigate } from 'react-router-dom';
import JobForm from '../components/JobForm';
import { createJob } from '../lib/api';

export default function AddJobPage() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await createJob({
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

        <div className="dashboard__actions">
          <Link className="dashboard__secondary-action" to="/jobs">
            Go to jobs list
          </Link>
          <Link className="dashboard__secondary-action" to="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </section>

      <JobForm
        title="Add New Job"
        description="Capture a new application so it appears in your dashboard metrics immediately."
        submitLabel="Save Job"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/jobs', { replace: true })}
        errorMessage={errorMessage}
        successMessage={successMessage}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}