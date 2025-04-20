package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type DayController struct {
	DB *gorm.DB
}

// GetDays - ดึง Day ทั้งหมด
func (ctl *DayController) GetDays(c *gin.Context) {
	var days []entity.Day
	if err := ctl.DB.Preload("Schedule").Preload("ServiceCenter").Preload("Condition").Find(&days).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, days)
}

// GetDayByID - ดึง Day จาก ID
func (ctl *DayController) GetDayByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var day entity.Day
	if err := ctl.DB.Preload("Schedule").Preload("ServiceCenter").Preload("Condition").First(&day, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Day not found"})
		return
	}
	c.JSON(http.StatusOK, day)
}

// CreateDay - สร้าง Day ใหม่
func (ctl *DayController) CreateDay(c *gin.Context) {
	var input entity.Day
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

// UpdateDay - แก้ไข Day
func (ctl *DayController) UpdateDay(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var day entity.Day
	if err := ctl.DB.First(&day, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Day not found"})
		return
	}

	var input entity.Day
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	day.Name = input.Name

	if err := ctl.DB.Save(&day).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, day)
}

// DeleteDay - ลบ Day
func (ctl *DayController) DeleteDay(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Day{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
