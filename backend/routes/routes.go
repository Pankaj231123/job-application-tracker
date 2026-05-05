package routes

import (
	"time"

	"job-application-tracker/config"
	"job-application-tracker/handlers"
	"job-application-tracker/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(router *gin.Engine, cfg *config.Config) {
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Job Tracker API is running",
		})
	})

	expiry, err := time.ParseDuration(cfg.JWTExpiry)
	if err != nil {
		expiry = 24 * time.Hour
	}

	authHandler := &handlers.AuthHandler{
		JWTSecret:    cfg.JWTSecret,
		JWTExpiry:    expiry,
		CookieDomain: cfg.CookieDomain,
	}

	auth := router.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)
	auth.POST("/logout", authHandler.Logout)

	jobHandler := &handlers.JobHandler{}
	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	protected.GET("/me", authHandler.Me)

	protected.POST("/jobs", jobHandler.CreateJob)
	protected.GET("/jobs", jobHandler.GetJobs)
	protected.POST("/jobs/sync", jobHandler.SyncJob)
	protected.GET("/jobs/:id", jobHandler.GetJob)
	protected.PUT("/jobs/:id", jobHandler.UpdateJob)
	protected.DELETE("/jobs/:id", jobHandler.DeleteJob)
	protected.GET("/dashboard", jobHandler.Dashboard)

	router.GET("/public/jobs/search", jobHandler.SearchPublicJobs)
}
