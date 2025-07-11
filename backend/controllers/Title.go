package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllTitles(c *gin.Context) {

	var titles []entity.Title
	config.DB().Preload("TeachingAssistants").Preload("Users").Find(&titles)

	c.JSON(http.StatusOK, titles)
}
