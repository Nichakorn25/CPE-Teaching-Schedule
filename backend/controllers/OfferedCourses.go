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
		TypeName     string
		Teacher      string
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
)

func GetOpenCourses(c *gin.Context) {
	yearQ := c.Query("year")
	termQ := c.Query("term")
	search := strings.TrimSpace(c.Query("search"))

	db := config.DB().
		Model(&entity.OfferedCourses{}).
		Preload("User.Title").
		Preload("AllCourses.Credit").
		Preload("AllCourses.TypeOfCourses").
		Preload("AllCourses.TimeFixedCourses").
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

		credit := fmt.Sprintf("%d(%d‑%d‑%d)",
			ac.Credit.Unit, ac.Credit.Lecture, ac.Credit.Lab, ac.Credit.Self)

		teacher := fmt.Sprintf("%s%s %s",
			oc.User.Title.Title, oc.User.Firstname, oc.User.Lastname)

		remark := ac.TypeOfCourses.TypeName
		groupInfos := make([]GroupInfo, 0)
		groupTotal := oc.Section

		if oc.IsFixCourses {
			remark = "วิชาจากศูนย์บริการ"
			for _, tf := range ac.TimeFixedCourses {
				if tf.Year == oc.Year && tf.Term == oc.Term {
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
		}

		resp = append(resp, OpenCourseResp{
			ID:           oc.ID,
			Year:         oc.Year,
			Term:         oc.Term,
			Code:         ac.Code,
			Name:         ac.EnglishName,
			Credit:       credit,
			TypeName:     ac.TypeOfCourses.TypeName,
			Teacher:      teacher,
			GroupInfos:   groupInfos,
			GroupTotal:   groupTotal,
			CapacityPer:  oc.Capacity,
			Remark:       remark,
			IsFixCourses: oc.IsFixCourses,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

//////////////////////////////////// add open course //////////////////////////
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
