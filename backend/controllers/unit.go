package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type UnitController struct {
	DB *gorm.DB
}

// GetUnits - ดึง Unit ทั้งหมด
func (ctl *UnitController) GetUnits(c *gin.Context) {
	var units []entity.Unit
	if err := ctl.DB.Preload("Subject").Find(&units).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, units)
}

// GetUnitByID - ดึง Unit ตาม ID
func (ctl *UnitController) GetUnitByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var unit entity.Unit
	if err := ctl.DB.Preload("Subject").First(&unit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}
	c.JSON(http.StatusOK, unit)
}

// CreateUnit - สร้าง Unit ใหม่
func (ctl *UnitController) CreateUnit(c *gin.Context) {
	var input entity.Unit
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

// UpdateUnit - แก้ไข Unit
func (ctl *UnitController) UpdateUnit(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var unit entity.Unit
	if err := ctl.DB.First(&unit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	var input entity.Unit
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตฟิลด์ที่จำเป็น
	unit.Unit = input.Unit
	unit.Lectrue = input.Lectrue
	unit.Lab = input.Lab
	unit.SelfStudy = input.SelfStudy

	if err := ctl.DB.Save(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, unit)
}

// DeleteUnit - ลบ Unit
func (ctl *UnitController) DeleteUnit(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Unit{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
