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
	if err := router.SetTrustedProxies([]string{"127.0.0.1", "::1"}); err != nil {
		log.Printf("failed to set trusted proxies: %v", err)
	}
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			frontendOrigin := strings.TrimRight(cfg.FrontendURL, "/")
			return origin == frontendOrigin ||
				strings.HasPrefix(origin, "chrome-extension://") ||
				strings.HasPrefix(origin, "moz-extension://")
		},
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
