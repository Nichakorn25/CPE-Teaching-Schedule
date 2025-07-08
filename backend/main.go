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
		///////////////////// AllCourses /////////////////////////
		r.GET("/all-courses", controllers.GetAllCourses) //
		r.POST("/courses", controllers.CreateCourses)
		r.PUT("/update-courses/:id", controllers.UpdateAllCourses)
		r.DELETE("/delete-courses/:id", controllers.DeleteAllCourses)

		///////////////////// USER /////////////////////////
		r.GET("/all-teachers", controllers.GetAllTeachers) 
		r.GET("/users/:id", controllers.GetUserByID)
		r.POST("/users", controllers.CreateUser)
		r.PUT("/update-users/:id", controllers.UpdateUser)
		r.DELETE("/delete-users/:id", controllers.DeleteUser)

		///////////////////// openCourse /////////////////////////
		r.GET("/open-courses", controllers.GetOpenCourses)

		///////////////////// Condition /////////////////////////
		r.POST("/condition", controllers.CreateConditions)
		r.PUT("/update-conditions", controllers.UpdateConditions)
		r.GET("/conditions", controllers.GetAllCondition)
		r.GET("/conditions/user/:userID", controllers.GetConditionByuserID)
		r.DELETE("/conditions-user/:userID", controllers.DeleteConditionsByUser)

		///////////////////// Get into dropdown /////////////////////////
		r.GET("/course-type", controllers.GetTypeOfCourses)
		r.GET("/all-title", controllers.GetAllTitles)
		r.GET("/all-position", controllers.GetAllPosition)
		r.GET("/all-majors", controllers.GetAllMajorOfDepathment)
		r.GET("/all-roles", controllers.GetAllRoles)
		r.GET("/all-academic-years", controllers.GetAllAcademicYears)

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
