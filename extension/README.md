# Job Tracker LinkedIn Sync

This Chrome/Edge extension saves a LinkedIn job into the Job Application Tracker and marks it as `applied`.

## Setup

1. Run the backend and frontend.
2. Log in to the tracker.
3. Click the **Copy token** button on the dashboard and paste it into the extension popup.
4. Open `chrome://extensions`.
5. Enable Developer mode.
6. Click **Load unpacked** and choose the `extension/` folder.

## How it works

- Open a LinkedIn job page.
- Click the floating **Sync to Job Tracker** button, or open the extension popup and click **Sync Current Page**.
- The extension sends the job URL, title, and company to the backend.
- If a matching job already exists for that URL, it gets updated to `applied`.
- If not, a new job is created.

## Notes

- The extension uses the same backend JWT auth as the web app.
- The backend must allow `chrome-extension://` origins, which is already handled in the server CORS configuration.
