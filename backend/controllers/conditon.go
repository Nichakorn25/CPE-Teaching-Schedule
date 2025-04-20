package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type ConditionController struct {
	DB *gorm.DB
}

// GetConditions - ดึง Condition ทั้งหมด
func (ctl *ConditionController) GetConditions(c *gin.Context) {
	var conditions []entity.Condition
	if err := ctl.DB.Preload("Instructor").Preload("Day").Preload("Period").Find(&conditions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conditions)
}

// GetConditionByID - ดึง Condition จาก ID
func (ctl *ConditionController) GetConditionByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var condition entity.Condition
	if err := ctl.DB.Preload("Instructor").Preload("Day").Preload("Period").First(&condition, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Condition not found"})
		return
	}
	c.JSON(http.StatusOK, condition)
}

// CreateCondition - สร้าง Condition ใหม่
func (ctl *ConditionController) CreateCondition(c *gin.Context) {
	var input entity.Condition
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

// UpdateCondition - แก้ไข Condition
func (ctl *ConditionController) UpdateCondition(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var condition entity.Condition
	if err := ctl.DB.First(&condition, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Condition not found"})
		return
	}

	var input entity.Condition
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	condition.InstructorID = input.InstructorID
	condition.DayID = input.DayID
	condition.PeriodID = input.PeriodID

	if err := ctl.DB.Save(&condition).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, condition)
}

// DeleteCondition - ลบ Condition
func (ctl *ConditionController) DeleteCondition(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Condition{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
