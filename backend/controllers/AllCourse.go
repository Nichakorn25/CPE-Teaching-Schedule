package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllCourses(c *gin.Context) {
	var courses []entity.AllCourses

	err := config.DB().Preload("Curriculum.Major").
		Preload("AcademicYear").
		Preload("TypeOfCourses").
		Preload("Credit").
		Preload("UserAllCourses.User.Title").
		Find(&courses).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	var result []gin.H

	for i, course := range courses {
		var teachers []string
		for _, uac := range course.UserAllCourses {
			fullname := fmt.Sprintf("%s%s %s", uac.User.Title.Title, uac.User.Firstname, uac.User.Lastname)
			teachers = append(teachers, fullname)
		}

		result = append(result, gin.H{
			"ลำดับ":         i + 1,
			"รหัสวิชา":      course.Code,
			"ชื่อวิชา":      course.EnglishName,
			"หน่วยกิต":      fmt.Sprintf("%d (%d-%d-%d)", course.Credit.Unit, course.Credit.Lecture, course.Credit.Lab, course.Credit.Self),
			"หมวดวิชา":      course.TypeOfCourses.TypeName,
			"อาจารย์ผู้สอน": strings.Join(teachers, ", "),
		})
	}

	c.JSON(http.StatusOK, result)
}

// /////////////////////////////////////
type AllCoursesInput struct {
	Code            string
	EnglishName     string
	ThaiName        string
	CurriculumID    uint
	AcademicYearID  *uint
	TypeOfCoursesID uint
	CreditID        uint
	UserIDs         []uint
}

func CreateCourses(c *gin.Context) {
	var input AllCoursesInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	course := entity.AllCourses{
		Code:            input.Code,
		EnglishName:     input.EnglishName,
		ThaiName:        input.ThaiName,
		CurriculumID:    input.CurriculumID,
		AcademicYearID:  input.AcademicYearID,
		TypeOfCoursesID: input.TypeOfCoursesID,
		CreditID:        input.CreditID,
	}

	if err := config.DB().Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่มข้อมูลรายวิชาล้มเหลว"})
		return
	}

	var userAllCourses []entity.UserAllCourses
	for _, userID := range input.UserIDs {
		userAllCourses = append(userAllCourses, entity.UserAllCourses{
			UserID:       userID,
			AllCoursesID: course.ID,
		})
	}

	if len(userAllCourses) > 0 {
		if err := config.DB().Create(&userAllCourses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่มผู้สอนล้มเหลว"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "เพิ่มรายวิชาและผู้สอนสำเร็จ", "course_id": course.ID})
}

func UpdateAllCourses(c *gin.Context) {
	id := c.Param("id")

	var course entity.AllCourses
	if err := config.DB().Preload("UserAllCourses").First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบรายวิชา"})
		return
	}

	var in AllCoursesInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}

	course.Code = in.Code
	course.EnglishName = in.EnglishName
	course.ThaiName = in.ThaiName
	course.CurriculumID = in.CurriculumID
	course.AcademicYearID = in.AcademicYearID
	course.TypeOfCoursesID = in.TypeOfCoursesID
	course.CreditID = in.CreditID

	err := config.DB().Transaction(func(tx *gorm.DB) error {
		// (4.1) บันทึกฟิลด์หลัก
		if err := tx.Save(&course).Error; err != nil {
			return err
		}

		// (4.2) จัดการความสัมพันธ์ UserAllCourses
		// ลบของเดิมทั้งหมด แล้วสร้างใหม่จาก in.UserIDs (ง่ายที่สุด)
		if err := tx.Where("all_courses_id = ?", course.ID).Delete(&entity.UserAllCourses{}).Error; err != nil {
			return err
		}
		if len(in.UserIDs) > 0 {
			var links []entity.UserAllCourses
			for _, uid := range in.UserIDs {
				links = append(links, entity.UserAllCourses{
					UserID:       uid,
					AllCoursesID: course.ID,
				})
			}
			if err := tx.Create(&links).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตรายวิชาไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตรายวิชาสำเร็จ"})
}

func DeleteAllCourses(c *gin.Context) {
	id := c.Param("id")

	err := config.DB().Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("all_courses_id = ?", id).Delete(&entity.UserAllCourses{}).Error; err != nil {
			return err
		}

		if err := tx.Delete(&entity.AllCourses{}, id).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบรายวิชาไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบรายวิชาสำเร็จ"})
}
