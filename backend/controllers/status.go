package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type StatusController struct {
	DB *gorm.DB
}

// GetStatuses - ดึง Status ทั้งหมด
func (ctl *StatusController) GetStatuses(c *gin.Context) {
	var statuses []entity.Status
	if err := ctl.DB.Preload("TA").Find(&statuses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, statuses)
}

// GetStatusByID - ดึง Status จาก ID
func (ctl *StatusController) GetStatusByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var status entity.Status
	if err := ctl.DB.Preload("TA").First(&status, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Status not found"})
		return
	}
	c.JSON(http.StatusOK, status)
}

// CreateStatus - สร้าง Status ใหม่
func (ctl *StatusController) CreateStatus(c *gin.Context) {
	var input entity.Status
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

// UpdateStatus - แก้ไข Status
func (ctl *StatusController) UpdateStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var status entity.Status
	if err := ctl.DB.First(&status, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Status not found"})
		return
	}

	var input entity.Status
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status.Status = input.Status

	if err := ctl.DB.Save(&status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, status)
}

// DeleteStatus - ลบ Status
func (ctl *StatusController) DeleteStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Status{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
