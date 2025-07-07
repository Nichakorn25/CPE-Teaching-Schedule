package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllRoles(c *gin.Context) {
	var roles []entity.Role
	config.DB().Find(&roles)
	c.JSON(http.StatusOK, roles)
}
