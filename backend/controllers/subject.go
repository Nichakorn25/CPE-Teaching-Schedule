package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type SubjectController struct {
	DB *gorm.DB
}

// GetSubjects - ดึง Subject ทั้งหมด
func (ctl *SubjectController) GetSubjects(c *gin.Context) {
	var subjects []entity.Subject
	if err := ctl.DB.
		Preload("GradeCurriculum").
		Preload("Major").
		Preload("Unit").
		Preload("SubjectType").
		Preload("Selected").
		Preload("ServiceCenter").
		Find(&subjects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subjects)
}

// GetSubjectByID - ดึง Subject ตาม ID
func (ctl *SubjectController) GetSubjectByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var subject entity.Subject
	if err := ctl.DB.
		Preload("GradeCurriculum").
		Preload("Major").
		Preload("Unit").
		Preload("SubjectType").
		Preload("Selected").
		Preload("ServiceCenter").
		First(&subject, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
		return
	}
	c.JSON(http.StatusOK, subject)
}

// CreateSubject - สร้าง Subject ใหม่
func (ctl *SubjectController) CreateSubject(c *gin.Context) {
	var input entity.Subject
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

// UpdateSubject - แก้ไขข้อมูล Subject
func (ctl *SubjectController) UpdateSubject(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var subject entity.Subject
	if err := ctl.DB.First(&subject, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
		return
	}

	var input entity.Subject
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตฟิลด์ที่จำเป็น
	subject.Name = input.Name
	subject.GradeCurriculumID = input.GradeCurriculumID
	subject.MajorID = input.MajorID
	subject.UnitID = input.UnitID
	subject.SubjectTypeID = input.SubjectTypeID

	if err := ctl.DB.Save(&subject).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subject)
}

// DeleteSubject - ลบ Subject
func (ctl *SubjectController) DeleteSubject(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Subject{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
