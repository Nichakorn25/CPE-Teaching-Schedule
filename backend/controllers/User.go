package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllTeachers(c *gin.Context) {
	var users []entity.User

	err := config.DB().Preload("Title").
		Preload("Position").
		Preload("Major").
		Preload("Major.Department").
		Preload("Role").
		Where(`Role_id != ?`, 1).
		Find(&users).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลผู้ใช้ได้"})
		return
	}

	type TeacherResp struct {
		ID         uint
		Title      string
		Firstname  string
		Lastname   string
		Email      string
		Username   string
		Department string
		Major      string
		Position   string
		Status     string
		Role       string
	}

	resp := make([]TeacherResp, 0, len(users))
	for _, u := range users {
		resp = append(resp, TeacherResp{
			ID:         u.ID,
			Title:      u.Title.Title,
			Firstname:  u.Firstname,
			Lastname:   u.Lastname,
			Email:      u.Email,
			Username:   u.Username,
			Department: u.Major.Department.DepartmentName,
			Major:      u.Major.MajorName,
			Position:   u.Position.Position,
			Status:     "Active",
			Role:       u.Role.Role,
		})
	}

	c.JSON(http.StatusOK, resp)
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")

	var user entity.User
	err := config.DB().
		Preload("Title").
		Preload("Position").
		Preload("Major").
		Preload("Role").
		First(&user, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้"})
		return
	}

	resp := gin.H{
		"id":           user.ID,
		"username":     user.Username,
		"firstname":    user.Firstname,
		"lastname":     user.Lastname,
		"image":        user.Image,
		"email":        user.Email,
		"phone_number": user.PhoneNumber,
		"address":      user.Address,
		"title_id":     user.TitleID,
		"title_name":   user.Title.Title,
		"position_id":  user.PositionID,
		"position":     user.Position.Position,
		"major_id":     user.MajorID,
		"major":        user.Major.MajorName,
		"role_id":      user.RoleID,
		"role":         user.Role.Role,
	}

	c.JSON(http.StatusOK, resp)
}

func CreateUser(c *gin.Context) {
	var input struct {
		Username    string `binding:"required"`
		Password    string `binding:"required"`
		Firstname   string
		Lastname    string
		Image       string
		Email       string
		PhoneNumber string
		Address     string
		TitleID     uint
		PositionID  uint
		MajorID     uint
		RoleID      uint
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	hashedPassword, err := config.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เข้ารหัสรหัสผ่านล้มเหลว"})
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
		FirstPassword: false,
		TitleID:       input.TitleID,
		PositionID:    input.PositionID,
		MajorID:       input.MajorID,
		RoleID:        input.RoleID,
	}

	if err := config.DB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเพิ่มผู้ใช้ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "เพิ่มผู้ใช้สำเร็จ", "user_id": user.ID})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var user entity.User
	if err := config.DB().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้ที่ต้องการแก้ไข"})
		return
	}

	var input struct {
		Username    string
		Firstname   string
		Lastname    string
		Image       string
		Email       string
		PhoneNumber string
		Address     string
		TitleID     uint
		PositionID  uint
		MajorID     uint
		RoleID      uint
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	user.Username = input.Username
	user.Firstname = input.Firstname
	user.Lastname = input.Lastname
	user.Image = input.Image
	user.Email = input.Email
	user.PhoneNumber = input.PhoneNumber
	user.Address = input.Address
	user.TitleID = input.TitleID
	user.PositionID = input.PositionID
	user.MajorID = input.MajorID
	user.RoleID = input.RoleID

	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว"})
}

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
