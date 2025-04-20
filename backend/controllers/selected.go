package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type SelectedController struct {
	DB *gorm.DB
}

// GetSelecteds - ดึงข้อมูล Selected ทั้งหมด
func (ctl *SelectedController) GetSelecteds(c *gin.Context) {
	var selecteds []entity.Selected
	if err := ctl.DB.
		Preload("Instructor").
		Preload("YearTerm").
		Preload("Subject").
		Preload("Lab").
		Preload("SelectedTA").
		Preload("Schedule").
		Find(&selecteds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, selecteds)
}

// GetSelectedByID - ดึงข้อมูล Selected ตาม ID
func (ctl *SelectedController) GetSelectedByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var selected entity.Selected
	if err := ctl.DB.
		Preload("Instructor").
		Preload("YearTerm").
		Preload("Subject").
		Preload("Lab").
		Preload("SelectedTA").
		Preload("Schedule").
		First(&selected, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Selected not found"})
		return
	}
	c.JSON(http.StatusOK, selected)
}

// CreateSelected - สร้าง Selected ใหม่
func (ctl *SelectedController) CreateSelected(c *gin.Context) {
	var input entity.Selected
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

// UpdateSelected - แก้ไข Selected
func (ctl *SelectedController) UpdateSelected(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var selected entity.Selected
	if err := ctl.DB.First(&selected, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Selected not found"})
		return
	}

	var input entity.Selected
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตฟิลด์ที่จำเป็น
	selected.Section = input.Section
	selected.Student = input.Student
	selected.InstructorID = input.InstructorID
	selected.YearTermID = input.YearTermID
	selected.SubjectID = input.SubjectID
	selected.LabID = input.LabID

	if err := ctl.DB.Save(&selected).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, selected)
}

// DeleteSelected - ลบ Selected
func (ctl *SelectedController) DeleteSelected(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Selected{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
