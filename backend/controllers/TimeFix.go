package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

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

	c.JSON(http.StatusOK, gin.H{
		"message":           "สร้างวิชาที่มาจากศูนย์บริการเรียบร้อยแล้ว",
		"offered_course_id": offeredCourse.ID,
		"schedule_id":       schedule.ID,
		"time_fixed_course": timeFixed.ID,
	})
}

// /////////////////////////////*********************************
type UpdateFixedCourseRequest struct {
	TotalSection uint
	Capacity     uint
	LaboratoryID *uint
	Groups       []Groupup
}

type Groupup struct {
	DayOfWeek string
	StartTime string
	EndTime   string
	RoomFix   string
	Section   uint
	Capacity  uint
}

func UpdateFixedCourse(c *gin.Context) {
	id := c.Param("id")
	var req UpdateFixedCourseRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	location, _ := time.LoadLocation("Asia/Bangkok")
	today := time.Now().In(location).Format("2006-01-02")

	var offered entity.OfferedCourses
	if err := config.DB().Preload("Schedule").First(&offered, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลวิชาที่เปิดสอน"})
		return
	}

	// อัปเดต Capacity และ LaboratoryID
	offered.Capacity = req.Capacity
	offered.LaboratoryID = req.LaboratoryID

	// ใช้จำนวน req.Groups เป็น TotalSections อัตโนมัติ
	offered.Section = uint(len(req.Groups))

	if err := config.DB().Save(&offered).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดต OfferedCourses ได้"})
		return
	}

	var updatedSchedules []uint
	var updatedTimeFixed []uint

	// สร้าง map ของ SectionNumber สำหรับตรวจสอบ schedule ที่ต้องลบ
	groupSections := make(map[uint]bool)
	for _, g := range req.Groups {
		groupSections[uint(g.Section)] = true
	}

	// ตรวจสอบ schedule เดิม ถ้าไม่มีใน groupSections ให้ลบ
	var existingSchedules []entity.Schedule
	if err := config.DB().Where("offered_courses_id = ?", offered.ID).Find(&existingSchedules).Error; err == nil {
		for _, s := range existingSchedules {
			if !groupSections[s.SectionNumber] {
				// ลบ TimeFixedCourses ก่อน
				config.DB().Where("schedule_id = ?", s.ID).Delete(&entity.TimeFixedCourses{})
				// ลบ Schedule
				config.DB().Delete(&s)
			}
		}
	}

	// อัปเดตหรือสร้าง schedule + time fixed ใหม่
	for _, g := range req.Groups {
		startDateTimeStr := fmt.Sprintf("%s %s", today, g.StartTime)
		endDateTimeStr := fmt.Sprintf("%s %s", today, g.EndTime)

		startTime, err := time.ParseInLocation("2006-01-02 15:04", startDateTimeStr, location)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("รูปแบบเวลาเริ่มต้นไม่ถูกต้องสำหรับ Section %d", g.Section)})
			return
		}

		endTime, err := time.ParseInLocation("2006-01-02 15:04", endDateTimeStr, location)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("รูปแบบเวลาสิ้นสุดไม่ถูกต้องสำหรับ Section %d", g.Section)})
			return
		}

		var schedule entity.Schedule
		err = config.DB().Where("offered_courses_id = ? AND section_number = ?", offered.ID, g.Section).First(&schedule).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// สร้างใหม่
			schedule = entity.Schedule{
				NameTable:        fmt.Sprintf("Section %d", g.Section),
				SectionNumber:    g.Section,
				DayOfWeek:        g.DayOfWeek,
				StartTime:        startTime,
				EndTime:          endTime,
				OfferedCoursesID: offered.ID,
			}
			if err := config.DB().Create(&schedule).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Schedule ใหม่ได้"})
				return
			}
		} else {
			// อัปเดต Schedule เดิม
			schedule.DayOfWeek = g.DayOfWeek
			schedule.StartTime = startTime
			schedule.EndTime = endTime
			if err := config.DB().Save(&schedule).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดต Schedule ได้"})
				return
			}
		}

		updatedSchedules = append(updatedSchedules, schedule.ID)

		// อัปเดตหรือสร้าง TimeFixedCourses
		var timeFixed entity.TimeFixedCourses
		err = config.DB().Where("schedule_id = ?", schedule.ID).First(&timeFixed).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			timeFixed = entity.TimeFixedCourses{
				Year:         offered.Year,
				Term:         offered.Term,
				DayOfWeek:    g.DayOfWeek,
				StartTime:    startTime,
				EndTime:      endTime,
				RoomFix:      g.RoomFix,
				Section:      g.Section,
				Capacity:     g.Capacity,
				AllCoursesID: offered.AllCoursesID,
				ScheduleID:   schedule.ID,
			}
			if err := config.DB().Create(&timeFixed).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง TimeFixedCourses ใหม่ได้"})
				return
			}
		} else {
			timeFixed.DayOfWeek = g.DayOfWeek
			timeFixed.StartTime = startTime
			timeFixed.EndTime = endTime
			timeFixed.RoomFix = g.RoomFix
			timeFixed.Section = g.Section
			timeFixed.Capacity = g.Capacity
			if err := config.DB().Save(&timeFixed).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดต TimeFixedCourses ได้"})
				return
			}
		}

		updatedTimeFixed = append(updatedTimeFixed, timeFixed.ID)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "อัปเดตรายวิชาสำเร็จ",
		"offered_course_id":  offered.ID,
		"schedules":          updatedSchedules,
		"time_fixed_courses": updatedTimeFixed,
		"total_sections":     offered.Section, // ส่งกลับจำนวน sections ล่าสุด
	})
}
