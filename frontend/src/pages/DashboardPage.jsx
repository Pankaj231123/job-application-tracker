import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard, getJobs } from '../lib/api';

const statusLabels = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  technical: 'Technical',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
};

const statusOrder = ['saved', 'applied', 'interview', 'technical', 'offer', 'rejected', 'ghosted'];

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const user = useMemo(() => {
    const storedUser = localStorage.getItem('job-tracker-user');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const [dashboardResponse, jobsResponse] = await Promise.all([
          getDashboard(),
          getJobs(),
        ]);

        if (!isActive) return;

        setDashboard(dashboardResponse);
        setJobs((jobsResponse.jobs || []).slice(0, 5));
      } catch (error) {
        if (!isActive) return;

        setErrorMessage(error.message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('job-tracker-token');
    localStorage.removeItem('job-tracker-user');
    navigate('/login', { replace: true });
  }

  if (isLoading) {
    return (
      <div className="dashboard dashboard--centered">
        <div className="dashboard-loading">Loading your dashboard...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="dashboard dashboard--centered">
        <div className="dashboard-error">
          <h2>Unable to load dashboard</h2>
          <p>{errorMessage}</p>
          <button type="button" className="auth-button" onClick={() => navigate('/login', { replace: true })}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const total = dashboard?.total ?? 0;
  const byStatus = dashboard?.by_status || {};

  return (
    <main className="dashboard">
      <section className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">Job Application Tracker</span>
          <h1>Dashboard</h1>
          <p>
            {user?.email ? `Signed in as ${user.email}` : 'Your current application snapshot is below.'}
          </p>
        </div>

        <div className="dashboard__actions">
          <Link className="dashboard__primary-action" to="/jobs/new">
            Add new job
          </Link>
          <Link className="dashboard__secondary-action" to="/jobs">
            View all jobs
          </Link>
          <button type="button" className="dashboard__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className="dashboard__hero-grid">
        <article className="dashboard-card dashboard-card--primary">
          <span className="dashboard-card__label">Total Applications</span>
          <strong>{total}</strong>
          <p>All saved roles in your workspace.</p>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card__label">In Progress</span>
          <strong>{(byStatus.applied || 0) + (byStatus.interview || 0) + (byStatus.technical || 0)}</strong>
          <p>Applications waiting on the next step.</p>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card__label">Active Pipeline</span>
          <strong>{(byStatus.offer || 0) + (byStatus.interview || 0)}</strong>
          <p>Roles closest to a decision.</p>
        </article>
      </section>

      <section className="dashboard__status-section">
        <div className="section-head">
          <h2>Status Breakdown</h2>
          <span>Current counts by pipeline stage</span>
        </div>

        <div className="status-grid">
          {statusOrder.map((status) => (
            <article key={status} className="status-pill">
              <span>{formatStatus(status)}</span>
              <strong>{byStatus[status] || 0}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard__recent-section">
        <div className="section-head">
          <h2>Recent Applications</h2>
          <span>
            <Link className="dashboard__link" to="/jobs">
              Open the full jobs list
            </Link>
          </span>
        </div>

        <div className="recent-list">
          {jobs.length === 0 ? (
            <div className="recent-empty">No job applications yet. Add your first role from the jobs screen.</div>
          ) : (
            jobs.map((job) => (
              <article className="recent-item" key={job.id}>
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company}</p>
                </div>

                <div className="recent-item__meta">
                  <span className={`status-tag status-tag--${job.status || 'saved'}`}>
                    {formatStatus(job.status || 'saved')}
                  </span>
                  <small>Applied: {formatDate(job.applied_date || job.appliedDate)}</small>
                  <small>Deadline: {formatDate(job.deadline)}</small>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}