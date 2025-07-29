package controllers

import (
	"net/http"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/gin-gonic/gin"
)
// {
//   "TeachingAssistantID": 1,
//   "ScheduleID": 1
// }

// POST /ScheduleTeachingAssistants
func CreateScheduleTeachingAssistant(c *gin.Context) {
	var input entity.ScheduleTeachingAssistant

	// รับข้อมูล JSON จาก client
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// สร้าง ScheduleTeachingAssistant object
	scheduleTA := entity.ScheduleTeachingAssistant{
		TeachingAssistantID: input.TeachingAssistantID,
		ScheduleID:          input.ScheduleID,
	}

	// บันทึกลงฐานข้อมูล
	if err := db.Create(&scheduleTA).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตอบกลับ
	c.JSON(http.StatusCreated, gin.H{
		"message": "ScheduleTeachingAssistant created successfully",
		"data":    scheduleTA,
	})
}
