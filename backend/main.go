package main

import (
	"fmt"
	"log"
	"time"

	"job-application-tracker/config"
	"job-application-tracker/database"
	"job-application-tracker/handlers"
	"job-application-tracker/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	//connecty to database
	database.Connect(cfg)

	//set up Gin router
	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Job Tracker API is running",
		})
	})
		// Auth routes
	expiry, _ := time.ParseDuration(cfg.JWTExpiry)
	authHandler := &handlers.AuthHandler{
		JWTSecret: cfg.JWTSecret,
		JWTExpiry: expiry,
	}

	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}
	jobHandler := &handlers.JobHandler{}

protected := router.Group("/")
protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
{
    protected.GET("/me", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "user_id": c.MustGet("user_id"),
            "email":   c.MustGet("email"),
        })
    })

    // Job routes
    protected.POST("/jobs", jobHandler.CreateJob)
    protected.GET("/jobs", jobHandler.GetJobs)
    protected.GET("/jobs/:id", jobHandler.GetJob)
    protected.PUT("/jobs/:id", jobHandler.UpdateJob)
    protected.DELETE("/jobs/:id", jobHandler.DeleteJob)
    protected.GET("/dashboard", jobHandler.Dashboard)
}

	//start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server running on port %s", cfg.Port)
	if err := router.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}

}
