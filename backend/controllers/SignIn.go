package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"golang.org/x/crypto/bcrypt"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/services"
)

type (
	Authen struct {
		Username string
		Password string
	}
)

func SignInUser(c *gin.Context) {
	var payload Authen
	var user entity.User

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB().Preload("Title").Preload("Position").Preload("Major").Preload("Role").
		Where("username = ?", payload.Username).
		First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบ Usermane นี้"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "รหัสผ่านไม่ถูกต้อง"})
		return
	}

	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}

	signedToken, err := jwtWrapper.GenerateToken(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง token ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token_type":     "Bearer",
		"token":          signedToken,
		"user_id":        user.ID,
		"username":       user.Username,
		"first_name":     user.Firstname,
		"last_name":      user.Lastname,
		"role":           user.Role.Role,
		"title":          user.Title.Title,
		"position":       user.Position.Position,
		"major_name":     user.Major.MajorName,
		"first_password": user.FirstPassword,
		"image":          user.Image,
		"email":          user.Email,
	})
}

type Password struct {
	Email           string `binding:"required,email"`
	NewPassword     string `binding:"required,min=8"`
	ConfirmPassword string `binding:"required,min=8"`
}

func ChangePassword(c *gin.Context) {
	var input Password
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	if input.NewPassword != input.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน"})
		return
	}

	var user entity.User
	if err := config.DB().Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้งานด้วยอีเมลนี้"})
		return
	}

	hashedPassword, err := config.HashPassword(input.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "การเข้ารหัสผ่านล้มเหลว"})
		return
	}

	user.Password = hashedPassword

	if !user.FirstPassword {
		user.FirstPassword = true
	}

	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "การอัปเดตรหัสผ่านล้มเหลว"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "การอัปเดตรหัสผ่านสำเร็จ"})
}
