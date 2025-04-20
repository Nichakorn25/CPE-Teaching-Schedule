package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type AdminController struct {
	DB *gorm.DB
}

// GetAdmins - ดึงแอดมินทั้งหมด
func (ctl *AdminController) GetAdmins(c *gin.Context) {
	var admins []entity.Admin
	if err := ctl.DB.Preload("User").Preload("ServiceCenter").Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, admins)
}

// GetAdminByID - ดึงแอดมินจาก ID
func (ctl *AdminController) GetAdminByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var admin entity.Admin
	if err := ctl.DB.Preload("User").Preload("ServiceCenter").First(&admin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
		return
	}
	c.JSON(http.StatusOK, admin)
}

// CreateAdmin - สร้างแอดมินใหม่
func (ctl *AdminController) CreateAdmin(c *gin.Context) {
	var input entity.Admin
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

// UpdateAdmin - แก้ไขแอดมิน
func (ctl *AdminController) UpdateAdmin(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var admin entity.Admin
	if err := ctl.DB.First(&admin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
		return
	}

	var input entity.Admin
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตเฉพาะฟิลด์ที่จำเป็น
	admin.FirstName = input.FirstName
	admin.LastName = input.LastName
	admin.Email = input.Email
	admin.Phone = input.Phone
	admin.UserID = input.UserID

	if err := ctl.DB.Save(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, admin)
}

// DeleteAdmin - ลบแอดมิน
func (ctl *AdminController) DeleteAdmin(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Admin{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
