package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type PeriodController struct {
	DB *gorm.DB
}

// GetPeriods - ดึง Period ทั้งหมด
func (ctl *PeriodController) GetPeriods(c *gin.Context) {
	var periods []entity.Period
	if err := ctl.DB.Preload("Schedule").Preload("ServiceCenter").Preload("Condition").Find(&periods).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, periods)
}

// GetPeriodByID - ดึง Period จาก ID
func (ctl *PeriodController) GetPeriodByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var period entity.Period
	if err := ctl.DB.Preload("Schedule").Preload("ServiceCenter").Preload("Condition").First(&period, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Period not found"})
		return
	}
	c.JSON(http.StatusOK, period)
}

// CreatePeriod - สร้าง Period ใหม่
func (ctl *PeriodController) CreatePeriod(c *gin.Context) {
	var input entity.Period
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

// UpdatePeriod - แก้ไข Period
func (ctl *PeriodController) UpdatePeriod(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var period entity.Period
	if err := ctl.DB.First(&period, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Period not found"})
		return
	}

	var input entity.Period
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตข้อมูล
	period.Period = input.Period
	period.Start = input.Start
	period.End = input.End

	if err := ctl.DB.Save(&period).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, period)
}

// DeletePeriod - ลบ Period
func (ctl *PeriodController) DeletePeriod(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Period{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
