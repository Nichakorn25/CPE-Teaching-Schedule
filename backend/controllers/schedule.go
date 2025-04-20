package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type ScheduleController struct {
	DB *gorm.DB
}

// GetSchedules - ดึง Schedule ทั้งหมด
func (ctl *ScheduleController) GetSchedules(c *gin.Context) {
	var schedules []entity.Schedule
	if err := ctl.DB.Preload("YearTerm").Preload("Selected").Preload("Instructor").Preload("Day").Preload("Period").Find(&schedules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

// GetScheduleByID - ดึง Schedule จาก ID
func (ctl *ScheduleController) GetScheduleByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var schedule entity.Schedule
	if err := ctl.DB.Preload("YearTerm").Preload("Selected").Preload("Instructor").Preload("Day").Preload("Period").First(&schedule, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}
	c.JSON(http.StatusOK, schedule)
}

// CreateSchedule - สร้าง Schedule ใหม่
func (ctl *ScheduleController) CreateSchedule(c *gin.Context) {
	var input entity.Schedule
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := ctl.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

// UpdateSchedule - แก้ไข Schedule
func (ctl *ScheduleController) UpdateSchedule(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var schedule entity.Schedule
	if err := ctl.DB.First(&schedule, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}

	var input entity.Schedule
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	schedule.YearTermID = input.YearTermID
	schedule.SelectedID = input.SelectedID
	schedule.InstructorID = input.InstructorID
	schedule.DayID = input.DayID
	schedule.PeriodID = input.PeriodID

	if err := ctl.DB.Save(&schedule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, schedule)
}

// DeleteSchedule - ลบ Schedule
func (ctl *ScheduleController) DeleteSchedule(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Schedule{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
