package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type ServiceCenterController struct {
	DB *gorm.DB
}

// GetServiceCenters - ดึง ServiceCenter ทั้งหมด
func (ctl *ServiceCenterController) GetServiceCenters(c *gin.Context) {
	var centers []entity.ServiceCenter
	if err := ctl.DB.
		Preload("Subject").
		Preload("Day").
		Preload("Period").
		Preload("Admin").
		Preload("YearTerm").
		Find(&centers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, centers)
}

// GetServiceCenterByID - ดึง ServiceCenter ตาม ID
func (ctl *ServiceCenterController) GetServiceCenterByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var center entity.ServiceCenter
	if err := ctl.DB.
		Preload("Subject").
		Preload("Day").
		Preload("Period").
		Preload("Admin").
		Preload("YearTerm").
		First(&center, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ServiceCenter not found"})
		return
	}
	c.JSON(http.StatusOK, center)
}

// CreateServiceCenter - สร้าง ServiceCenter ใหม่
func (ctl *ServiceCenterController) CreateServiceCenter(c *gin.Context) {
	var input entity.ServiceCenter
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

// UpdateServiceCenter - แก้ไขข้อมูล ServiceCenter
func (ctl *ServiceCenterController) UpdateServiceCenter(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var center entity.ServiceCenter
	if err := ctl.DB.First(&center, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ServiceCenter not found"})
		return
	}

	var input entity.ServiceCenter
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	center.SubjectID = input.SubjectID
	center.DayID = input.DayID
	center.PeriodID = input.PeriodID
	center.AdminID = input.AdminID
	center.YearTermID = input.YearTermID

	if err := ctl.DB.Save(&center).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, center)
}

// DeleteServiceCenter - ลบ ServiceCenter
func (ctl *ServiceCenterController) DeleteServiceCenter(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.ServiceCenter{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
