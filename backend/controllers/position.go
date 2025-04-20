package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type PositionController struct {
	DB *gorm.DB
}

// GetPositions - ดึง Position ทั้งหมด
func (ctl *PositionController) GetPositions(c *gin.Context) {
	var positions []entity.Position
	if err := ctl.DB.Preload("Instructor").Find(&positions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, positions)
}

// GetPositionByID - ดึง Position จาก ID
func (ctl *PositionController) GetPositionByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var position entity.Position
	if err := ctl.DB.Preload("Instructor").First(&position, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Position not found"})
		return
	}
	c.JSON(http.StatusOK, position)
}

// CreatePosition - สร้าง Position ใหม่
func (ctl *PositionController) CreatePosition(c *gin.Context) {
	var input entity.Position
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

// UpdatePosition - แก้ไข Position
func (ctl *PositionController) UpdatePosition(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var position entity.Position
	if err := ctl.DB.First(&position, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Position not found"})
		return
	}

	var input entity.Position
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	position.Position = input.Position
	position.Priority = input.Priority

	if err := ctl.DB.Save(&position).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, position)
}

// DeletePosition - ลบ Position
func (ctl *PositionController) DeletePosition(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Position{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
