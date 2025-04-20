package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type UserController struct {
	DB *gorm.DB
}

// GetUsers - ดึงผู้ใช้ทั้งหมด
func (ctl *UserController) GetUsers(c *gin.Context) {
	var users []entity.User
	if err := ctl.DB.Preload("Role").Preload("Instructor").Preload("Admin").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

// GetUserByID - ดึงผู้ใช้จาก ID
func (ctl *UserController) GetUserByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var user entity.User
	if err := ctl.DB.Preload("Role").Preload("Instructor").Preload("Admin").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// CreateUser - สร้างผู้ใช้ใหม่
func (ctl *UserController) CreateUser(c *gin.Context) {
	var input entity.User
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

// UpdateUser - แก้ไขผู้ใช้
func (ctl *UserController) UpdateUser(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var user entity.User
	if err := ctl.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input entity.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตเฉพาะฟิลด์ที่จำเป็น
	user.UsernameID = input.UsernameID
	user.Password = input.Password
	user.RoleID = input.RoleID

	if err := ctl.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user)
}

// DeleteUser - ลบผู้ใช้
func (ctl *UserController) DeleteUser(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
