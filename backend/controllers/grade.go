package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type GradeController struct {
	DB *gorm.DB
}

// GetGrades - ดึง Grade ทั้งหมด
func (ctl *GradeController) GetGrades(c *gin.Context) {
	var grades []entity.Grade
	if err := ctl.DB.Preload("GradeCurriculum").Find(&grades).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, grades)
}

// GetGradeByID - ดึง Grade จาก ID
func (ctl *GradeController) GetGradeByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var grade entity.Grade
	if err := ctl.DB.Preload("GradeCurriculum").First(&grade, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grade not found"})
		return
	}
	c.JSON(http.StatusOK, grade)
}

// CreateGrade - สร้าง Grade ใหม่
func (ctl *GradeController) CreateGrade(c *gin.Context) {
	var input entity.Grade
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

// UpdateGrade - แก้ไข Grade
func (ctl *GradeController) UpdateGrade(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var grade entity.Grade
	if err := ctl.DB.First(&grade, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grade not found"})
		return
	}

	var input entity.Grade
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	grade.Grade = input.Grade

	if err := ctl.DB.Save(&grade).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, grade)
}

// DeleteGrade - ลบ Grade
func (ctl *GradeController) DeleteGrade(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Grade{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
