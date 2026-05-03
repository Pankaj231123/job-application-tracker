package main

import (
	"fmt"
	"log"

	"job-application-tracker/config"
	"job-application-tracker/database"
	"job-application-tracker/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg)

	router := gin.Default()
	routes.Setup(router, cfg)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server running on port %s", cfg.Port)
	if err := router.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
