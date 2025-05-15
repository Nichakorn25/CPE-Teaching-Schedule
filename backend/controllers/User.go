package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

// ดึงข้อมูลอาจารย์ทั้งหมด
func GetUsersByRole(c *gin.Context) {
	var users []entity.User

	if err := config.DB().Where("role_id IN ?", []int{2, 3}).Preload("Role").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// เพิ่มผู้ใช้งาน
func CreateUser(c *gin.Context) {
	var input struct {
		Username      string `json:"username" binding:"required"`
		Password      string `json:"password" binding:"required"`
		Firstname     string `json:"firstname" binding:"required"`
		Lastname      string `json:"lastname" binding:"required"`
		Image         string `json:"image" binding:"required"`
		Email         string `json:"email" binding:"required"`
		PhoneNumber   string `json:"phone_number" binding:"required"`
		Address       string `json:"address" binding:"required"`
		FirstPassword bool   `json:"first_password" binding:"required"`
		TitleID       uint   `json:"title_id" binding:"required"`
		PositionID    uint   `json:"position_id" binding:"required"`
		MajorID       uint   `json:"major_id" binding:"required"`
		RoleID        uint   `json:"role_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := config.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเข้ารหัสของรหัสผ่านได้"})
		return
	}

	user := entity.User{
		Username:      input.Username,
		Password:      hashedPassword,
		Firstname:     input.Firstname,
		Lastname:      input.Lastname,
		Image:         input.Image,
		Email:         input.Email,
		PhoneNumber:   input.PhoneNumber,
		Address:       input.Address,
		FirstPassword: input.FirstPassword,
		TitleID:       input.TitleID,
		PositionID:    input.PositionID,
		MajorID:       input.MajorID,
		RoleID:        input.RoleID,
	}

	if err := config.DB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

// แก้ไขรายละเอียดผู้ใช้งาน
func UpdateUser(c *gin.Context) {

	id := c.Param("id")

	var user entity.User
	if err := config.DB().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้นี้"})
		return
	}

	var input struct {
		Username      *string `json:"username"`
		Password      *string `json:"password"`
		Firstname     *string `json:"firstname"`
		Lastname      *string `json:"lastname"`
		Image         *string `json:"image"`
		Email         *string `json:"email"`
		PhoneNumber   *string `json:"phone_number"`
		Address       *string `json:"address"`
		FirstPassword *bool   `json:"first_password"`
		TitleID       *uint   `json:"title_id"`
		PositionID    *uint   `json:"position_id"`
		MajorID       *uint   `json:"major_id"`
		RoleID        *uint   `json:"role_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}

	if input.Username != nil {
		updates["username"] = *input.Username
	}
	if input.Password != nil {
		hashedPassword, err := config.HashPassword(*input.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเข้ารหัสรหัสผ่านได้"})
			return
		}
		updates["password"] = hashedPassword
	}
	if input.Firstname != nil {
		updates["firstname"] = *input.Firstname
	}
	if input.Lastname != nil {
		updates["lastname"] = *input.Lastname
	}
	if input.Image != nil {
		updates["image"] = *input.Image
	}
	if input.Email != nil {
		updates["email"] = *input.Email
	}
	if input.PhoneNumber != nil {
		updates["phone_number"] = *input.PhoneNumber
	}
	if input.Address != nil {
		updates["address"] = *input.Address
	}
	if input.FirstPassword != nil {
		updates["first_password"] = *input.FirstPassword
	}
	if input.TitleID != nil {
		updates["title_id"] = *input.TitleID
	}
	if input.PositionID != nil {
		updates["position_id"] = *input.PositionID
	}
	if input.MajorID != nil {
		updates["major_id"] = *input.MajorID
	}
	if input.RoleID != nil {
		updates["role_id"] = *input.RoleID
	}

	if err := config.DB().Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": user})
}

// ลบผู้ใช้งาน
func DeleteUser(c *gin.Context) {

	id := c.Param("id")

	var user entity.User
	if err := config.DB().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้ที่ต้องการลบ"})
		return
	}

	if err := config.DB().Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบผู้ใช้ได้"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบผู้ใช้เรียบร้อยแล้ว"})
}
