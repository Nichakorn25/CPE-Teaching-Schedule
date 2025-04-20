package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type SelectedTAController struct {
	DB *gorm.DB
}

// GetSelectedTAs - ดึง SelectedTA ทั้งหมด
func (ctl *SelectedTAController) GetSelectedTAs(c *gin.Context) {
	var selectedTAs []entity.SelectedTA
	if err := ctl.DB.Preload("Selected").Preload("TA").Find(&selectedTAs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, selectedTAs)
}

// GetSelectedTAByID - ดึง SelectedTA จาก ID
func (ctl *SelectedTAController) GetSelectedTAByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var selectedTA entity.SelectedTA
	if err := ctl.DB.Preload("Selected").Preload("TA").First(&selectedTA, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SelectedTA not found"})
		return
	}
	c.JSON(http.StatusOK, selectedTA)
}

// CreateSelectedTA - สร้าง SelectedTA ใหม่
func (ctl *SelectedTAController) CreateSelectedTA(c *gin.Context) {
	var input entity.SelectedTA
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

// UpdateSelectedTA - แก้ไข SelectedTA
func (ctl *SelectedTAController) UpdateSelectedTA(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var selectedTA entity.SelectedTA
	if err := ctl.DB.First(&selectedTA, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SelectedTA not found"})
		return
	}

	var input entity.SelectedTA
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	selectedTA.TeachingHours = input.TeachingHours
	selectedTA.SelectedID = input.SelectedID
	selectedTA.TAID = input.TAID

	if err := ctl.DB.Save(&selectedTA).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, selectedTA)
}

// DeleteSelectedTA - ลบ SelectedTA
func (ctl *SelectedTAController) DeleteSelectedTA(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.SelectedTA{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
