package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type GroupInfo struct {
	Group    uint
	Room     string
	Day      string
	TimeSpan string
}

type OpenCourseResp struct {
	ID           uint
	Year         uint
	Term         uint
	Code         string
	Name         string
	Credit       string
	TypeName     string
	Teacher      string
	Groups       []GroupInfo
	SectionCount uint
	CapacityPer  uint
	Remark       string
	IsFixCourses bool
}

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

	if yearQ != "" {
		y, _ := strconv.Atoi(yearQ)
		db = db.Where("year = ?", y)
	}
	if termQ != "" {
		t, _ := strconv.Atoi(termQ)
		db = db.Where("term = ?", t)
	}

	if search != "" {
		like := "%" + search + "%"
		db = db.Joins("JOIN all_courses ON all_courses.id = offered_courses.all_courses_id").
			Where("all_courses.code LIKE ? OR all_courses.english_name LIKE ? OR all_courses.thai_name LIKE ?", like, like, like)
	}

	var offered []entity.OfferedCourses
	if err := db.Find(&offered).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"data": []OpenCourseResp{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลล้มเหลว"})
		return
	}

	resp := make([]OpenCourseResp, 0, len(offered))

	for _, oc := range offered {
		ac := oc.AllCourses

		credit := fmt.Sprintf("%d(%d‑%d‑%d)",
			ac.Credit.Unit, ac.Credit.Lecture, ac.Credit.Lab, ac.Credit.Self)

		teacher := fmt.Sprintf("%s%s %s",
			oc.User.Title.Title,
			oc.User.Firstname,
			oc.User.Lastname)

		remark := ac.TypeOfCourses.TypeName
		groupInfos := []GroupInfo{}

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
			Groups:       groupInfos,
			SectionCount: oc.Section,
			CapacityPer:  oc.Capacity,
			Remark:       remark,
			IsFixCourses: oc.IsFixCourses,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  resp,
		"total": len(resp),
	})
}
