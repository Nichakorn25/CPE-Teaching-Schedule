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
				if err := config.DB().Create(&schedule).Error; err != nil {
					continue
				}
				config.DB().Model(&fixed).Update("schedule_id", schedule.ID)
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
			// สุ่มวัน (จันทร์-ศุกร์) และเวลาจัด
			days := []int{0, 1, 2, 3, 4}
			preferredHours := []int{8, 9, 10, 11, 13, 14, 15}
			fallbackHours := []int{16, 17, 18, 19, 20}

			// สุ่มให้ไม่เหมือนกันในแต่ละครั้งที่เรียกใช้
			rand.Seed(time.Now().UnixNano())
			rand.Shuffle(len(days), func(i, j int) { days[i], days[j] = days[j], days[i] })
			rand.Shuffle(len(preferredHours), func(i, j int) { preferredHours[i], preferredHours[j] = preferredHours[j], preferredHours[i] })
			rand.Shuffle(len(fallbackHours), func(i, j int) { fallbackHours[i], fallbackHours[j] = fallbackHours[j], fallbackHours[i] })

			credit := course.AllCourses.Credit
			labHours := int(credit.Lab)
			lecHours := int(credit.Lecture)

			for sec := uint(1); sec <= course.Section; sec++ {
				var conditions []entity.Condition
				config.DB().Where("user_id = ?", course.UserID).Find(&conditions)

				var labDayIndex = -1 // สำหรับจำวัน lab ที่ถูกจัดแล้ว
				scheduledLecture := 0

				// Step 1: จัด Lab ก่อนถ้ามี
				if labHours > 0 {
				LAB_LOOP:
					for _, day := range days {
						dayName := getDayName(day)
						for hour := 8; hour <= (21 - labHours); hour++ {
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
									(course.LaboratoryID != nil &&
										isLabConflict(dayName, start, end, allSchedules, *course.LaboratoryID)) {
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
									config.DB().Create(&s)
								}
								labDayIndex = day
								break LAB_LOOP
							}
						}
					}
				}

				// Step 2: จัด Lecture (เลี่ยงวัน Lab, พยายามจัดวันก่อนหน้า)
				for _, day := range days {
					if day == labDayIndex {
						continue
					}
					if labDayIndex != -1 && day > labDayIndex {
						continue
					}

					dayName := getDayName(day)
					slotsToday := 0
					maxPerDay := 2

					// จัด preferred slot ก่อน
					for _, hour := range preferredHours {
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
						scheduledLecture++
						slotsToday++
						if scheduledLecture >= lecHours || slotsToday >= maxPerDay {
							break
						}
					}

					// fallback ช่วงเย็น
					if scheduledLecture < lecHours && slotsToday < maxPerDay {
						for _, hour := range fallbackHours {
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
							scheduledLecture++
							slotsToday++
							if scheduledLecture >= lecHours || slotsToday >= maxPerDay {
								break
							}
						}
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
	var inputs []struct {
		ID        uint
		DayOfWeek string
		StartTime time.Time
		EndTime   time.Time
	}

	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}

	for _, input := range inputs {
		var schedule entity.Schedule
		if err := config.DB().First(&schedule, input.ID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("ไม่พบตาราง id: %d", input.ID)})
			return
		}

		schedule.DayOfWeek = input.DayOfWeek
		schedule.StartTime = input.StartTime
		schedule.EndTime = input.EndTime

		if err := config.DB().Save(&schedule).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("บันทึก id %d ไม่สำเร็จ", input.ID)})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตตารางเรียบร้อยแล้ว"})
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
