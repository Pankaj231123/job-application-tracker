package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"job-application-tracker/database"
	"job-application-tracker/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type JobHandler struct{}

type publicJob struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Company     string `json:"company"`
	Location    string `json:"location"`
	URL         string `json:"url"`
	Type        string `json:"type"`
	PublishedAt string `json:"published_at"`
	Source      string `json:"source"`
}

type jobInput struct {
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

func (input jobInput) normalizedStatus(defaultStatus string) string {
	status := strings.TrimSpace(input.Status)
	if status == "" {
		return defaultStatus
	}

	return status
}

func parseDateOrToday(dateStr string) *time.Time {
	if strings.TrimSpace(dateStr) != "" {
		if t, err := parseDate(dateStr); err == nil {
			return &t
		}
	}

	today, err := parseDate(time.Now().Format("2006-01-02"))
	if err != nil {
		now := time.Now()
		return &now
	}

	return &today
}

func applyJobPayload(job *models.Job, input jobInput, defaultStatus string, forceAppliedDate bool) {
	if strings.TrimSpace(input.Company) != "" {
		job.Company = strings.TrimSpace(input.Company)
	}
	if strings.TrimSpace(input.Title) != "" {
		job.Title = strings.TrimSpace(input.Title)
	}
	if strings.TrimSpace(input.URL) != "" {
		job.URL = strings.TrimSpace(input.URL)
	}
	if strings.TrimSpace(input.Location) != "" {
		job.Location = strings.TrimSpace(input.Location)
	}
	if strings.TrimSpace(input.Salary) != "" {
		job.Salary = strings.TrimSpace(input.Salary)
	}
	job.Status = input.normalizedStatus(defaultStatus)
	if strings.TrimSpace(input.Notes) != "" {
		job.Notes = strings.TrimSpace(input.Notes)
	}

	if forceAppliedDate {
		job.AppliedDate = parseDateOrToday(input.AppliedDate)
	} else if strings.TrimSpace(input.AppliedDate) != "" {
		if t, err := parseDate(input.AppliedDate); err == nil {
			job.AppliedDate = &t
		}
	}

	if strings.TrimSpace(input.Deadline) != "" {
		if t, err := parseDate(input.Deadline); err == nil {
			job.Deadline = &t
		}
	}
}

func findSyncedJob(userID uuid.UUID, input jobInput) (*models.Job, error) {
	trimmedURL := strings.TrimSpace(input.URL)
	if trimmedURL != "" {
		var job models.Job
		if err := database.DB.Where("user_id = ? AND url = ?", userID, trimmedURL).First(&job).Error; err == nil {
			return &job, nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	trimmedCompany := strings.TrimSpace(input.Company)
	trimmedTitle := strings.TrimSpace(input.Title)
	if trimmedCompany != "" && trimmedTitle != "" {
		var job models.Job
		if err := database.DB.
			Where("user_id = ? AND LOWER(company) = LOWER(?) AND LOWER(title) = LOWER(?)", userID, trimmedCompany, trimmedTitle).
			First(&job).Error; err == nil {
			return &job, nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	return nil, gorm.ErrRecordNotFound
}

// Add new job
func (h *JobHandler) CreateJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var input jobInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if strings.TrimSpace(input.Company) == "" || strings.TrimSpace(input.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company and title are required"})
		return
	}

	job := models.Job{
		UserID: userID,
	}
	applyJobPayload(&job, input, "saved", false)

	if err := database.DB.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Job added successfully",
		"job":     job,
	})
}

// Sync a LinkedIn application into the tracker
func (h *JobHandler) SyncJob(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var input jobInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if strings.TrimSpace(input.URL) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Job URL is required for sync"})
		return
	}

	job, err := findSyncedJob(userID, input)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync job"})
		return
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		newJob := models.Job{UserID: userID}
		applyJobPayload(&newJob, input, "applied", true)

		if newJob.Company == "" {
			newJob.Company = "LinkedIn"
		}
		if newJob.Title == "" {
			newJob.Title = "Applied Job"
		}

		if err := database.DB.Create(&newJob).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync job"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Job synced successfully",
			"job":     newJob,
			"created": true,
		})
		return
	}

	applyJobPayload(job, input, "applied", true)
	if job.Company == "" {
		job.Company = "LinkedIn"
	}
	if job.Title == "" {
		job.Title = "Applied Job"
	}

	if err := database.DB.Save(job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Job synced successfully",
		"job":     job,
		"created": false,
	})
}

// Search public jobs from the web
func (h *JobHandler) SearchPublicJobs(c *gin.Context) {
	query := strings.TrimSpace(c.Query("query"))

	client := &http.Client{Timeout: 15 * time.Second}
	searchable := strings.ToLower(query)
	publicJobs := make([]publicJob, 0, 30)
	featuredJobs := make([]publicJob, 0, 30)

	for page := 1; page <= 4; page++ {
		endpoint := fmt.Sprintf("https://www.arbeitnow.com/api/job-board-api?page=%d", page)
		request, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err != nil {
			continue
		}
		request.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
		request.Header.Set("Accept", "application/json,text/plain,*/*")

		response, err := client.Do(request)
		if err != nil {
			continue
		}

		if response.StatusCode != http.StatusOK {
			io.Copy(io.Discard, response.Body)
			response.Body.Close()
			continue
		}

		var payload struct {
			Data []struct {
				Slug        string   `json:"slug"`
				CompanyName string   `json:"company_name"`
				Title       string   `json:"title"`
				Description string   `json:"description"`
				Location    string   `json:"location"`
				Remote      bool     `json:"remote"`
				JobTypes    []string `json:"job_types"`
				CreatedAt   string   `json:"created_at"`
				URL         string   `json:"url"`
				Tags        []string `json:"tags"`
			} `json:"data"`
		}

		if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
			io.Copy(io.Discard, response.Body)
			response.Body.Close()
			continue
		}
		response.Body.Close()

		for _, job := range payload.Data {
			haystack := strings.ToLower(strings.Join([]string{job.Title, job.CompanyName, job.Description, job.Location, strings.Join(job.Tags, " ")}, " "))
			matchesQuery := searchable == "" || strings.Contains(haystack, searchable)

			jobType := strings.Join(job.JobTypes, ", ")
			if jobType == "" && job.Remote {
				jobType = "Remote"
			}

			location := job.Location
			if location == "" && job.Remote {
				location = "Remote"
			}

			featuredJob := publicJob{
				ID:          fmt.Sprintf("arbeitnow-%s", job.Slug),
				Title:       job.Title,
				Company:     job.CompanyName,
				Location:    location,
				URL:         job.URL,
				Type:        jobType,
				PublishedAt: job.CreatedAt,
				Source:      "Arbeitnow",
			}

			if len(featuredJobs) < 40 {
				featuredJobs = append(featuredJobs, featuredJob)
			}

			if matchesQuery && len(publicJobs) < 40 {
				publicJobs = append(publicJobs, featuredJob)
			}

			if len(featuredJobs) >= 40 && len(publicJobs) >= 40 {
				break
			}
		}

		if len(featuredJobs) >= 40 && len(publicJobs) >= 40 {
			break
		}
	}

	if query != "" && len(publicJobs) == 0 {
		publicJobs = featuredJobs
	}

	if query == "" {
		publicJobs = featuredJobs
	}

	c.JSON(http.StatusOK, gin.H{
		"query": query,
		"total": len(publicJobs),
		"jobs":  publicJobs,
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
