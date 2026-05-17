package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// jobColumns returns the column list matching models.Job fields.
func jobColumns() []string {
	return []string{
		"id", "user_id", "company", "title", "url",
		"location", "salary", "status", "applied_date",
		"deadline", "notes", "created_at", "updated_at", "deleted_at",
	}
}

// singleJobRow returns a sqlmock row for one job.
func singleJobRow(id, userID uuid.UUID, company, title, status string) *sqlmock.Rows {
	return sqlmock.NewRows(jobColumns()).AddRow(
		id, userID, company, title, "https://example.com",
		"Remote", "$100k", status, nil,
		nil, "", time.Now(), time.Now(), nil,
	)
}

// --- CreateJob ---

func TestCreateJob_Success(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	// UUID PK set in BeforeCreate → ExecContext, not QueryContext
	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "jobs"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	body, _ := json.Marshal(map[string]string{"company": "Acme Corp", "title": "Engineer"})
	req := httptest.NewRequest(http.MethodPost, "/jobs", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "Job added successfully", resp["message"])
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestCreateJob_DefaultStatusIsSaved(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "jobs"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	body, _ := json.Marshal(map[string]string{"company": "Acme", "title": "Dev"})
	req := httptest.NewRequest(http.MethodPost, "/jobs", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	job := resp["job"].(map[string]any)
	assert.Equal(t, "saved", job["status"])
}

func TestCreateJob_MissingCompany(t *testing.T) {
	r := newRouter()
	body, _ := json.Marshal(map[string]string{"title": "Engineer"})
	req := httptest.NewRequest(http.MethodPost, "/jobs", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(authCookie(t))
	w := serve(r, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateJob_MissingTitle(t *testing.T) {
	r := newRouter()
	body, _ := json.Marshal(map[string]string{"company": "Acme"})
	req := httptest.NewRequest(http.MethodPost, "/jobs", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(authCookie(t))
	w := serve(r, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateJob_Unauthenticated(t *testing.T) {
	r := newRouter()
	body, _ := json.Marshal(map[string]string{"company": "Acme", "title": "Eng"})
	req := httptest.NewRequest(http.MethodPost, "/jobs", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// --- GetJobs ---

func TestGetJobs_ReturnsAll(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(
			singleJobRow(uuid.New(), testUserID, "Acme", "Dev", "applied").
				AddRow(uuid.New(), testUserID, "Corp", "QA", "saved", "https://corp.com", "NYC", "$80k", nil, nil, "", time.Now(), time.Now(), nil),
		)

	req := httptest.NewRequest(http.MethodGet, "/jobs", nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, float64(2), resp["total"])
}

func TestGetJobs_WithStatusFilter(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(singleJobRow(uuid.New(), testUserID, "Acme", "Dev", "applied"))

	req := httptest.NewRequest(http.MethodGet, "/jobs?status=applied", nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, float64(1), resp["total"])
}

func TestGetJobs_Empty(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(sqlmock.NewRows(jobColumns()))

	req := httptest.NewRequest(http.MethodGet, "/jobs", nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, float64(0), resp["total"])
}

// --- GetJob ---

func TestGetJob_Found(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	jobID := uuid.New()
	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(singleJobRow(jobID, testUserID, "Corp", "Dev", "saved"))

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/jobs/%s", jobID), nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	job := resp["job"].(map[string]any)
	assert.Equal(t, "Corp", job["company"])
}

func TestGetJob_NotFound(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	jobID := uuid.New()
	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(sqlmock.NewRows(nil))

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/jobs/%s", jobID), nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// --- UpdateJob ---

func TestUpdateJob_Success(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	jobID := uuid.New()
	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(singleJobRow(jobID, testUserID, "OldCo", "Dev", "saved"))
	// Save uses UPDATE (ExecContext)
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "jobs"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	body, _ := json.Marshal(map[string]string{"company": "NewCo", "status": "applied"})
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/jobs/%s", jobID), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "Job updated successfully", resp["message"])
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUpdateJob_NotFound(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	jobID := uuid.New()
	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(sqlmock.NewRows(nil))

	body, _ := json.Marshal(map[string]string{"company": "NewCo"})
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/jobs/%s", jobID), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// --- DeleteJob ---

func TestDeleteJob_Success(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	jobID := uuid.New()
	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(singleJobRow(jobID, testUserID, "Corp", "Dev", "saved"))
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "jobs" SET "deleted_at"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/jobs/%s", jobID), nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "Job deleted successfully", resp["message"])
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestDeleteJob_NotFound(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	jobID := uuid.New()
	mock.ExpectQuery(`SELECT \* FROM "jobs"`).
		WillReturnRows(sqlmock.NewRows(nil))

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/jobs/%s", jobID), nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// --- Dashboard ---

func TestDashboard_ReturnsCounts(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectQuery(`SELECT status, count`).
		WillReturnRows(sqlmock.NewRows([]string{"status", "count"}).
			AddRow("applied", 3).
			AddRow("offer", 1).
			AddRow("rejected", 2))

	req := httptest.NewRequest(http.MethodGet, "/dashboard", nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, float64(6), resp["total"])

	byStatus := resp["by_status"].(map[string]any)
	assert.Equal(t, float64(3), byStatus["applied"])
	assert.Equal(t, float64(1), byStatus["offer"])
	assert.Equal(t, float64(2), byStatus["rejected"])
	assert.Equal(t, float64(0), byStatus["saved"]) // zero-filled
}

func TestDashboard_Unauthenticated(t *testing.T) {
	r := newRouter()
	req := httptest.NewRequest(http.MethodGet, "/dashboard", nil)
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestDashboard_Empty(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectQuery(`SELECT status, count`).
		WillReturnRows(sqlmock.NewRows([]string{"status", "count"}))

	req := httptest.NewRequest(http.MethodGet, "/dashboard", nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, float64(0), resp["total"])
}
