package handlers

import (
	"fmt"
	"net/http"
	"time"

	"job-application-tracker/database"
	"job-application-tracker/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type JobHandler struct{}

// Add new job
func (h *JobHandler) CreateJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var input struct {
		Company     string `json:"company" binding:"required"`
		Title       string `json:"title" binding:"required"`
		URL         string `json:"url"`
		Location    string `json:"location"`
		Salary      string `json:"salary"`
		Status      string `json:"status"`
		AppliedDate string `json:"applied_date"`
		Deadline    string `json:"deadline"`
		Notes       string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job := models.Job{
		UserID:   userID,
		Company:  input.Company,
		Title:    input.Title,
		URL:      input.URL,
		Location: input.Location,
		Salary:   input.Salary,
		Status:   input.Status,
		Notes:    input.Notes,
	}

	// Parse dates if provided
	if input.AppliedDate != "" {
		if t, err := parseDate(input.AppliedDate); err == nil {
			job.AppliedDate = &t
		}
	}
	if input.Deadline != "" {
		if t, err := parseDate(input.Deadline); err == nil {
			job.Deadline = &t
		}
	}

	if job.Status == "" {
		job.Status = "saved"
	}

	if err := database.DB.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Job added successfully",
		"job":     job,
	})
}

// Get all jobs for logged in user
func (h *JobHandler) GetJobs(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	// Optional filter by status
	status := c.Query("status")

	var jobs []models.Job
	query := database.DB.Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at desc").Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch jobs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total": len(jobs),
		"jobs":  jobs,
	})
}

// Get single job
func (h *JobHandler) GetJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	jobID := c.Param("id")

	var job models.Job
	if err := database.DB.Where("id = ? AND user_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"job": job})
}

// Update job
func (h *JobHandler) UpdateJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	jobID := c.Param("id")

	var job models.Job
	if err := database.DB.Where("id = ? AND user_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	var input struct {
		Company     string `json:"company"`
		Title       string `json:"title"`
		URL         string `json:"url"`
		Location    string `json:"location"`
		Salary      string `json:"salary"`
		Status      string `json:"status"`
		AppliedDate string `json:"applied_date"`
		Deadline    string `json:"deadline"`
		Notes       string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if input.Company != "" {
		job.Company = input.Company
	}
	if input.Title != "" {
		job.Title = input.Title
	}
	if input.URL != "" {
		job.URL = input.URL
	}
	if input.Location != "" {
		job.Location = input.Location
	}
	if input.Salary != "" {
		job.Salary = input.Salary
	}
	if input.Status != "" {
		job.Status = input.Status
	}
	if input.Notes != "" {
		job.Notes = input.Notes
	}
	if input.AppliedDate != "" {
		if t, err := parseDate(input.AppliedDate); err == nil {
			job.AppliedDate = &t
		}
	}
	if input.Deadline != "" {
		if t, err := parseDate(input.Deadline); err == nil {
			job.Deadline = &t
		}
	}

	if err := database.DB.Save(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Job updated successfully",
		"job":     job,
	})
}

// Delete job
func (h *JobHandler) DeleteJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	jobID := c.Param("id")

	var job models.Job
	if err := database.DB.Where("id = ? AND user_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	if err := database.DB.Delete(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Job deleted successfully"})
}

// Dashboard stats
func (h *JobHandler) Dashboard(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var total int64
	database.DB.Model(&models.Job{}).Where("user_id = ?", userID).Count(&total)

	statuses := []string{"saved", "applied", "interview", "technical", "offer", "rejected", "ghosted"}
	counts := make(map[string]int64)

	for _, status := range statuses {
		var count int64
		database.DB.Model(&models.Job{}).
			Where("user_id = ? AND status = ?", userID, status).
			Count(&count)
		counts[status] = count
	}

	c.JSON(http.StatusOK, gin.H{
		"total":     total,
		"by_status": counts,
	})
}

// Helper — parse date string
func parseDate(dateStr string) (time.Time, error) {
	layouts := []string{"2006-01-02", "02-01-2006", "01/02/2006"}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, dateStr); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("invalid date format")
}
