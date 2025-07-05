package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllMajorOfDepathment(c *gin.Context) {
	var majors []entity.Major
	config.DB().Preload("Department").Find(&majors)
	c.JSON(http.StatusOK, majors)
}
