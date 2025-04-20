package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type SubjectTypeController struct {
	DB *gorm.DB
}

// GetSubjectTypes - ดึง SubjectType ทั้งหมด
func (ctl *SubjectTypeController) GetSubjectTypes(c *gin.Context) {
	var subjectTypes []entity.SubjectType
	if err := ctl.DB.Preload("Subject").Find(&subjectTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subjectTypes)
}

// GetSubjectTypeByID - ดึง SubjectType จาก ID
func (ctl *SubjectTypeController) GetSubjectTypeByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var subjectType entity.SubjectType
	if err := ctl.DB.Preload("Subject").First(&subjectType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SubjectType not found"})
		return
	}
	c.JSON(http.StatusOK, subjectType)
}

// CreateSubjectType - สร้าง SubjectType ใหม่
func (ctl *SubjectTypeController) CreateSubjectType(c *gin.Context) {
	var input entity.SubjectType
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

// UpdateSubjectType - แก้ไข SubjectType
func (ctl *SubjectTypeController) UpdateSubjectType(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var subjectType entity.SubjectType
	if err := ctl.DB.First(&subjectType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SubjectType not found"})
		return
	}

	var input entity.SubjectType
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subjectType.Name = input.Name

	if err := ctl.DB.Save(&subjectType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subjectType)
}

// DeleteSubjectType - ลบ SubjectType
func (ctl *SubjectTypeController) DeleteSubjectType(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.SubjectType{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
