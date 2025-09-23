package controllers

import (
	"fmt"
	"math/rand"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func getDayName(index int) string {
	days := []string{"จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"}
	return days[index%7]
}

func calcWeeklyHours(credit entity.Credit) (int, int) {
	lecHours := int(credit.Lecture) * 1
	labHours := int(credit.Lab) * 3
	return lecHours, labHours
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

func isConsecutiveSlot(schedules []entity.Schedule, day string, start time.Time, courseID uint, sec uint) bool {
	for _, s := range schedules {
		if s.DayOfWeek == day && s.OfferedCoursesID == courseID && s.SectionNumber == sec {
			return s.EndTime.Equal(start)
		}
	}
	return true
}

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

func isAcademicYearConflict(day string, start, end time.Time, schedules []entity.Schedule, course entity.OfferedCourses) bool {
	for _, s := range schedules {
		if s.DayOfWeek != day || !(start.Before(s.EndTime) && end.After(s.StartTime)) {
			continue
		}

		var oc entity.OfferedCourses
		if err := config.DB().
			Preload("AllCourses.AcademicYear").
			Preload("Laboratory").
			First(&oc, s.OfferedCoursesID).Error; err == nil {

			if oc.AllCourses.AcademicYearID == course.AllCourses.AcademicYearID {
				if oc.LaboratoryID != nil && course.LaboratoryID != nil &&
					*oc.LaboratoryID != *course.LaboratoryID {
					continue
				}
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

// ========================= GetScheduleByNameTable =========================
func GetScheduleByNameTable(c *gin.Context) {
	majorName := c.Query("major_name")
	year := c.Query("year")
	term := c.Query("term")

	if majorName == "" || year == "" || term == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ต้องระบุ major_name, year และ term",
		})
		return
	}

	// ดึง department ของ major ผู้ใช้ก่อน
	var deptID uint
	if err := config.DB().
		Table("majors").
		Select("department_id").
		Where("major_name = ?", majorName).
		Scan(&deptID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึง department ของ major ได้", "details": err.Error()})
		return
	}

	// สร้าง nameTable
	nameTable := fmt.Sprintf("ปีการศึกษา %s เทอม %s", year, term)

	var schedules []entity.Schedule

	err := config.DB().
		Preload("OfferedCourses.User").
		Preload("OfferedCourses.Laboratory").
		Preload("OfferedCourses.AllCourses.Curriculum").
		Preload("OfferedCourses.AllCourses.Curriculum.Major").
		Preload("OfferedCourses.AllCourses.AcademicYear").
		Preload("OfferedCourses.AllCourses.TypeOfCourses").
		Preload("OfferedCourses.AllCourses.Credit").
		Preload("OfferedCourses.AllCourses.UserAllCourses").
		Preload("OfferedCourses.AllCourses.UserAllCourses.User").
		Preload("TimeFixedCourses").
		Preload("ScheduleTeachingAssistant").
		Preload("ScheduleTeachingAssistant.TeachingAssistant").
		Preload("ScheduleTeachingAssistant.TeachingAssistant.Title").
		Joins("JOIN offered_courses ON schedules.offered_courses_id = offered_courses.id").
		Joins("JOIN all_courses ON offered_courses.all_courses_id = all_courses.id").
		Joins("JOIN curriculums ON all_courses.curriculum_id = curriculums.id").
		Joins("JOIN majors ON curriculums.major_id = majors.id").
		Joins("JOIN departments ON majors.department_id = departments.id").
		Where("schedules.name_table = ?", nameTable).
		// เงื่อนไขใหม่: fixed -> department เดียวกัน, non-fixed -> major เดียวกัน
		Where(`
			(offered_courses.is_fix_courses = TRUE AND departments.id = ?)
			OR
			(offered_courses.is_fix_courses = FALSE AND majors.major_name = ?)
		`, deptID, majorName).
		Order(`
			CASE schedules.day_of_week
				WHEN 'จันทร์' THEN 1
				WHEN 'อังคาร' THEN 2
				WHEN 'พุธ' THEN 3
				WHEN 'พฤหัสบดี' THEN 4
				WHEN 'ศุกร์' THEN 5
				WHEN 'เสาร์' THEN 6
				WHEN 'อาทิตย์' THEN 7
			END, schedules.start_time, schedules.end_time`).
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

// ========================= AutoGenerateSchedule =========================
func AutoGenerateSchedule(c *gin.Context) {
	user_major := c.Query("major_name")
	year := c.Query("year")
	term := c.Query("term")
	nameTable := fmt.Sprintf("ปีการศึกษา %s เทอม %s", year, term)

	// 1) หา department ของ major ผู้ใช้ก่อน
	var deptID uint
	if err := config.DB().
		Table("majors").
		Select("department_id").
		Where("major_name = ?", user_major).
		Scan(&deptID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึง department ของ major ได้", "details": err.Error()})
		return
	}

	// 2) โหลด OfferedCourses ของเทอมนี้
	var offeredCourses []entity.OfferedCourses
	if err := config.DB().
		Joins("JOIN all_courses ON offered_courses.all_courses_id = all_courses.id").
		Joins("JOIN curriculums ON all_courses.curriculum_id = curriculums.id").
		Joins("JOIN majors ON curriculums.major_id = majors.id").
		Joins("JOIN departments ON majors.department_id = departments.id").
		Where("offered_courses.year = ? AND offered_courses.term = ?", year, term).
		// เงื่อนไข: fixed -> department เดียวกัน, non-fixed -> major เดียวกัน
		Where(`
			(offered_courses.is_fix_courses = TRUE AND departments.id = ?)
			OR
			(offered_courses.is_fix_courses = FALSE AND majors.major_name = ?)
		`, deptID, user_major).
		Preload("User.Position").
		Preload("User.Major").
		Preload("AllCourses.TypeOfCourses").
		Preload("AllCourses.Credit").
		Preload("AllCourses.AcademicYear").
		Preload("AllCourses.Curriculum.Major").
		Preload("Laboratory").
		Find(&offeredCourses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลด OfferedCourses ไม่สำเร็จ", "details": err.Error()})
		return
	}

	// ========== ลบ auto schedules ของสาขาผู้ใช้เหมือนเดิม ==========
	subQuery := config.DB().
		Table("schedules").
		Select("schedules.id").
		Joins("JOIN offered_courses ON schedules.offered_courses_id = offered_courses.id").
		Joins("JOIN all_courses ON offered_courses.all_courses_id = all_courses.id").
		Joins("JOIN curriculums ON all_courses.curriculum_id = curriculums.id").
		Joins("JOIN majors ON curriculums.major_id = majors.id").
		Where("schedules.name_table = ?", nameTable).
		Where("offered_courses.is_fix_courses = ?", false).
		Where("majors.major_name = ?", user_major)

	if err := config.DB().
		Where("id IN (?)", subQuery).
		Delete(&entity.Schedule{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบ auto schedules เดิมไม่สำเร็จ", "details": err.Error()})
		return
	}

	// 2) สร้าง/เติม fixed schedules ตาม TimeFixedCourses (idempotent: ถ้ามีอยู่แล้วจะไม่ซ้ำ)
	for _, course := range offeredCourses {
		if !course.IsFixCourses {
			continue
		}
		for sec := uint(1); sec <= course.Section; sec++ {
			var fixedCourses []entity.TimeFixedCourses
			if err := config.DB().
				Where("all_courses_id = ? AND section = ? AND year = ? AND term = ?",
					course.AllCoursesID, sec, year, term).
				Find(&fixedCourses).Error; err != nil {
				continue
			}

			for _, fixed := range fixedCourses {
				// เช็คว่ามี schedule ชุดนี้อยู่แล้วหรือยัง (ป้องกัน duplicate หากเคย generate ไปแล้ว)
				var exists int64
				_ = config.DB().Model(&entity.Schedule{}).
					Where("name_table = ? AND offered_courses_id = ? AND section_number = ? AND day_of_week = ? AND start_time = ? AND end_time = ?",
						nameTable, course.ID, fixed.Section, fixed.DayOfWeek, fixed.StartTime, fixed.EndTime).
					Count(&exists).Error
				if exists > 0 {
					// bind schedule_id ถ้ายังไม่ได้ผูก
					if fixed.ScheduleID == 0 {
						var s entity.Schedule
						if err := config.DB().
							Where("name_table = ? AND offered_courses_id = ? AND section_number = ? AND day_of_week = ? AND start_time = ? AND end_time = ?",
								nameTable, course.ID, fixed.Section, fixed.DayOfWeek, fixed.StartTime, fixed.EndTime).
							First(&s).Error; err == nil {
							_ = config.DB().Model(&fixed).Update("schedule_id", s.ID).Error
						}
					}
					continue
				}

				schedule := entity.Schedule{
					NameTable:        nameTable,
					SectionNumber:    fixed.Section,
					DayOfWeek:        fixed.DayOfWeek,
					StartTime:        fixed.StartTime,
					EndTime:          fixed.EndTime,
					OfferedCoursesID: course.ID,
				}
				if err := config.DB().Create(&schedule).Error; err != nil {
					continue
				}
				_ = config.DB().Model(&fixed).Update("schedule_id", schedule.ID).Error
			}
		}
	}

	// 3) โหลดตารางทั้งหมดของเทอมนี้ (ทั้ง fixed + auto ของสาขาอื่นที่อาจมีอยู่แล้ว) มาไว้ตรวจชน
	var allSchedules []entity.Schedule
	if err := config.DB().
		Where("name_table = ?", nameTable).
		Find(&allSchedules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลด schedules ทั้งหมดไม่สำเร็จ", "details": err.Error()})
		return
	}

	// 4) เตรียมชุดวิชา auto ของ "สาขาผู้ใช้" เท่านั้น
	var autoCourses []entity.OfferedCourses
	if err := config.DB().
		Joins("JOIN all_courses ON offered_courses.all_courses_id = all_courses.id").
		Joins("JOIN curriculums ON all_courses.curriculum_id = curriculums.id").
		Joins("JOIN majors ON curriculums.major_id = majors.id").
		Where("offered_courses.year = ? AND offered_courses.term = ? AND offered_courses.is_fix_courses = false", year, term).
		Where("majors.major_name = ?", user_major).
		Preload("User.Position").
		Preload("User.Major").
		Preload("AllCourses.TypeOfCourses").
		Preload("AllCourses.Credit").
		Preload("AllCourses.AcademicYear").
		Preload("AllCourses.Curriculum.Major").
		Preload("Laboratory").
		Find(&autoCourses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลด auto courses ไม่สำเร็จ", "details": err.Error()})
		return
	}

	// แยก core / elective
	var coreCourses, electiveCourses []entity.OfferedCourses
	for _, course := range autoCourses {
		if course.AllCourses.TypeOfCoursesID == 1 {
			coreCourses = append(coreCourses, course)
		} else {
			electiveCourses = append(electiveCourses, course)
		}
	}

	// เรียงตาม Priority ของผู้สอน
	sortCoursesByPriority := func(courses []entity.OfferedCourses) {
		sort.SliceStable(courses, func(i, j int) bool {
			pi := courses[i].User.Position.Priority
			pj := courses[j].User.Position.Priority
			if pi == nil && pj == nil {
				return false
			}
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

	// seed random แค่ครั้งเดียว
	rand.Seed(time.Now().UnixNano())

	// 5) วาง auto schedules (พิจารณาชนกับ fixed ด้วย เพราะ allSchedules มี fixed อยู่แล้ว)
	for _, group := range [][]entity.OfferedCourses{coreCourses, electiveCourses} {
		for _, course := range group {
			days := []int{0, 1, 2, 3, 4} // จันทร์-ศุกร์
			preferredHours := []int{8, 9, 10, 11, 13, 14, 15}
			fallbackHours := []int{16, 17, 18, 19, 20}
			rand.Shuffle(len(days), func(i, j int) { days[i], days[j] = days[j], days[i] })
			rand.Shuffle(len(preferredHours), func(i, j int) { preferredHours[i], preferredHours[j] = preferredHours[j], preferredHours[i] })
			rand.Shuffle(len(fallbackHours), func(i, j int) { fallbackHours[i], fallbackHours[j] = fallbackHours[j], fallbackHours[i] })

			credit := course.AllCourses.Credit
			lecHours, labHours := calcWeeklyHours(credit)

			for sec := uint(1); sec <= course.Section; sec++ {
				var conditions []entity.Condition
				_ = config.DB().Where("user_id = ?", course.UserID).Find(&conditions).Error

				labDayIndex := -1
				scheduledLecture := 0

				// --- วาง LAB ก่อน ---
				if labHours > 0 {
				LAB_LOOP:
					for _, day := range days {
						dayName := getDayName(day)
						for hour := 8; hour <= (21 - labHours); hour++ {
							// ข้ามช่วงเที่ยง
							if hour == 12 || (hour < 12 && hour+labHours > 12) {
								continue
							}
							conflict := false
							var tempSlots []entity.Schedule
							for i := 0; i < labHours; i++ {
								start := time.Date(2006, 1, 2, hour+i, 0, 0, 0, time.FixedZone("Asia/Bangkok", 7*60*60))
								end := start.Add(time.Hour)

								if isConflictWithConditions(dayName, start, end, conditions) ||
									isInstructorConflict(dayName, start, end, allSchedules, course.UserID) ||
									(course.LaboratoryID != nil && isLabConflict(dayName, start, end, allSchedules, *course.LaboratoryID)) ||
									!isConsecutiveSlot(allSchedules, dayName, start, course.ID, sec) {
									conflict = true
									break
								}

								tempSlots = append(tempSlots, entity.Schedule{
									NameTable:        nameTable,
									SectionNumber:    sec,
									DayOfWeek:        dayName,
									StartTime:        start,
									EndTime:          end,
									OfferedCoursesID: course.ID,
								})
							}

							if !conflict {
								for _, s := range tempSlots {
									allSchedules = append(allSchedules, s)
									_ = config.DB().Create(&s).Error
								}
								labDayIndex = day
								break LAB_LOOP
							}
						}
					}
				}

				// --- วาง LECTURE (พยายามวางก่อนวัน LAB และไม่เกิน 2 ชม./วัน) ---
				for _, day := range days {
					if day == labDayIndex {
						continue
					}
					if labDayIndex != -1 && day > labDayIndex {
						continue
					}

					dayName := getDayName(day)
					slotsToday := 0
					maxPerDay := 3

					tryPlace := func(hour int) bool {
						if hour == 12 {
							return false
						}
						start := time.Date(2006, 1, 2, hour, 0, 0, 0, time.FixedZone("Asia/Bangkok", 7*60*60))
						end := start.Add(time.Hour)
						// ไม่ข้ามช่วงเที่ยง
						if start.Hour() < 12 && end.Hour() > 12 {
							return false
						}
						if isConflictWithConditions(dayName, start, end, conditions) ||
							isInstructorConflict(dayName, start, end, allSchedules, course.UserID) ||
							isAcademicYearConflict(dayName, start, end, allSchedules, course) ||
							(course.LaboratoryID != nil && isLabConflict(dayName, start, end, allSchedules, *course.LaboratoryID)) ||
							!isConsecutiveSlot(allSchedules, dayName, start, course.ID, sec) {
							return false
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
						_ = config.DB().Create(&s).Error
						scheduledLecture++
						slotsToday++
						return true
					}

					// preferred ก่อน
					for _, h := range preferredHours {
						if scheduledLecture >= lecHours || slotsToday >= maxPerDay {
							break
						}
						_ = tryPlace(h)
					}
					// fallback ช่วงเย็น
					if scheduledLecture < lecHours && slotsToday < maxPerDay {
						for _, h := range fallbackHours {
							if scheduledLecture >= lecHours || slotsToday >= maxPerDay {
								break
							}
							_ = tryPlace(h)
						}
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "สร้างตารางสอนอัตโนมัติสำเร็จ"})
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

// ///////////////////////////////////////// Delete ตารางตามชื่อ NameTable
func DeleteScheduleByNameTable(c *gin.Context) {
	nameTable := c.Param("nameTable")

	if nameTable == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "nameTable is required",
			"nameTable": nameTable,
		})
		return
	}

	var count int64
	if err := config.DB().Model(&entity.Schedule{}).
		Where("name_table = ?", nameTable).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":     err.Error(),
			"nameTable": nameTable,
		})
		return
	}

	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":     "ไม่พบข้อมูลตารางตามชื่อตาราง",
			"nameTable": nameTable,
		})
		return
	}

	if err := config.DB().Where("name_table = ?", nameTable).
		Delete(&entity.Schedule{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":     err.Error(),
			"nameTable": nameTable,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "ลบตารางสอนสำเร็จ",
		"nameTable": nameTable,
		"count":     count,
	})
}
