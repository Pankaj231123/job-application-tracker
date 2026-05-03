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

function displayUserName(user) {
  if (!user) return '';

  function titleCase(value) {
    return String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  if (user.name && String(user.name).trim()) {
    return titleCase(user.name);
  }

  if (user.email && String(user.email).includes('@')) {
    return titleCase(String(user.email).split('@')[0]);
  }

  return titleCase(user.email || '');
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

  async function handleCopyToken() {
    const token = localStorage.getItem('job-tracker-token');
    if (!token) {
      window.alert('No login token found. Please sign in again.');
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      window.alert('JWT token copied. Paste it into the LinkedIn Sync extension popup.');
    } catch {
      window.alert('Unable to copy the token automatically. Please copy it manually from browser storage.');
    }
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
  const displayName = displayUserName(user);
  const activeApplications = (byStatus.applied || 0) + (byStatus.interview || 0) + (byStatus.technical || 0);
  const closingSoon = (byStatus.offer || 0) + (byStatus.interview || 0);
  const offerRate = total > 0 ? Math.round(((byStatus.offer || 0) / total) * 100) : 0;

  return (
    <main className="dashboard dashboard--home">
      <section className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <span className="dashboard__eyebrow">Job Application Tracker</span>
          <h1>{displayName ? `Welcome back, ${displayName}` : 'Welcome back'}</h1>
          <p>
            Your job search is organized, warm, and easy to scan. Keep momentum with one place for saved,
            applied, interview, and offer stages.
          </p>

          <div className="dashboard-hero__actions">
            <Link className="dashboard__primary-action" to="/jobs/new">
              Add new job
            </Link>
            <Link className="dashboard__secondary-action" to="/jobs">
              View all jobs
            </Link>
            <button type="button" className="dashboard__secondary-action" onClick={handleCopyToken}>
              Copy token
            </button>
          </div>
        </div>

        <aside className="dashboard-hero__panel">
          <div className="dashboard-hero__panel-top">
            <span>Live snapshot</span>
            <strong>{total}</strong>
          </div>

          <div className="dashboard-hero__panel-grid">
            <article>
              <span>Active</span>
              <strong>{activeApplications}</strong>
            </article>
            <article>
              <span>Closing soon</span>
              <strong>{closingSoon}</strong>
            </article>
            <article>
              <span>Offer rate</span>
              <strong>{offerRate}%</strong>
            </article>
            <article>
              <span>Saved</span>
              <strong>{byStatus.saved || 0}</strong>
            </article>
          </div>

          <div className="dashboard-hero__panel-footer">
            <p>Use the Jobs List to update status, edit applications, and keep the flow clean.</p>
            <Link to="/jobs" className="dashboard-hero__panel-link">
              Open jobs list
            </Link>
          </div>
        </aside>
      </section>

      <section className="dashboard-metrics">
        <article className="metric-card metric-card--accent">
          <span>Total Applications</span>
          <strong>{total}</strong>
          <p>All saved roles in your workspace.</p>
        </article>

        <article className="metric-card">
          <span>In Progress</span>
          <strong>{activeApplications}</strong>
          <p>Applications waiting on the next step.</p>
        </article>

        <article className="metric-card">
          <span>Active Pipeline</span>
          <strong>{closingSoon}</strong>
          <p>Roles closest to a decision.</p>
        </article>
      </section>

      <section className="dashboard-board">
        <div className="section-head">
          <div>
            <h2>Status Breakdown</h2>
            <span>Current counts by pipeline stage</span>
          </div>
          <Link className="dashboard__link" to="/jobs">
            Open the full jobs list
          </Link>
        </div>

        <div className="status-grid status-grid--dashboard">
          {statusOrder.map((status) => {
            const count = byStatus[status] || 0;
            const width = total > 0 ? Math.max(8, Math.round((count / total) * 100)) : 0;

            return (
              <article key={status} className="status-pill">
                <div className="status-pill__top">
                  <span>{formatStatus(status)}</span>
                  <strong>{count}</strong>
                </div>
                <div className="status-pill__track" aria-hidden="true">
                  <span style={{ width: `${width}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-board dashboard-board--recent">
        <div className="section-head">
          <div>
            <h2>Recent Applications</h2>
            <span>Latest roles in the tracker</span>
          </div>
        </div>

        <div className="recent-grid">
          {jobs.length === 0 ? (
            <div className="recent-empty">No job applications yet. Add your first role from the jobs screen.</div>
          ) : (
            jobs.map((job) => (
              <article className="recent-card" key={job.id}>
                <div className="recent-card__header">
                  <div>
                    <p>{job.company}</p>
                    <h3>{job.title}</h3>
                  </div>
                  <span className={`status-tag status-tag--${job.status || 'saved'}`}>
                    {formatStatus(job.status || 'saved')}
                  </span>
                </div>

                <div className="recent-card__body">
                  <div>
                    <span>Applied</span>
                    <strong>{formatDate(job.applied_date || job.appliedDate)}</strong>
                  </div>
                  <div>
                    <span>Deadline</span>
                    <strong>{formatDate(job.deadline)}</strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}