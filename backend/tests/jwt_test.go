package tests

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"job-application-tracker/utils"
)

func TestGenerateToken_ReturnsNonEmptyToken(t *testing.T) {
	token, err := utils.GenerateToken(uuid.New(), "user@example.com", "my-secret", time.Hour)
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestGenerateToken_DifferentUsersProduceDifferentTokens(t *testing.T) {
	t1, _ := utils.GenerateToken(uuid.New(), "a@x.com", "secret", time.Hour)
	t2, _ := utils.GenerateToken(uuid.New(), "b@x.com", "secret", time.Hour)
	assert.NotEqual(t, t1, t2)
}

func TestGenerateToken_ClaimsContainCorrectUserIDAndEmail(t *testing.T) {
	id := uuid.New()
	token, err := utils.GenerateToken(id, "check@example.com", "secret", time.Hour)
	require.NoError(t, err)

	claims, err := utils.ValidateToken(token, "secret")
	require.NoError(t, err)
	assert.Equal(t, id, claims.UserID)
	assert.Equal(t, "check@example.com", claims.Email)
}

func TestValidateToken_ValidToken(t *testing.T) {
	id := uuid.New()
	token, err := utils.GenerateToken(id, "user@example.com", "my-secret", time.Hour)
	require.NoError(t, err)

	claims, err := utils.ValidateToken(token, "my-secret")
	require.NoError(t, err)
	assert.Equal(t, id, claims.UserID)
	assert.Equal(t, "user@example.com", claims.Email)
}

func TestValidateToken_WrongSecret(t *testing.T) {
	token, _ := utils.GenerateToken(uuid.New(), "u@x.com", "correct-secret", time.Hour)
	_, err := utils.ValidateToken(token, "wrong-secret")
	assert.Error(t, err)
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	token, _ := utils.GenerateToken(uuid.New(), "u@x.com", "secret", -time.Second)
	_, err := utils.ValidateToken(token, "secret")
	assert.Error(t, err)
}

func TestValidateToken_MalformedToken(t *testing.T) {
	_, err := utils.ValidateToken("not.a.valid.jwt.token", "secret")
	assert.Error(t, err)
}

func TestValidateToken_EmptyToken(t *testing.T) {
	_, err := utils.ValidateToken("", "secret")
	assert.Error(t, err)
}
