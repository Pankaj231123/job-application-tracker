package main

import (
	"fmt"
	"log"
	"strings"

	"job-application-tracker/config"
	"job-application-tracker/database"
	"job-application-tracker/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{strings.TrimRight(cfg.FrontendURL, "/")},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	routes.Setup(router, cfg)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server running on port %s", cfg.Port)
	if err := router.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
