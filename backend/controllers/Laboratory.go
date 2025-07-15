package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetLaboratory(c *gin.Context) {

    var lab []entity.Laboratory
    config.DB().Find(&lab)

    c.JSON(http.StatusOK, lab)
}
