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
		UsernameID string
		Password   string
	}
)

func SignInUser(c *gin.Context) {
	var payload Authen
	var user entity.User

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB().Preload("Role").
		Where("username_id = ?", payload.UsernameID).
		First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "incorrect password"})
		return
	}

	var firstName, lastName string

	if user.Role.Role == "Admin" {
		var admin entity.Admin
		if err := config.DB().Where("user_id = ?", user.ID).First(&admin).Error; err == nil {
			firstName = admin.FirstName
			lastName = admin.LastName
		}
	} else if user.Role.Role == "Instructor" {
		var instructor entity.Instructor
		if err := config.DB().Where("user_id = ?", user.ID).First(&instructor).Error; err == nil {
			firstName = instructor.FirstName
			lastName = instructor.LastName
		}
	}

	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}

	signedToken, err := jwtWrapper.GenerateToken(user.UsernameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error signing token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token_type": "Bearer",
		"token":      signedToken,
		"user_id":    user.UsernameID,
		"role":       user.Role.Role,
		"first_name": firstName,
		"last_name":  lastName,
	})
}

// func ChangePasswordUser(c *gin.Context) {
// 	var request struct {
// 		UserID      string
// 		NewPassword string
// 	}

// 	if err := c.ShouldBindJSON(&request); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id and new_password are required"})
// 		return
// 	}

// 	var user entity.User
// 	if err := config.DB().Where("user_id = ?", request.UserID).First(&user).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
// 		return
// 	}

// 	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
// 		return
// 	}

// 	user.Password = string(hashedPassword)
// 	if err := config.DB().Save(&user).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
// }
