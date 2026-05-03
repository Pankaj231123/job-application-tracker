import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteJob, getJobs } from '../lib/api';

const statusLabels = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  technical: 'Technical',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
};

const statusOptions = ['all', 'saved', 'applied', 'interview', 'technical', 'offer', 'rejected', 'ghosted'];

function formatStatus(status) {
  return statusLabels[status] || status;
}

function formatDate(dateValue) {
  if (!dateValue) return 'Not set';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export default function JobListPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyJobId, setBusyJobId] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadJobs() {
      try {
        const response = await getJobs();
        if (!isActive) return;
        setJobs(response.jobs || []);
      } catch (error) {
        if (!isActive) return;
        setErrorMessage(error.message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = normalize(search);

    return jobs.filter((job) => {
      const matchesSearch =
        normalizedSearch === '' ||
        normalize(job.company).includes(normalizedSearch) ||
        normalize(job.title).includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || normalize(job.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  async function handleDelete(job) {
    const confirmed = window.confirm(`Delete ${job.title} at ${job.company}?`);
    if (!confirmed) return;

    setBusyJobId(job.id);

    try {
      await deleteJob(job.id);
      setJobs((current) => current.filter((item) => item.id !== job.id));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBusyJobId('');
    }
  }

  if (isLoading) {
    return (
      <div className="dashboard dashboard--centered">
        <div className="dashboard-loading">Loading jobs...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="dashboard dashboard--centered">
        <div className="dashboard-error">
          <h2>Unable to load jobs</h2>
          <p>{errorMessage}</p>
          <button type="button" className="auth-button" onClick={() => navigate('/dashboard', { replace: true })}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="dashboard dashboard--list">
      <section className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">Job Application Tracker</span>
          <h1>Jobs List</h1>
          <p>Search, filter, edit, or delete every job in one place.</p>
        </div>

        <div className="dashboard__actions">
          <Link className="dashboard__secondary-action" to="/dashboard">
            Back to dashboard
          </Link>
          <Link className="dashboard__primary-action" to="/jobs/new">
            Add new job
          </Link>
        </div>
      </section>

      <section className="jobs-toolbar">
        <label className="jobs-toolbar__field jobs-toolbar__field--search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company or title"
          />
        </label>

        <label className="jobs-toolbar__field">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : formatStatus(status)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="jobs-table-card">
        <div className="section-head">
          <h2>All Jobs</h2>
          <span>
            {filteredJobs.length} result{filteredJobs.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="jobs-table-wrap">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Title</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="jobs-empty">No jobs match your search and filter settings.</div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.company}</td>
                    <td>{job.title}</td>
                    <td>{job.location || 'Not set'}</td>
                    <td>
                      <span className={`status-tag status-tag--${job.status || 'saved'}`}>
                        {formatStatus(job.status || 'saved')}
                      </span>
                    </td>
                    <td>{formatDate(job.applied_date || job.appliedDate)}</td>
                    <td>{formatDate(job.deadline)}</td>
                    <td>
                      <div className="job-row-actions">
                        <Link className="job-row-actions__button" to={`/jobs/${job.id}/edit`}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="job-row-actions__button job-row-actions__button--danger"
                          onClick={() => handleDelete(job)}
                          disabled={busyJobId === job.id}
                        >
                          {busyJobId === job.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}