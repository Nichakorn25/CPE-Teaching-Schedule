package main

import (
	"net/http"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/controllers"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/middleware"
	"github.com/gin-gonic/gin"
)

const PORT = "8080"

func main() {
	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()
	r.Use(CORSMiddleware())

	r.POST("/signin", controllers.SignInUser)
	r.PATCH("/change-password", controllers.ChangePassword)

	router := r.Group("/")
	{
		router.Use(middleware.Authorizes())

	}

	r.GET("/", func(c *gin.Context) {

		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)

	})

	r.Run("localhost:" + PORT)
}

func CORSMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {

		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {

			c.AbortWithStatus(204)
			return

		}
		c.Next()
	}
}
