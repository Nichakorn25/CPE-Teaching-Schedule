package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type (
	CreateTeachingAssistantInput struct {
		Firstname   string `binding:"required"`
		Lastname    string `binding:"required"`
		Email       string
		PhoneNumber string
		TitleID     uint
	}

	UpdateTeachingAssistantInput struct {
		Firstname   string
		Lastname    string
		Email       string
		PhoneNumber string
		TitleID     uint
	}
)

func GetTeachingAssistantByID(c *gin.Context) {
    id := c.Param("id")

    var teachingAssistant entity.TeachingAssistant

    if err := config.DB().Preload("Title").
        Preload("ScheduleTeachingAssistant").
        First(&teachingAssistant, id).Error; err != nil {

        c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ช่วยสอน"})
        return
    }

    c.JSON(http.StatusOK, teachingAssistant)
}

func GetAllTeachingAssistants(c *gin.Context) {
	var teachingAssistants []entity.TeachingAssistant

	if err := config.DB().Preload("Title").
		Preload("ScheduleTeachingAssistant").
		Find(&teachingAssistants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, teachingAssistants)
}

// //////////////////////////////////////////////////////////////////////////// create ///////
func CreateTeachingAssistant(c *gin.Context) {
	var data_ta CreateTeachingAssistantInput

	if err := c.ShouldBindJSON(&data_ta); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "ข้อมูลไม่ถูกต้อง",
			"detail": err.Error(),
		})
		return
	}

	var title entity.Title
	if err := config.DB().First(&title, data_ta.TitleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "ไม่พบคำนำหน้า",
		})
		return
	}

	ta := entity.TeachingAssistant{
		Firstname:   data_ta.Firstname,
		Lastname:    data_ta.Lastname,
		Email:       data_ta.Email,
		PhoneNumber: data_ta.PhoneNumber,
		TitleID:     data_ta.TitleID,
	}

	if err := config.DB().Create(&ta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "ไม่สามารถเพิ่มข้อมูลผู้ช่วยสอนได้",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "เพิ่มข้อมูลผู้ช่วยสอนเรียบร้อยแล้ว",
		"data":    ta,
	})
}

func UpdateTeachingAssistant(c *gin.Context) {
	id := c.Param("id")

	var ta entity.TeachingAssistant
	if err := config.DB().First(&ta, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ช่วยสอนที่ต้องการแก้ไข"})
		return
	}

	var input UpdateTeachingAssistantInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง", "detail": err.Error()})
		return
	}

	if input.TitleID != 0 {
		var title entity.Title
		if err := config.DB().First(&title, input.TitleID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบคำนำหน้า (Title) ที่ระบุ"})
			return
		}
	}

	updated := entity.TeachingAssistant{
		Firstname:   input.Firstname,
		Lastname:    input.Lastname,
		Email:       input.Email,
		PhoneNumber: input.PhoneNumber,
		TitleID:     input.TitleID,
	}

	if err := config.DB().Model(&ta).Updates(updated).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตข้อมูลผู้ช่วยสอนได้", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "แก้ไขข้อมูลผู้ช่วยสอนเรียบร้อยแล้ว", "data": ta})
}

func DeleteTeachingAssistant(c *gin.Context) {
	id := c.Param("id")

	var ta entity.TeachingAssistant
	if err := config.DB().First(&ta, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ช่วยสอนที่ต้องการลบ"})
		return
	}

	if err := config.DB().Delete(&ta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบข้อมูลผู้ช่วยสอนได้", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลผู้ช่วยสอนเรียบร้อยแล้ว"})
}
