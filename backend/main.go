package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
)

const PORT = "8080"

func main() {
	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {

		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)

	})

	r.Run("localhost:" + PORT)
}
