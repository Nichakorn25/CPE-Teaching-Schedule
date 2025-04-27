package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func ChangePasswordUser(c *gin.Context) {
	var request struct {
		ID uint `json:"id" binding:"required"` 
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ChangePassword ID is required"})
		return
	}

	var changePassword entity.ChangePassword
	if err := config.DB().First(&changePassword, request.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ChangePassword record not found"})
		return
	}

	if changePassword.StatusChangePasswordID != 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password change request already processed"})
		return
	}

	if changePassword.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password is empty in ChangePassword"})
		return
	}

	var user entity.User
	if err := config.DB().Where("username_id = ?", changePassword.UsernameID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Password = changePassword.Password
	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	changePassword.StatusChangePasswordID = 2
	if err := config.DB().Save(&changePassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ChangePassword status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated and status changed successfully"})
}

func CreateChangePassword(c *gin.Context) {
	var input struct {
		UsernameID string `binding:"required"`
		Password   string `binding:"required,min=4"`
		Email      string `binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if err := config.DB().Where("username_id = ?", input.UsernameID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้ที่มี UsernameID นี้ในระบบ"})
		return
	}

	var instructor entity.Instructor
	var admin entity.Admin
	emailMatched := false

	if err := config.DB().Where("user_id = ? AND email = ?", user.ID, input.Email).First(&instructor).Error; err == nil {
		emailMatched = true
	}

	if !emailMatched {
		if err := config.DB().Where("user_id = ? AND email = ?", user.ID, input.Email).First(&admin).Error; err == nil {
			emailMatched = true
		}
	}

	if !emailMatched {
		c.JSON(http.StatusBadRequest, gin.H{"error": "อีเมลไม่ตรงกับข้อมูลของผู้ใช้ในระบบ"})
		return
	}

	hashedPassword, err := config.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถแฮชรหัสผ่านได้"})
		return
	}

	var status entity.StatusChangePassword
	if err := config.DB().Where("status_name = ?", "ยังไม่ได้รับการอนุญาต").First(&status).Error; err != nil {
		if err := config.DB().Create(&entity.StatusChangePassword{
			StatusName: "ยังไม่ได้รับการอนุญาต",
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างสถานะคำร้องขอเปลี่ยนรหัสผ่านได้"})
			return
		}
		if err := config.DB().Where("status_name = ?", "ยังไม่ได้รับการอนุญาต").First(&status).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงสถานะที่สร้างขึ้นได้"})
			return
		}
	}

	changePassword := entity.ChangePassword{
		UsernameID:             input.UsernameID,
		Password:               hashedPassword,
		Email:                  input.Email,
		StatusChangePasswordID: status.ID,
	}

	if err := config.DB().Create(&changePassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างคำร้องขอเปลี่ยนรหัสผ่านได้"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":            "สร้างคำร้องขอเปลี่ยนรหัสผ่านสำเร็จ",
		"change_password_id": changePassword.ID,
		"status_change":      status.StatusName,
	})
}

func GetAllChangePassword(c *gin.Context) {
	var changePasswords []entity.ChangePassword

	err := config.DB().Preload("StatusChangePassword").Find(&changePasswords).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch change password records"})
		return
	}

	var results []gin.H

	for _, cp := range changePasswords {
		var user entity.User
		var instructor entity.Instructor

		if err := config.DB().Where("username_id = ?", cp.UsernameID).First(&user).Error; err != nil {
			continue
		}

		if err := config.DB().Where("user_id = ?", user.ID).First(&instructor).Error; err != nil {
			log.Printf("No instructor found for user ID: %d", user.ID)
			continue
		}

		result := gin.H{
			"ID":         cp.ID,
			"UsernameID": cp.UsernameID,
			"FirstName":  instructor.FirstName,
			"LastName":   instructor.LastName,
			"Email":      cp.Email,
			"StatusName": cp.StatusChangePassword.StatusName,
		}

		results = append(results, result)
	}

	c.JSON(http.StatusOK, results)
}

func GetChangePasswordByUsernameID(c *gin.Context) {
	usernameID := c.Param("usernameID")

	var changePassword entity.ChangePassword

	err := config.DB().Preload("StatusChangePassword").
		Where("username_id = ?", usernameID).
		First(&changePassword).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ChangePassword record not found"})
		return
	}

	var user entity.User
	err = config.DB().Where("username_id = ?", usernameID).First(&user).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var instructor entity.Instructor
	err = config.DB().Where("user_id = ?", user.ID).First(&instructor).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instructor not found"})
		return
	}

	response := gin.H{
		"FirstName": instructor.FirstName,
		"LastName":  instructor.LastName,
		"Email":     changePassword.Email,
		"Status":    changePassword.StatusChangePassword.StatusName,
	}

	c.JSON(http.StatusOK, response)
}
