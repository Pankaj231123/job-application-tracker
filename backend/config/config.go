package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	FrontendURL  string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBSSL        string
	DBTimezone   string
	JWTSecret    string
	JWTExpiry    string
	CookieDomain string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	return &Config{
		Port:         getEnv("PORT", "8080"),
		FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:5173"),
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBUser:       getEnv("DB_USER", ""),
		DBPassword:   getEnv("DB_PASSWORD", ""),
		DBName:       getEnv("DB_NAME", "job_tracker"),
		DBSSL:        getEnv("DB_SSL", "disable"),
		DBTimezone:   getEnv("DB_TIMEZONE", "UTC"),
		JWTSecret:    jwtSecret,
		JWTExpiry:    getEnv("JWT_EXPIRY", "24h"),
		CookieDomain: getEnv("COOKIE_DOMAIN", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
