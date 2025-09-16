package controllers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllCourseByID(c *gin.Context) {
	id := c.Param("id")

	var course entity.AllCourses
	if err := config.DB().
		Preload("Curriculum"). //
		Preload("Curriculum.Major"). //
		Preload("Curriculum.Major.Department"). //
		Preload("AcademicYear"). //
		Preload("TypeOfCourses").//
		Preload("Credit"). //
		Preload("UserAllCourses"). //
		Preload("UserAllCourses.User"). //
		Preload("UserAllCourses.User.Major"). //
		Preload("UserAllCourses.User.Major.Department"). //
		Preload("OfferedCourses"). //
		Preload("TimeFixedCourses"). //
		First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลวิชา"})
		return
	}

	c.JSON(http.StatusOK, course)
}


func GetAllCourses(c *gin.Context) {
	var courses []entity.AllCourses

	err := config.DB().Preload("Curriculum.Major").
		Preload("AcademicYear").
		Preload("TypeOfCourses").
		Preload("Credit").
		Preload("UserAllCourses.User").
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
			"ID":         course.ID,
			"No":         i + 1,
			"CourseCode": course.Code,
			"ThaiCourseName": course.ThaiName,
			"EnglishCourseName": course.EnglishName,
			"Credit":     fmt.Sprintf("%d (%d-%d-%d)", course.Credit.Unit, course.Credit.Lecture, course.Credit.Lab, course.Credit.Self),
			"CourseType": course.TypeOfCourses.TypeName,
			"Instructor": teachers,
			"CurriculumID": course.CurriculumID,
			"MajorName":    course.Curriculum.Major,
			"Ismain": course.Ismain,
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
	Unit            uint
	Lecture         uint
	Lab             uint
	Self            uint
	UserIDs         []uint
}

func CreateCourses(c *gin.Context) {
	var input AllCoursesInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var credit entity.Credit
	err := config.DB().Where("unit = ? AND lecture = ? AND lab = ? AND self = ?",
		input.Unit, input.Lecture, input.Lab, input.Self).First(&credit).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {

		credit = entity.Credit{
			Unit:    input.Unit,
			Lecture: input.Lecture,
			Lab:     input.Lab,
			Self:    input.Self,
		}
		if err := config.DB().Create(&credit).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างข้อมูลหน่วยกิตได้"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลหน่วยกิตได้"})
		return
	}

	course := entity.AllCourses{
		Code:            input.Code,
		EnglishName:     input.EnglishName,
		ThaiName:        input.ThaiName,
		CurriculumID:    input.CurriculumID,
		AcademicYearID:  input.AcademicYearID,
		TypeOfCoursesID: input.TypeOfCoursesID,
		CreditID:        credit.ID,
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

	c.JSON(http.StatusOK, gin.H{
		"message":   "เพิ่มรายวิชาและผู้สอนสำเร็จ",
		"course_id": course.ID,
	})
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

	var credit entity.Credit
	err := config.DB().Where("unit = ? AND lecture = ? AND lab = ? AND self = ?",
		in.Unit, in.Lecture, in.Lab, in.Self).First(&credit).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		credit = entity.Credit{
			Unit:    in.Unit,
			Lecture: in.Lecture,
			Lab:     in.Lab,
			Self:    in.Self,
		}
		if err := config.DB().Create(&credit).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างข้อมูลหน่วยกิตใหม่ได้"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถตรวจสอบข้อมูลหน่วยกิตได้"})
		return
	}

	course.Code = in.Code
	course.EnglishName = in.EnglishName
	course.ThaiName = in.ThaiName
	course.CurriculumID = in.CurriculumID
	course.AcademicYearID = in.AcademicYearID
	course.TypeOfCoursesID = in.TypeOfCoursesID
	course.CreditID = credit.ID

	// ใช้ Transaction เพื่อจัดการทั้งการอัปเดตวิชาและผู้สอน
	err = config.DB().Transaction(func(tx *gorm.DB) error {
		// (1) อัปเดตข้อมูลรายวิชา
		if err := tx.Save(&course).Error; err != nil {
			return err
		}

		// (2) ลบความสัมพันธ์ UserAllCourses เดิม
		if err := tx.Where("all_courses_id = ?", course.ID).Delete(&entity.UserAllCourses{}).Error; err != nil {
			return err
		}

		// (3) เพิ่มผู้สอนใหม่
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
