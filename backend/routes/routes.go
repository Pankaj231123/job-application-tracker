package routes

import (
	"net/http"
	"time"

	"job-application-tracker/config"
	"job-application-tracker/handlers"
	"job-application-tracker/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(router *gin.Engine, cfg *config.Config) {
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Job Tracker API is running",
		})
	})

	expiry, err := time.ParseDuration(cfg.JWTExpiry)
	if err != nil {
		expiry = 24 * time.Hour
	}

	authHandler := &handlers.AuthHandler{
		JWTSecret: cfg.JWTSecret,
		JWTExpiry: expiry,
	}

	auth := router.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)
	auth.POST("/logout", authHandler.Logout)

	jobHandler := &handlers.JobHandler{}
	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	protected.GET("/me", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"user_id": c.MustGet("user_id"),
			"email":   c.MustGet("email"),
		})
	})

	protected.POST("/jobs", jobHandler.CreateJob)
	protected.GET("/jobs", jobHandler.GetJobs)
	protected.POST("/jobs/sync", jobHandler.SyncJob)
	protected.GET("/jobs/:id", jobHandler.GetJob)
	protected.PUT("/jobs/:id", jobHandler.UpdateJob)
	protected.DELETE("/jobs/:id", jobHandler.DeleteJob)
	protected.GET("/dashboard", jobHandler.Dashboard)

	router.GET("/public/jobs/search", jobHandler.SearchPublicJobs)
}
