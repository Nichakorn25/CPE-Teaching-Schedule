package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type CurriculumController struct {
	DB *gorm.DB
}

// GetCurriculums - ดึง Curriculum ทั้งหมด
func (ctl *CurriculumController) GetCurriculums(c *gin.Context) {
	var curriculums []entity.Curriculum
	if err := ctl.DB.Preload("Major").Preload("GradeCurriculum").Find(&curriculums).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, curriculums)
}

// GetCurriculumByID - ดึง Curriculum จาก ID
func (ctl *CurriculumController) GetCurriculumByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var curriculum entity.Curriculum
	if err := ctl.DB.Preload("Major").Preload("GradeCurriculum").First(&curriculum, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curriculum not found"})
		return
	}
	c.JSON(http.StatusOK, curriculum)
}

// CreateCurriculum - สร้าง Curriculum ใหม่
func (ctl *CurriculumController) CreateCurriculum(c *gin.Context) {
	var input entity.Curriculum
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

// UpdateCurriculum - แก้ไข Curriculum
func (ctl *CurriculumController) UpdateCurriculum(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var curriculum entity.Curriculum
	if err := ctl.DB.First(&curriculum, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curriculum not found"})
		return
	}

	var input entity.Curriculum
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	curriculum.Name = input.Name
	curriculum.Year = input.Year
	curriculum.Started = input.Started
	curriculum.MajorID = input.MajorID

	if err := ctl.DB.Save(&curriculum).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, curriculum)
}

// DeleteCurriculum - ลบ Curriculum
func (ctl *CurriculumController) DeleteCurriculum(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Curriculum{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
