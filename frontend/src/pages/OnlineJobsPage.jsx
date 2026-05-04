import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchPublicJobs } from '../lib/api';

function formatDate(value) {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function OnlineJobsPage() {
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      setErrorMessage('Enter a role, skill, or company to search the web.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSearched(true);

    try {
      const response = await searchPublicJobs(trimmed);
      setJobs(response.jobs || []);
    } catch (error) {
      setErrorMessage(error.message);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="dashboard dashboard--home">
      <section className="dashboard-hero dashboard-hero--search">
        <div className="dashboard-hero__copy">
          <span className="dashboard__eyebrow">Live web search</span>
          <h1>Search real jobs from the web</h1>
          <p>
            Search live openings from a public jobs source, then open the posting directly on the hiring site.
          </p>

          <form className="online-search" onSubmit={handleSearch}>
            <div className="online-search__field">
              <span>Search term</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by role, skill, or company"
              />
            </div>
            <button type="submit" className="dashboard__primary-action online-search__button">
              Search web jobs
            </button>
          </form>

          <div className="dashboard-hero__actions">
            <Link className="dashboard__secondary-action" to="/jobs">
              Back to tracker
            </Link>
          </div>
        </div>

        <aside className="dashboard-hero__panel">
          <div className="dashboard-hero__panel-top">
            <span>How it works</span>
          </div>
          <div className="dashboard-hero__panel-grid dashboard-hero__panel-grid--one">
            <article>
              <span>1</span>
              <strong>Search live jobs</strong>
            </article>
            <article>
              <span>2</span>
              <strong>Open the real posting</strong>
            </article>
            <article>
              <span>3</span>
              <strong>Save to tracker if needed</strong>
            </article>
          </div>
        </aside>
      </section>

      {errorMessage ? <div className="dashboard-error">{errorMessage}</div> : null}

      <section className="dashboard-board dashboard-board--recent">
        <div className="section-head">
          <div>
            <h2>Web Jobs</h2>
            <span>{searched ? `${jobs.length} live results` : 'Search to see live openings'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="dashboard-loading">Searching live job openings...</div>
        ) : jobs.length === 0 ? (
          <div className="recent-empty">No results yet. Try searching for a role like React, Backend, or Designer.</div>
        ) : (
          <div className="recent-grid">
            {jobs.map((job) => (
              <article className="recent-card" key={job.id}>
                <div className="recent-card__header">
                  <div>
                    <p>{job.company}</p>
                    <h3>{job.title}</h3>
                  </div>
                  <span className="status-tag status-tag--offer">Live</span>
                </div>

                <div className="recent-card__body">
                  <div>
                    <span>Location</span>
                    <strong>{job.location || 'Remote / mixed'}</strong>
                  </div>
                  <div>
                    <span>Published</span>
                    <strong>{formatDate(job.published_at)}</strong>
                  </div>
                </div>

                <div className="online-job-actions">
                  <a className="jobs-apply-button" href={job.url} target="_blank" rel="noreferrer">
                    Apply now
                  </a>
                  <span className="online-job-actions__meta">{job.type || 'Live opening'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}