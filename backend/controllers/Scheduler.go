package controllers

import (
	"fmt"
	"net/http"
	"sort"
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

func GetScheduleByNameTableAndUserID(c *gin.Context) {
	userID := c.Param("userID")
	nameTable := c.Param("nameTable")

	var schedules []entity.Schedule
	err := config.DB().
		Joins("JOIN offered_courses ON offered_courses.id = schedules.offered_courses_id").
		Preload("OfferedCourses.User").
		Preload("OfferedCourses.Laboratory").
		Preload("OfferedCourses.AllCourses.Curriculum").
		Preload("OfferedCourses.AllCourses.AcademicYear").
		Preload("OfferedCourses.AllCourses.TypeOfCourses").
		Preload("OfferedCourses.AllCourses.Credit").
		Preload("TimeFixedCourses").
		Where("schedules.name_table = ? AND offered_courses.user_id = ?", nameTable, userID).
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
	nameTable := fmt.Sprintf("ปีการศึกษา %s เทอม %s", year, term)

	var offeredCourses []entity.OfferedCourses
	config.DB().Where("year = ? AND term = ?", year, term).
		Preload("User.Position").
		Preload("AllCourses.TypeOfCourses").
		Preload("AllCourses.Credit").
		Preload("AllCourses.AcademicYear").
		Preload("Laboratory").
		Find(&offeredCourses)

	config.DB().Where("name_table = ?", nameTable).Delete(&entity.Schedule{})

	// 🧩 [1] FIXED COURSES: วนตาม Section จริง
	for _, course := range offeredCourses {
		if !course.IsFixCourses {
			continue
		}
		for sec := uint(1); sec <= course.Section; sec++ {
			var fixedCourses []entity.TimeFixedCourses
			config.DB().Where("all_courses_id = ? AND section = ? AND year = ? AND term = ?",
				course.AllCoursesID, sec, year, term).Find(&fixedCourses)

			for _, fixed := range fixedCourses {
				schedule := entity.Schedule{
					NameTable:        nameTable,
					SectionNumber:    fixed.Section,
					DayOfWeek:        fixed.DayOfWeek,
					StartTime:        fixed.StartTime,
					EndTime:          fixed.EndTime,
					OfferedCoursesID: course.ID,
				}
				config.DB().Create(&schedule)
			}
		}
	}

	// โหลดใหม่เฉพาะวิชาที่ยังไม่ถูกจัด
	var autoCourses []entity.OfferedCourses
	config.DB().Where("year = ? AND term = ? AND is_fix_courses = false", year, term).
		Preload("User.Position").
		Preload("AllCourses.TypeOfCourses").
		Preload("AllCourses.Credit").
		Preload("AllCourses.AcademicYear").
		Preload("Laboratory").
		Find(&autoCourses)

	// แยกวิชาออกเป็นกลุ่มเพื่อจัดลำดับ
	var coreCourses, electiveCourses []entity.OfferedCourses
	for _, course := range autoCourses {
		if course.AllCourses.TypeOfCoursesID == 1 {
			coreCourses = append(coreCourses, course)
		} else {
			electiveCourses = append(electiveCourses, course)
		}
	}

	sortCoursesByPriority := func(courses []entity.OfferedCourses) {
		sort.SliceStable(courses, func(i, j int) bool {
			pi := courses[i].User.Position.Priority
			pj := courses[j].User.Position.Priority
			if pi == nil {
				return false
			}
			if pj == nil {
				return true
			}
			return *pi < *pj
		})
	}

	sortCoursesByPriority(coreCourses)
	sortCoursesByPriority(electiveCourses)

	var allSchedules []entity.Schedule
	config.DB().Where("name_table = ?", nameTable).Find(&allSchedules)

	// 🧩 [2] AUTO-GENERATE: วนทีละ Section
	for _, group := range [][]entity.OfferedCourses{coreCourses, electiveCourses} {
		for _, course := range group {
			credit := course.AllCourses.Credit
			slotsNeeded := int(credit.Lecture + credit.Lab)

			for sec := uint(1); sec <= course.Section; sec++ {
				var conditions []entity.Condition
				config.DB().Where("user_id = ?", course.UserID).Find(&conditions)

				scheduled := 0
				for day := 0; day < 5 && scheduled < slotsNeeded; day++ {
					dayName := getDayName(day)
					for hour := 8; hour < 21 && scheduled < slotsNeeded; hour++ {
						if hour == 12 {
							continue
						}

						start := time.Date(2006, 1, 2, hour, 0, 0, 0, time.FixedZone("Asia/Bangkok", 7*60*60))
						end := start.Add(time.Hour)

						if isConflictWithConditions(dayName, start, end, conditions) ||
							isInstructorConflict(dayName, start, end, allSchedules, course.UserID) ||
							(course.LaboratoryID != nil &&
								isLabConflict(dayName, start, end, allSchedules, *course.LaboratoryID)) {
							continue
						}

						s := entity.Schedule{
							NameTable:        nameTable,
							SectionNumber:    sec,
							DayOfWeek:        dayName,
							StartTime:        start,
							EndTime:          end,
							OfferedCoursesID: course.ID,
						}
						allSchedules = append(allSchedules, s)
						config.DB().Create(&s)
						scheduled++
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "สร้างตารางสอนอัตโนมัติสำเร็จ"})
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

// func isSlotTakenOrTeacherConflict(day string, start, end time.Time, schedules []entity.Schedule, userID uint) bool {
// 	for _, s := range schedules {
// 		if s.DayOfWeek == day &&
// 			(start.Before(s.EndTime) && end.After(s.StartTime)) {
// 			var offered entity.OfferedCourses
// 			if err := config.DB().First(&offered, s.OfferedCoursesID).Error; err == nil {
// 				if offered.UserID == userID {
// 					return true
// 				}
// 			}
// 			return true
// 		}
// 	}
// 	return false
// }

// func getOfferedCourseID(allCourseID uint, section uint, offeredCourses []entity.OfferedCourses) uint {
// 	for _, oc := range offeredCourses {
// 		if oc.AllCoursesID == allCourseID && oc.Section == section {
// 			return oc.ID
// 		}
// 	}
// 	return 0
// }

func isInstructorConflict(day string, start, end time.Time, schedules []entity.Schedule, userID uint) bool {
	for _, s := range schedules {
		if s.DayOfWeek != day || !(start.Before(s.EndTime) && end.After(s.StartTime)) {
			continue
		}
		var oc entity.OfferedCourses
		if err := config.DB().First(&oc, s.OfferedCoursesID).Error; err == nil {
			if oc.UserID == userID {
				return true
			}
		}
	}
	return false
}

func isLabConflict(day string, start, end time.Time, schedules []entity.Schedule, labID uint) bool {
	for _, s := range schedules {
		if s.DayOfWeek != day || !(start.Before(s.EndTime) && end.After(s.StartTime)) {
			continue
		}
		var oc entity.OfferedCourses
		if err := config.DB().First(&oc, s.OfferedCoursesID).Error; err == nil {
			if oc.LaboratoryID != nil && *oc.LaboratoryID == labID {
				return true
			}
		}
	}
	return false
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
