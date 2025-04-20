package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type LabController struct {
	DB *gorm.DB
}

// GetLabs - ดึง Lab ทั้งหมด
func (ctl *LabController) GetLabs(c *gin.Context) {
	var labs []entity.Lab
	if err := ctl.DB.Preload("Selected").Find(&labs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, labs)
}

// GetLabByID - ดึง Lab จาก ID
func (ctl *LabController) GetLabByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var lab entity.Lab
	if err := ctl.DB.Preload("Selected").First(&lab, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lab not found"})
		return
	}
	c.JSON(http.StatusOK, lab)
}

// CreateLab - สร้าง Lab ใหม่
func (ctl *LabController) CreateLab(c *gin.Context) {
	var input entity.Lab
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

// UpdateLab - แก้ไข Lab
func (ctl *LabController) UpdateLab(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var lab entity.Lab
	if err := ctl.DB.First(&lab, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lab not found"})
		return
	}

	var input entity.Lab
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตเฉพาะฟิลด์ที่จำเป็น
	lab.Section = input.Section
	lab.Student = input.Student

	if err := ctl.DB.Save(&lab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, lab)
}

// DeleteLab - ลบ Lab
func (ctl *LabController) DeleteLab(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Lab{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
