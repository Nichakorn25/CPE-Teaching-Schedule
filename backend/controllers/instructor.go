package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type InstructorController struct {
	DB *gorm.DB
}

// GetInstructors - ดึง Instructor ทั้งหมด
func (ctl *InstructorController) GetInstructors(c *gin.Context) {
	var instructors []entity.Instructor
	if err := ctl.DB.Preload("User").Preload("Position").Preload("Selected").Preload("Schedule").Preload("Condition").Find(&instructors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, instructors)
}

// GetInstructorByID - ดึง Instructor จาก ID
func (ctl *InstructorController) GetInstructorByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var instructor entity.Instructor
	if err := ctl.DB.Preload("User").Preload("Position").Preload("Selected").Preload("Schedule").Preload("Condition").First(&instructor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instructor not found"})
		return
	}
	c.JSON(http.StatusOK, instructor)
}

// CreateInstructor - สร้าง Instructor ใหม่
func (ctl *InstructorController) CreateInstructor(c *gin.Context) {
	var input entity.Instructor
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

// UpdateInstructor - แก้ไข Instructor
func (ctl *InstructorController) UpdateInstructor(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var instructor entity.Instructor
	if err := ctl.DB.First(&instructor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instructor not found"})
		return
	}

	var input entity.Instructor
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตเฉพาะฟิลด์ที่จำเป็น
	instructor.FirstName = input.FirstName
	instructor.LastName = input.LastName
	instructor.Email = input.Email
	instructor.Phone = input.Phone
	instructor.UserID = input.UserID
	instructor.PositionID = input.PositionID

	if err := ctl.DB.Save(&instructor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, instructor)
}

// DeleteInstructor - ลบ Instructor
func (ctl *InstructorController) DeleteInstructor(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Instructor{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
