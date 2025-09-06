package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type (
	TeacherResp struct {
		ID        uint   `json:"ID"`
		Title     string `json:"Title"`
		Firstname string `json:"Firstname"`
		Lastname  string `json:"Lastname"`
	}

	GroupInfo struct { //วิชาจากศูนย์บริการ
		Group    uint
		Room     string
		Day      string
		TimeSpan string
	}
	OpenCourseResp struct {
		ID           uint // ไว้ใช้ตอนลบและแก้ไข
		Year         uint
		Term         uint
		Code         string
		Name         string
		Credit       string
		Major        string
		Department   string
		TypeName     string
		TeacherID    uint
		Teachers     []TeacherResp
		GroupInfos   []GroupInfo // รายละเอียดกลุ่ม (เฉพาะศูนย์บริการ) // จะรวมกลุ่มเรียนทั้งหมดของวิชานั้น
		GroupTotal   uint        // จำนวนกลุ่มทั้งหมด
		CapacityPer  uint
		Remark       string // “วิชาจากศูนย์บริการ” หรือหมวดวิชา
		IsFixCourses bool   // true = วิชาที่มาจากศูนย์บริการ
	}
	CreateOfferedCourseInput struct {
		Year         uint `binding:"required"`
		Term         uint `binding:"required"`
		Section      uint
		Capacity     uint
		UserID       uint `binding:"required"`
		AllCoursesID uint `binding:"required"`
		LaboratoryID *uint
	}
	UpdateOfferedCourseInput struct {
		Year         *uint
		Term         *uint
		Section      *uint
		Capacity     *uint
		UserID       *uint
		AllCoursesID *uint
		LaboratoryID *uint
	}
)

func GetCountAllOffered(c *gin.Context) {
	yearQ := c.Query("year")
	termQ := c.Query("term")

	var count int64
	var offered entity.OfferedCourses

	err := config.DB().Find(&offered).
		Where("year = ? AND term = ?", yearQ, termQ).
		Count(&count).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการนับ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func GetOffered(c *gin.Context) {
	yearQ := c.Query("year")
	termQ := c.Query("term")
	majorName := c.Query("major_name")

	var offered []entity.OfferedCourses
	var count int64

	db := config.DB().
		Preload("AllCourses").
		Preload("AllCourses.Curriculum").
		Preload("AllCourses.Curriculum.Major").
		Where("year = ? AND term = ?", yearQ, termQ).
		Find(&offered)

	if db.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล"})
		return
	}

	filtered := make([]entity.OfferedCourses, 0)
	for _, o := range offered {
		if o.AllCourses.Curriculum.Major.MajorName == majorName {
			filtered = append(filtered, o)
		}
	}

	count = int64(len(filtered))

	c.JSON(http.StatusOK, gin.H{
		"count":   count,
		"results": filtered,
	})
}

func GetOpenCourses(c *gin.Context) {
	yearQ := c.Query("year")
	termQ := c.Query("term")
	search := strings.TrimSpace(c.Query("search"))

	db := config.DB().
		Model(&entity.OfferedCourses{}).
		Preload("User.Title").
		Preload("AllCourses.Credit").
		Preload("AllCourses.Curriculum.Major").
		Preload("AllCourses.Curriculum.Major.Department").
		Preload("AllCourses.TypeOfCourses").
		Order("year, term, all_courses_id")

	if y, err := strconv.Atoi(yearQ); err == nil && y > 0 {
		db = db.Where("year = ?", y)
	}
	if t, err := strconv.Atoi(termQ); err == nil && t > 0 {
		db = db.Where("term = ?", t)
	}
	if search != "" {
		like := "%" + search + "%"
		db = db.
			Joins("JOIN all_courses ON all_courses.id = offered_courses.all_courses_id").
			Where("all_courses.code LIKE ? OR all_courses.english_name LIKE ? OR all_courses.thai_name LIKE ?", like, like, like)
	}

	var offered []entity.OfferedCourses
	if err := db.Find(&offered).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลล้มเหลว"})
		return
	}

	resp := make([]OpenCourseResp, 0, len(offered))

	for _, oc := range offered {
		ac := oc.AllCourses
		credit := fmt.Sprintf("%d(%d‑%d‑%d)", ac.Credit.Unit, ac.Credit.Lecture, ac.Credit.Lab, ac.Credit.Self)
		// teacher := fmt.Sprintf("%s%s %s", oc.User.Title.Title, oc.User.Firstname, oc.User.Lastname)
		remark := ac.TypeOfCourses.TypeName

		var titleText string
		if oc.User.Title.Title != "" {
			titleText = oc.User.Title.Title
		}

		teachers := []TeacherResp{}
		if oc.User.ID != 0 {
			teachers = append(teachers, TeacherResp{
				ID:        oc.User.ID,
				Title:     titleText, // <-- ต้องเป็น string
				Firstname: oc.User.Firstname,
				Lastname:  oc.User.Lastname,
			})
		}

		groupInfos := make([]GroupInfo, 0)
		groupTotal := oc.Section

		if oc.IsFixCourses {
			var tfcs []entity.TimeFixedCourses
			if err := config.DB().Where("all_courses_id = ? AND year = ? AND term = ?", oc.AllCoursesID, oc.Year, oc.Term).
				Find(&tfcs).Error; err == nil {
				for _, tf := range tfcs {
					groupInfos = append(groupInfos, GroupInfo{
						Group: tf.Section,
						Room:  tf.RoomFix,
						Day:   tf.DayOfWeek,
						TimeSpan: fmt.Sprintf("%s‑%s",
							tf.StartTime.Format("15:04"),
							tf.EndTime.Format("15:04")),
					})
				}
			}
		} else {
			var schedules []entity.Schedule
			if err := config.DB().Where("offered_courses_id = ?", oc.ID).Find(&schedules).Error; err == nil {
				for _, sched := range schedules {
					groupInfos = append(groupInfos, GroupInfo{
						Group: sched.SectionNumber,
						Room:  "",
						Day:   sched.DayOfWeek,
						TimeSpan: fmt.Sprintf("%s‑%s",
							sched.StartTime.Format("15:04"),
							sched.EndTime.Format("15:04")),
					})
				}
			}
		}

		resp = append(resp, OpenCourseResp{
			ID:           oc.ID,
			Year:         oc.Year,
			Term:         oc.Term,
			Code:         ac.Code,
			Name:         ac.EnglishName,
			Credit:       credit,
			Major:        ac.Curriculum.Major.MajorName,
			Department:   ac.Curriculum.Major.Department.DepartmentName,
			TypeName:     ac.TypeOfCourses.TypeName,
			TeacherID:    oc.UserID,
			Teachers:     teachers,
			GroupInfos:   groupInfos,
			GroupTotal:   groupTotal,
			CapacityPer:  oc.Capacity,
			Remark:       remark,
			IsFixCourses: oc.IsFixCourses,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// ////////////////////////////////// add open course //////////////////////////
func CreateOfferedCourse(c *gin.Context) {
	var input CreateOfferedCourseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	offered := entity.OfferedCourses{
		Year:         input.Year,
		Term:         input.Term,
		Section:      input.Section,
		Capacity:     input.Capacity,
		IsFixCourses: false,
		UserID:       input.UserID,
		AllCoursesID: input.AllCoursesID,
		LaboratoryID: input.LaboratoryID,
	}

	if err := config.DB().Create(&offered).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างวิชาที่เปิดสอนได้"})
		return
	}
	c.JSON(http.StatusCreated, offered)
}

// ///////////////////////////////////////////////////////////////////
func UpdateOfferedCourse(c *gin.Context) {
	id := c.Param("id")

	var offered entity.OfferedCourses
	if err := config.DB().First(&offered, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบรายวิชาที่จะเปิดสอน"})
		return
	}

	var input UpdateOfferedCourseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Year != nil {
		offered.Year = *input.Year
	}
	if input.Term != nil {
		offered.Term = *input.Term
	}
	if input.Section != nil {
		offered.Section = *input.Section
	}
	if input.Capacity != nil {
		offered.Capacity = *input.Capacity
	}
	if input.UserID != nil {
		offered.UserID = *input.UserID
	}
	if input.AllCoursesID != nil {
		offered.AllCoursesID = *input.AllCoursesID
	}
	if input.LaboratoryID != nil {
		offered.LaboratoryID = input.LaboratoryID
	}

	if err := config.DB().Save(&offered).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตรายวิชาที่เปิดสอนได้"})
		return
	}
	c.JSON(http.StatusOK, offered)
}

func DeleteOfferedCourse(c *gin.Context) {
	id := c.Param("id")

	var offered entity.OfferedCourses
	if err := config.DB().First(&offered, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบรายวิชาที่จะเปิดสอน"})
		return
	}

	if err := config.DB().Delete(&offered).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบรายวิชาที่จะเปิดสอนได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบรายวิชาที่เปิดสอนสำเร็จ"})
}

// /////////////////////////// final-offerated
type SectionDetail struct {
	ID             uint
	SectionNumber  uint
	Room           string
	DayOfWeek      string
	Time           string
	Capacity       uint
	ID_user        uint
	InstructorName string
}

type OfferedCoursesDetail struct {
	ID            uint
	Code          string
	CourseName    string
	Credit        string
	TypeOfCourse  string
	TotalSections uint
	Sections      []SectionDetail
}

func GetOfferedCoursesAndSchedule(c *gin.Context) {
	majorName := c.Query("major_name")
	year := c.Query("year")
	term := c.Query("term")

	var offeredCourses []entity.OfferedCourses
	if err := config.DB().
		Preload("AllCourses.Credit").
		Preload("AllCourses.TypeOfCourses").
		Preload("AllCourses.Curriculum.Major").
		Preload("User").
		Preload("User.Title").
		Preload("Schedule.TimeFixedCourses").
		Preload("Laboratory").
		Where("year = ? AND term = ?", year, term).
		Find(&offeredCourses).Distinct("offered_courses.id").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	grouped := make(map[string]*OfferedCoursesDetail)

	for _, oc := range offeredCourses {
		if !oc.IsFixCourses && oc.AllCourses.Curriculum.Major.MajorName != majorName {
			continue
		}

		credit := fmt.Sprintf("%d(%d-%d-%d)",
			oc.AllCourses.Credit.Unit,
			oc.AllCourses.Credit.Lecture,
			oc.AllCourses.Credit.Lab,
			oc.AllCourses.Credit.Self,
		)

		if _, ok := grouped[oc.AllCourses.Code]; !ok {
			grouped[oc.AllCourses.Code] = &OfferedCoursesDetail{
				ID:            oc.ID,
				Code:          oc.AllCourses.Code,
				CourseName:    oc.AllCourses.ThaiName,
				Credit:        credit,
				TypeOfCourse:  oc.AllCourses.TypeOfCourses.TypeName,
				TotalSections: oc.Section,
				Sections:      []SectionDetail{},
			}
		}

		instructor := oc.User.Title.Title + " " + oc.User.Firstname + " " + oc.User.Lastname

		sectionMap := make(map[string]SectionDetail)

		if oc.IsFixCourses {
			for _, sch := range oc.Schedule {
				for _, tf := range sch.TimeFixedCourses {
					key := fmt.Sprintf("%d-%s-%s", tf.Section, tf.DayOfWeek, tf.StartTime)

					sectionMap[key] = SectionDetail{
						ID:             tf.ID,
						SectionNumber:  tf.Section,
						Room:           tf.RoomFix,
						DayOfWeek:      tf.DayOfWeek,
						Time:           tf.StartTime.Format("15:04") + " - " + tf.EndTime.Format("15:04"),
						Capacity:       tf.Capacity,
						ID_user:        oc.User.ID,
						InstructorName: instructor,
					}
				}
			}
		} else {
			for _, sch := range oc.Schedule {
				room := ""
				if oc.LaboratoryID != nil {
					room = oc.Laboratory.Room
				}
				key := fmt.Sprintf("%d-%s-%s", sch.SectionNumber, sch.DayOfWeek, sch.StartTime)

				sectionMap[key] = SectionDetail{
					ID:             sch.ID,
					SectionNumber:  sch.SectionNumber,
					Room:           room,
					DayOfWeek:      sch.DayOfWeek,
					Time:           sch.StartTime.Format("15:04") + " - " + sch.EndTime.Format("15:04"),
					Capacity:       oc.Capacity,
					ID_user:        oc.User.ID,
					InstructorName: instructor,
				}
			}
		}

		for _, sec := range sectionMap {
			grouped[oc.AllCourses.Code].Sections = append(grouped[oc.AllCourses.Code].Sections, sec)
		}
	}

	var responses []OfferedCoursesDetail
	for _, v := range grouped {
		responses = append(responses, *v)
	}

	c.JSON(http.StatusOK, responses)
}
