package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type TeachingAssistantController struct {
	DB *gorm.DB
}

// GetTeachingAssistants - ดึงผู้ช่วยสอนทั้งหมด
func (ctl *TeachingAssistantController) GetTeachingAssistants(c *gin.Context) {
	var tas []entity.TeachingAssistant
	if err := ctl.DB.Preload("Status").Find(&tas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tas)
}

// GetTeachingAssistantByID - ดึงผู้ช่วยสอนตาม ID
func (ctl *TeachingAssistantController) GetTeachingAssistantByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var ta entity.TeachingAssistant
	if err := ctl.DB.Preload("Status").First(&ta, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teaching Assistant not found"})
		return
	}
	c.JSON(http.StatusOK, ta)
}

// CreateTeachingAssistant - สร้างผู้ช่วยสอนใหม่
func (ctl *TeachingAssistantController) CreateTeachingAssistant(c *gin.Context) {
	var input entity.TeachingAssistant
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

// UpdateTeachingAssistant - แก้ไขข้อมูลผู้ช่วยสอน
func (ctl *TeachingAssistantController) UpdateTeachingAssistant(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var ta entity.TeachingAssistant
	if err := ctl.DB.First(&ta, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teaching Assistant not found"})
		return
	}

	var input entity.TeachingAssistant
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ta.Name = input.Name
	ta.Nickname = input.Nickname
	ta.TotalHours = input.TotalHours
	ta.StatusID = input.StatusID

	if err := ctl.DB.Save(&ta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ta)
}

// DeleteTeachingAssistant - ลบผู้ช่วยสอน
func (ctl *TeachingAssistantController) DeleteTeachingAssistant(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.TeachingAssistant{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
