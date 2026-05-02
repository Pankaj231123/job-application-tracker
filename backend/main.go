package main

import (
	"fmt"
	"log"
	"time"

	"job-application-tracker/config"
	"job-application-tracker/database"
	"job-application-tracker/handlers"

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

	//start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server running on port %s", cfg.Port)
	if err := router.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}

}
