package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Job struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID      `json:"user_id" gorm:"type:uuid;not null"`
	Company     string         `json:"company" gorm:"not null"`
	Title       string         `json:"title" gorm:"not null"`
	URL         string         `json:"url"`
	Location    string         `json:"location"`
	Salary      string         `json:"salary"`
	Status      string         `json:"status" gorm:"default:saved"`
	AppliedDate *time.Time     `json:"applied_date"`
	Deadline    *time.Time     `json:"deadline"`
	Notes       string         `json:"notes"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}
func (j *Job) BeforeCreate(tx *gorm.DB) error {
	j.ID = uuid.New()
	return nil
}