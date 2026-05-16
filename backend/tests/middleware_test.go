package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"job-application-tracker/middleware"
	"job-application-tracker/utils"
)

func middlewareRouter(secret string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", middleware.AuthMiddleware(secret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func TestAuthMiddleware_NoCookie(t *testing.T) {
	r := middlewareRouter("secret")
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	r := middlewareRouter("secret")
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "auth_token", Value: "garbage.token.value"})
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	token, _ := utils.GenerateToken(uuid.New(), "u@x.com", "secret", -time.Second)
	r := middlewareRouter("secret")
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	token, _ := utils.GenerateToken(uuid.New(), "u@x.com", "secret", time.Hour)
	r := middlewareRouter("secret")
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
	w := serve(r, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthMiddleware_WrongCookieName(t *testing.T) {
	token, _ := utils.GenerateToken(uuid.New(), "u@x.com", "secret", time.Hour)
	r := middlewareRouter("secret")
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: token}) // wrong name
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_TokenFromWrongSecret(t *testing.T) {
	token, _ := utils.GenerateToken(uuid.New(), "u@x.com", "other-secret", time.Hour)
	r := middlewareRouter("correct-secret")
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
	w := serve(r, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
