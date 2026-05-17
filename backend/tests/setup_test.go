package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"job-application-tracker/database"
	"job-application-tracker/handlers"
	"job-application-tracker/middleware"
	"job-application-tracker/utils"
)

const testSecret = "test-jwt-secret-key-min-32-chars!!"

var testUserID = uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")

// newMockDB wires a go-sqlmock connection into the global database.DB.
func newMockDB(t *testing.T) sqlmock.Sqlmock {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	gormDB, err := gorm.Open(postgres.New(postgres.Config{
		Conn:                 db,
		PreferSimpleProtocol: true,
	}), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("gorm.Open: %v", err)
	}
	database.DB = gormDB
	t.Cleanup(func() { db.Close() })
	return mock
}

// newRouter builds a test Gin engine mirroring production routes.
func newRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	authH := &handlers.AuthHandler{
		JWTSecret:    testSecret,
		JWTExpiry:    time.Hour,
		CookieDomain: "",
	}
	jobH := &handlers.JobHandler{}

	auth := r.Group("/auth")
	auth.POST("/register", authH.Register)
	auth.POST("/login", authH.Login)
	auth.POST("/logout", authH.Logout)

	api := r.Group("/")
	api.Use(middleware.AuthMiddleware(testSecret))
	api.GET("/me", authH.Me)
	api.POST("/jobs", jobH.CreateJob)
	api.GET("/jobs", jobH.GetJobs)
	api.GET("/jobs/:id", jobH.GetJob)
	api.PUT("/jobs/:id", jobH.UpdateJob)
	api.DELETE("/jobs/:id", jobH.DeleteJob)
	api.GET("/dashboard", jobH.Dashboard)

	return r
}

// authCookie generates a valid JWT cookie for testUserID.
func authCookie(t *testing.T) *http.Cookie {
	t.Helper()
	token, err := utils.GenerateToken(testUserID, "test@example.com", testSecret, time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}
	return &http.Cookie{Name: "auth_token", Value: token}
}

// serve fires req through the router and returns the recorded response.
func serve(r *gin.Engine, req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}
