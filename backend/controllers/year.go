package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type YearController struct {
	DB *gorm.DB
}

// GetYears - ดึง Year ทั้งหมด
func (ctl *YearController) GetYears(c *gin.Context) {
	var years []entity.Year
	if err := ctl.DB.Preload("YearTerm").Find(&years).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, years)
}

// GetYearByID - ดึง Year ตาม ID
func (ctl *YearController) GetYearByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var year entity.Year
	if err := ctl.DB.Preload("YearTerm").First(&year, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Year not found"})
		return
	}
	c.JSON(http.StatusOK, year)
}

// CreateYear - สร้าง Year ใหม่
func (ctl *YearController) CreateYear(c *gin.Context) {
	var input entity.Year
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

// UpdateYear - แก้ไข Year
func (ctl *YearController) UpdateYear(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var year entity.Year
	if err := ctl.DB.First(&year, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Year not found"})
		return
	}

	var input entity.Year
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	year.Year = input.Year

	if err := ctl.DB.Save(&year).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, year)
}

// DeleteYear - ลบ Year
func (ctl *YearController) DeleteYear(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Year{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
