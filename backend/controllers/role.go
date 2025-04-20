package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type RoleController struct {
	DB *gorm.DB
}

// GetRoles - ดึง Role ทั้งหมด
func (ctl *RoleController) GetRoles(c *gin.Context) {
	var roles []entity.Role
	if err := ctl.DB.Preload("User").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, roles)
}

// GetRoleByID - ดึง Role จาก ID
func (ctl *RoleController) GetRoleByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var role entity.Role
	if err := ctl.DB.Preload("User").First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}
	c.JSON(http.StatusOK, role)
}

// CreateRole - สร้าง Role ใหม่
func (ctl *RoleController) CreateRole(c *gin.Context) {
	var input entity.Role
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

// UpdateRole - แก้ไข Role
func (ctl *RoleController) UpdateRole(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var role entity.Role
	if err := ctl.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	var input entity.Role
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role.Role = input.Role

	if err := ctl.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, role)
}

// DeleteRole - ลบ Role
func (ctl *RoleController) DeleteRole(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Role{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
