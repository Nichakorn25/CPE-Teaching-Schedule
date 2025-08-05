package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type CreateFixedCourseRequest struct {
	Year         uint
	Term         uint
	Section      uint // จำนวนกลุ่มทั้งหมด
	Capacity     uint
	UserID       uint
	AllCoursesID uint
	LaboratoryID *uint

	SectionInFixed uint

	DayOfWeek string
	StartTime string
	EndTime   string
	RoomFix   string
	NameTable string
}

func CreateFixedCourse(c *gin.Context) {
	var req CreateFixedCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลที่ส่งมาไม่ถูกต้อง: " + err.Error()})
		return
	}

	location, _ := time.LoadLocation("Asia/Bangkok") // Thailand timezone

	today := time.Now().In(location).Format("2006-01-02") // ใช้วันที่ปัจจุบัน หรือกำหนดเองก็ได้ เช่น "2025-08-05"

	// สร้าง datetime string แบบเต็ม
	startDateTimeStr := fmt.Sprintf("%s %s", today, req.StartTime)
	endDateTimeStr := fmt.Sprintf("%s %s", today, req.EndTime)

	startTime, err := time.ParseInLocation("2006-01-02 15:04", startDateTimeStr, location)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบเวลาเริ่มต้นไม่ถูกต้อง"})
		return
	}

	endTime, err := time.ParseInLocation("2006-01-02 15:04", endDateTimeStr, location)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบเวลาสิ้นสุดไม่ถูกต้อง"})
		return
	}

	// Step 1: สร้าง OfferedCourses ก่อน
	offeredCourse := entity.OfferedCourses{
		Year:         req.Year,
		Term:         req.Term,
		Section:      req.Section,
		Capacity:     req.Capacity,
		IsFixCourses: true,
		UserID:       req.UserID,
		AllCoursesID: req.AllCoursesID,
		LaboratoryID: req.LaboratoryID,
	}
	if err := config.DB().Create(&offeredCourse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างข้อมูลรายวิชาที่เปิดสอนได้"})
		return
	}

	// Step 2: สร้าง Schedule โดยผูกกับ OfferedCoursesID
	schedule := entity.Schedule{
		NameTable:        fmt.Sprintf("ปีการศึกษา %d เทอม %d", req.Year, req.Term),
		SectionNumber:    req.Section,
		DayOfWeek:        req.DayOfWeek,
		StartTime:        startTime,
		EndTime:          endTime,
		OfferedCoursesID: offeredCourse.ID,
	}
	if err := config.DB().Create(&schedule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ไม่สามารถสร้างตารางเรียนได้",
		})
		return
	}

	// Step 3: สร้าง TimeFixedCourses โดยผูกกับ ScheduleID
	timeFixed := entity.TimeFixedCourses{
		Year:         req.Year,
		Term:         req.Term,
		DayOfWeek:    req.DayOfWeek,
		StartTime:    startTime,
		EndTime:      endTime,
		RoomFix:      req.RoomFix,
		Section:      req.SectionInFixed,
		Capacity:     req.Capacity,
		AllCoursesID: req.AllCoursesID,
		ScheduleID:   schedule.ID,
	}
	if err := config.DB().Create(&timeFixed).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างข้อมูล TimeFix ได้"})
		return
	}

	// Step 4: ส่ง response กลับ
	c.JSON(http.StatusOK, gin.H{
		"message":           "สร้างวิชาที่มาจากศูนย์บริการเรียบร้อยแล้ว",
		"offered_course_id": offeredCourse.ID,
		"schedule_id":       schedule.ID,
		"time_fixed_course": timeFixed.ID,
	})
}
