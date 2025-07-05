package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type (
	ConditionInput struct {
		DayOfWeek string
		StartTime string
		EndTime   string
	}

	ConditionsRequest struct {
		UserID     uint
		Conditions []ConditionInput
	}
)

func CreateConditions(c *gin.Context) {
	var req ConditionsRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลที่รับมาไม่ถูกต้อง"})
		return
	}

	for _, input := range req.Conditions {
		startTime, err1 := time.Parse("15:04", input.StartTime)
		endTime, err2 := time.Parse("15:04", input.EndTime)

		if err1 != nil || err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบเวลาไม่ถูกต้อง"})
			return
		}

		condition := entity.Condition{
			DayOfWeek: input.DayOfWeek,
			StartTime: startTime,
			EndTime:   endTime,
			UserID:    req.UserID,
		}

		if err := config.DB().Create(&condition).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกเงื่อนไขเวลาที่ไม่ว่างได้"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "บันทึกเงื่อนไขเวลาที่ไม่ว่างสำเร็จ"})
}
