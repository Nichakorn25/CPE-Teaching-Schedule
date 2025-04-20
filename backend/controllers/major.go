package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type MajorController struct {
	DB *gorm.DB
}

// GetMajors - ดึง Major ทั้งหมด
func (ctl *MajorController) GetMajors(c *gin.Context) {
	var majors []entity.Major
	if err := ctl.DB.Preload("Curriculum").Preload("Subject").Find(&majors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, majors)
}

// GetMajorByID - ดึง Major จาก ID
func (ctl *MajorController) GetMajorByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var major entity.Major
	if err := ctl.DB.Preload("Curriculum").Preload("Subject").First(&major, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Major not found"})
		return
	}
	c.JSON(http.StatusOK, major)
}

// CreateMajor - สร้าง Major ใหม่
func (ctl *MajorController) CreateMajor(c *gin.Context) {
	var input entity.Major
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

// UpdateMajor - แก้ไข Major
func (ctl *MajorController) UpdateMajor(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var major entity.Major
	if err := ctl.DB.First(&major, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Major not found"})
		return
	}

	var input entity.Major
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	major.Name = input.Name

	if err := ctl.DB.Save(&major).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, major)
}

// DeleteMajor - ลบ Major
func (ctl *MajorController) DeleteMajor(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Major{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
