package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllCurriculum(c *gin.Context) {

    var cur []entity.Curriculum
    config.DB().Preload("Major").Preload("Major.Department").Find(&cur)

    c.JSON(http.StatusOK, cur)
}
