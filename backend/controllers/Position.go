package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllPosition(c *gin.Context) {

    var position []entity.Position
    config.DB().Preload("Users").Find(&position)

    c.JSON(http.StatusOK, position)
}
