package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllAcademicYears(c *gin.Context) {
	var level []entity.AcademicYear
	config.DB().Find(&level)
	c.JSON(http.StatusOK, level)
}
