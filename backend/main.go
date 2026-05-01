package main

import (
	"fmt"
	"log"

	"job-application-tracker/config"
	"job-application-tracker/database"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	//connecty to database
	database.Connect(cfg)

	//set up Gin router
	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Job Tracker API is running",
		})
	})

	//start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server running on port %s", cfg.Port)
	if err := router.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}

}
