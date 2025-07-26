package controllers

import (
	"net/http"

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
		Preload("ScheduleTeachingAssistant.User").
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
