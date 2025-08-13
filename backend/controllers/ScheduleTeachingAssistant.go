package controllers

import (
	"net/http"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

// ///////////////////////////////// สร้างโดยเลือกจากวิชาที่เปิดสอนคู่กับตารางสอนวิชานั้น
type AssignTA struct {
    OfferedCoursesID     uint   `binding:"required"`
    NameTable            string `binding:"required"`
    TeachingAssistantIDs []uint `binding:"required"`
}

func AssignTAToSchedule(c *gin.Context) {
    var req AssignTA
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db := c.MustGet("db").(*gorm.DB)

    var schedules []entity.Schedule
    if err := db.Where("offered_courses_id = ? AND name_table = ?", req.OfferedCoursesID, req.NameTable).
        Find(&schedules).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find schedules"})
        return
    }

    if len(schedules) == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "No schedules found for this course and nameTable"})
        return
    }

    // เตรียมข้อมูลสำหรับ insert
    var assignments []entity.ScheduleTeachingAssistant
    for _, schedule := range schedules {
        for _, taID := range req.TeachingAssistantIDs {
            assignments = append(assignments, entity.ScheduleTeachingAssistant{
                TeachingAssistantID: taID,
                ScheduleID:          schedule.ID,
            })
        }
    }

    if err := db.Create(&assignments).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกผู้ช่วยสอนได้"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "บันทึกผู้ช่วยสอนสำเร็จ",
    })
}
