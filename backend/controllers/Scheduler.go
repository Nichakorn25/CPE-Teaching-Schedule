package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetScheduleByNameTable(c *gin.Context) {
	nameTable := c.Param("nameTable")

	var schedules []entity.Schedule
	err := config.DB().
		Preload("OfferedCourses.User").
		Preload("OfferedCourses.Laboratory").
		Preload("OfferedCourses.AllCourses.Curriculum").
		Preload("OfferedCourses.AllCourses.AcademicYear").
		Preload("OfferedCourses.AllCourses.TypeOfCourses").
		Preload("OfferedCourses.AllCourses.Credit").
		Preload("TimeFixedCourses").
		// Preload("ScheduleTeachingAssistant.User").   ถ้าเลือก ta แล้วอย่าลืมเรียก
		Where("name_table = ?", nameTable).
		Find(&schedules).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "ไม่สามารถดึงตารางสอนได้",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, schedules)
}

// ////////////////////////////////////////////////////////// จัดตารางสอน
func AutoGenerateSchedule(c *gin.Context) {
	year := c.Query("year")
	term := c.Query("term")

	var offeredCourses []entity.OfferedCourses
	config.DB().Where("year = ? AND term = ?", year, term).
		Preload("User.Position").
		Preload("AllCourses.TypeOfCourses").
		Preload("AllCourses.Credit").
		Find(&offeredCourses)

	var fixedCourses []entity.TimeFixedCourses
	config.DB().Where("year = ? AND term = ?", year, term).
		Find(&fixedCourses)

	config.DB().Where("name_table = ?", fmt.Sprintf("year%s_term%s", year, term)).Delete(&entity.Schedule{})

	for _, fixed := range fixedCourses {
		schedule := entity.Schedule{
			NameTable:        fmt.Sprintf("year%s_term%s", year, term),
			SectionNumber:    fixed.Section,
			DayOfWeek:        fixed.DayOfWeek,
			StartTime:        fixed.StartTime,
			EndTime:          fixed.EndTime,
			OfferedCoursesID: getOfferedCourseID(fixed.AllCoursesID, fixed.Section, offeredCourses),
		}
		config.DB().Create(&schedule)
	}

	var schedules []entity.Schedule

	for _, course := range offeredCourses {
		if course.IsFixCourses || course.User.Position.Priority == nil {
			continue
		}

		hours := course.AllCourses.Credit.Unit + course.AllCourses.Credit.Lecture
		slotsNeeded := int(hours)

		var conditions []entity.Condition
		config.DB().Where("user_id = ?", course.UserID).Find(&conditions)

		scheduled := 0
		for day := 0; day < 7 && scheduled < slotsNeeded; day++ {
			dayName := getDayName(day)

			for hour := 8; hour <= 20 && scheduled < slotsNeeded; hour++ {
				start := time.Date(0, 1, 1, hour, 0, 0, 0, time.UTC)
				end := start.Add(time.Hour)

				if !isConflictWithConditions(dayName, start, end, conditions) &&
					!isSlotTakenOrTeacherConflict(dayName, start, end, schedules, course.UserID) {

					s := entity.Schedule{
						NameTable:        fmt.Sprintf("year%s_term%s", year, term),
						SectionNumber:    course.Section,
						DayOfWeek:        dayName,
						StartTime:        start,
						EndTime:          end,
						OfferedCoursesID: course.ID,
					}
					schedules = append(schedules, s)
					scheduled++
				}
			}
		}
	}

	for _, s := range schedules {
		config.DB().Create(&s)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "สร้างตารางสอนอัตโนมัติสำเร็จ",
	})
}

func getDayName(index int) string {
	days := []string{"จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"}
	return days[index%7]
}

func isConflictWithConditions(day string, start, end time.Time, conditions []entity.Condition) bool {
	for _, c := range conditions {
		if c.DayOfWeek == day &&
			(start.Before(c.EndTime) && end.After(c.StartTime)) {
			return true
		}
	}
	return false
}

func isSlotTakenOrTeacherConflict(day string, start, end time.Time, schedules []entity.Schedule, userID uint) bool {
	for _, s := range schedules {
		if s.DayOfWeek == day &&
			(start.Before(s.EndTime) && end.After(s.StartTime)) {

			var offered entity.OfferedCourses
			if err := config.DB().First(&offered, s.OfferedCoursesID).Error; err == nil {
				if offered.UserID == userID {
					return true
				}
			}
			return true
		}
	}
	return false
}

func getOfferedCourseID(allCourseID uint, section uint, offeredCourses []entity.OfferedCourses) uint {
	for _, oc := range offeredCourses {
		if oc.AllCoursesID == allCourseID && oc.Section == section {
			return oc.ID
		}
	}
	return 0
}

// ///////////////////////////////////////// ดึงตารางสอนไปแสดงตาม nametable
func GetNameTable(c *gin.Context) {
	var nameTables []string

	if err := config.DB().
		Model(&entity.Schedule{}).
		Distinct("name_table").
		Pluck("name_table", &nameTables).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูล NameTable ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"name_tables": nameTables})
}

// ///////////////////////////////////////// update ตาราง
func UpdateScheduleTime(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		DayOfWeek string    
		StartTime time.Time 
		EndTime   time.Time 
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var schedule entity.Schedule
	if err := config.DB().First(&schedule, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบตาราง"})
		return
	}

	schedule.DayOfWeek = input.DayOfWeek
	schedule.StartTime = input.StartTime
	schedule.EndTime = input.EndTime

	if err := config.DB().Save(&schedule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกตารางใหม่ได้"})
		return
	}

	c.JSON(http.StatusOK, schedule)
}
