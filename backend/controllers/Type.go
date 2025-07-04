package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetTypeOfCourses(c *gin.Context) {
	var types []entity.TypeOfCourses
	if err := config.DB().Find(&types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลหมวดวิชาได้"})
		return
	}
	c.JSON(http.StatusOK, types)
}
