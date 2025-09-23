package main

import (
	"net/http"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/controllers"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/middleware"
	"github.com/gin-gonic/gin"
)

const PORT = "8001"

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
		r.GET("/all-courses", controllers.GetAllCourses) 
		r.GET("/all-courses/:id", controllers.GetAllCourseByID)
		r.POST("/courses", controllers.CreateCourses)
		r.PUT("/update-courses/:id", controllers.UpdateAllCourses)
		r.DELETE("/delete-courses/:id", controllers.DeleteAllCourses)

		///////////////////// USER /////////////////////////
		r.GET("/all-instructor", controllers.GetTeachers)
		r.GET("/all-teachers", controllers.GetAllTeachers)
		r.GET("/users/:id", controllers.GetUserByID)
		r.POST("/users", controllers.CreateUser)
		r.PUT("/update-users/:id", controllers.UpdateUser)
		r.DELETE("/delete-users/:id", controllers.DeleteUser)

		///////////////////// openCourse /////////////////////////
		r.GET("/all-count-offered", controllers.GetCountAllOffered)
		r.GET("/offered", controllers.GetOffered)
		r.GET("/open-courses", controllers.GetOpenCourses)
		r.POST("/offered-courses", controllers.CreateOfferedCourse)
		r.PUT("/offered-courses/:id", controllers.UpdateOfferedCourse)
		r.DELETE("/delete-offered-courses/:id", controllers.DeleteOfferedCourse)

		///////////////////// Condition /////////////////////////
		r.POST("/condition", controllers.CreateConditions)
		r.PUT("/update-conditions", controllers.UpdateConditions)
		r.GET("/conditions", controllers.GetAllCondition)
		r.GET("/conditions/user/:userID", controllers.GetConditionByuserID)
		r.DELETE("/conditions-user/:userID", controllers.DeleteConditionsByUser)

		///////////////////// TeachingAssistant /////////////////////////
		r.GET("/teaching-assistants/:id", controllers.GetTeachingAssistantByID)
		r.GET("/all-teaching-assistants", controllers.GetAllTeachingAssistants)
 		r.POST("/create-teaching-assistants", controllers.CreateTeachingAssistant)
		r.PUT("/update-teaching-assistants/:id", controllers.UpdateTeachingAssistant)
		r.DELETE("/delete-teaching-assistants/:id", controllers.DeleteTeachingAssistant)

		///////////////////// TimeFixedCourses /////////////////////////
		r.POST("/offered-courses/fixed", controllers.CreateFixedCourse)
		r.PUT("/up-fixed/:id", controllers.UpdateFixedCourse)

		///////////////////// Schedules /////////////////////////
		r.GET("/schedules", controllers.GetScheduleByNameTable)
		r.POST("/auto-generate-schedule", controllers.AutoGenerateSchedule)
		r.GET("/unique-nametables", controllers.GetNameTable)
		r.PUT("/up-schedule/:id", controllers.UpdateScheduleTime)
		r.DELETE("/delete-schedule/:nameTable", controllers.DeleteScheduleByNameTable)

		///////////////////// SchedulesTeachingAssistant /////////////////////////
		r.POST("/ScheduleTeachingAssistants", controllers.CreateScheduleTeachingAssistant)
		r.POST("/assign-ta-to-schedule", controllers.AssignTAToSchedule)
		
		///////////////////// Get into dropdown /////////////////////////
		r.GET("/course-type", controllers.GetTypeOfCourses)
		r.GET("/all-title", controllers.GetAllTitles)
		r.GET("/all-position", controllers.GetAllPosition)
		r.GET("/all-majors", controllers.GetAllMajorOfDepathment)
		r.GET("/all-roles", controllers.GetAllRoles)
		r.GET("/all-academic-years", controllers.GetAllAcademicYears)
		r.GET("/all-curriculum", controllers.GetAllCurriculum)
		r.GET("/all-laboratory", controllers.GetLaboratory)
		r.GET("/all-department", controllers.GetAllDepartment)

		r.GET("/offered-courses-schedule", controllers.GetOfferedCoursesAndSchedule) 
		r.GET("/offered-courses-schedule/:id", controllers.GetOfferedCoursesAndSchedulebyID) 
		r.GET("/offered-course-filter/:major_id/:department_id/:toc_id", controllers.GetOpenCoursesByFilters) // แบบ path
		r.DELETE("/remove-teaching-assistant/:sectionID/:taID", controllers.RemoveTeachingAssistant)
        r.PUT("/update-teaching-assistants", controllers.UpdateTeachingAssistants)
		
		r.POST("/curriculum", controllers.CreateCurriculum)
		r.GET("/curriculum/:id", controllers.GetCurriculumById)
		r.POST("/curriculum-into-allcourse/:id", controllers.DuplicateAllCoursesIntoCurriculum)
		r.PUT("/curriculum/:id", controllers.UpdateCurriculum)

		r.POST("/lab", controllers.CreateLaboratory)
		r.GET("/lab/:id", controllers.GetLaboratoryByID)
		r.PUT("/lab/:id", controllers.UpdateLaboratory)
		r.DELETE("/lab/:id", controllers.DeleteLaboratory)
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
