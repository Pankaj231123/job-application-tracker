package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// --- helpers ---

func jsonBody(t *testing.T, v any) *bytes.Reader {
	t.Helper()
	b, err := json.Marshal(v)
	require.NoError(t, err)
	return bytes.NewReader(b)
}

func postJSON(r interface{ ServeHTTP(http.ResponseWriter, *http.Request) }, path string, body *bytes.Reader) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, path, body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func userRow(id uuid.UUID, name, email, password string) *sqlmock.Rows {
	return sqlmock.NewRows([]string{"id", "name", "email", "password", "created_at", "updated_at", "deleted_at"}).
		AddRow(id, name, email, password, time.Now(), time.Now(), nil)
}

// --- Register ---

func TestRegister_Success(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	// email check returns no rows (new user)
	mock.ExpectQuery(`SELECT \* FROM "users"`).
		WillReturnRows(sqlmock.NewRows(nil))
	// insert — UUID PK set in BeforeCreate, so GORM uses ExecContext not QueryContext
	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "users"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := postJSON(r, "/auth/register", jsonBody(t, map[string]string{
		"name": "jane doe", "email": "jane@example.com", "password": "password123",
	}))

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "Account created successfully", resp["message"])

	// name should be title-cased
	user := resp["user"].(map[string]any)
	assert.Equal(t, "Jane Doe", user["name"])

	require.NoError(t, mock.ExpectationsWereMet())
}

func TestRegister_MissingName(t *testing.T) {
	r := newRouter()
	w := postJSON(r, "/auth/register", jsonBody(t, map[string]string{
		"email": "x@x.com", "password": "pass123",
	}))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegister_InvalidEmail(t *testing.T) {
	r := newRouter()
	w := postJSON(r, "/auth/register", jsonBody(t, map[string]string{
		"name": "Bob", "email": "not-an-email", "password": "pass123",
	}))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegister_PasswordTooShort(t *testing.T) {
	r := newRouter()
	w := postJSON(r, "/auth/register", jsonBody(t, map[string]string{
		"name": "Bob", "email": "b@b.com", "password": "123",
	}))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegister_DuplicateEmail(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	// email check returns an existing user
	mock.ExpectQuery(`SELECT \* FROM "users"`).
		WillReturnRows(userRow(uuid.New(), "Existing", "exists@example.com", "hashed"))

	w := postJSON(r, "/auth/register", jsonBody(t, map[string]string{
		"name": "Someone", "email": "exists@example.com", "password": "password123",
	}))

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "already registered")
}

// --- Login ---

func TestLogin_Success(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	hashed, _ := bcrypt.GenerateFromPassword([]byte("mypassword"), bcrypt.DefaultCost)
	mock.ExpectQuery(`SELECT \* FROM "users"`).
		WillReturnRows(userRow(uuid.New(), "Test User", "user@example.com", string(hashed)))

	w := postJSON(r, "/auth/login", jsonBody(t, map[string]string{
		"email": "user@example.com", "password": "mypassword",
	}))

	assert.Equal(t, http.StatusOK, w.Code)

	// auth_token cookie must be set
	var found bool
	for _, c := range w.Result().Cookies() {
		if c.Name == "auth_token" {
			found = true
			assert.NotEmpty(t, c.Value)
		}
	}
	assert.True(t, found, "auth_token cookie should be set on login")
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestLogin_WrongPassword(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	hashed, _ := bcrypt.GenerateFromPassword([]byte("correctpass"), bcrypt.DefaultCost)
	mock.ExpectQuery(`SELECT \* FROM "users"`).
		WillReturnRows(userRow(uuid.New(), "User", "user@example.com", string(hashed)))

	w := postJSON(r, "/auth/login", jsonBody(t, map[string]string{
		"email": "user@example.com", "password": "wrongpass",
	}))

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLogin_UserNotFound(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectQuery(`SELECT \* FROM "users"`).
		WillReturnRows(sqlmock.NewRows(nil))

	w := postJSON(r, "/auth/login", jsonBody(t, map[string]string{
		"email": "ghost@example.com", "password": "anypass",
	}))

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLogin_MissingFields(t *testing.T) {
	r := newRouter()
	w := postJSON(r, "/auth/login", jsonBody(t, map[string]string{"email": "x@x.com"}))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// --- Logout ---

func TestLogout_ClearsCookie(t *testing.T) {
	r := newRouter()
	req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	for _, c := range w.Result().Cookies() {
		if c.Name == "auth_token" {
			assert.True(t, c.MaxAge < 0 || c.Value == "", "auth_token should be cleared")
		}
	}
}

// --- Me ---

func TestMe_ReturnsProfile(t *testing.T) {
	mock := newMockDB(t)
	r := newRouter()

	mock.ExpectQuery(`SELECT \* FROM "users"`).
		WillReturnRows(userRow(testUserID, "Test User", "test@example.com", "hashed"))

	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.AddCookie(authCookie(t))
	w := serve(r, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "test@example.com", resp["email"])
	assert.Equal(t, "Test User", resp["name"])
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestMe_Unauthenticated(t *testing.T) {
	r := newRouter()
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
