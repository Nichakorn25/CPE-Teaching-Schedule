package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllInstructors(c *gin.Context) {
	var instructors []map[string]interface{}

	err := config.DB().Table("instructors").
		Select(`instructors.id, instructors.image, instructors.first_name, instructors.last_name,instructors.email, instructors.access_date, 
				titles.name AS title, users.username_id, positions.position, departments.name AS department, majors.name AS major, 
				work_statuses.name AS work_status`).
		Joins(`LEFT JOIN titles ON titles.id = instructors.title_id`).
		Joins(`LEFT JOIN users ON users.id = instructors.user_id`).
		Joins(`LEFT JOIN positions ON positions.id = instructors.position_id`).
		Joins(`LEFT JOIN departments ON departments.id = instructors.department_id`).
		Joins(`LEFT JOIN majors ON majors.id = instructors.major_id`).
		Joins(`LEFT JOIN work_statuses ON work_statuses.id = instructors.work_status_id`).
		Scan(&instructors).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลผู้สอนทั้งหมดได้"})
		return
	}

	c.JSON(http.StatusOK, instructors)
}

func CreateInstructor(c *gin.Context) {
	var input struct {
		Image        string
		FirstName    string
		LastName     string
		Email        string
		Phone        string
		AccessDate   time.Time
		TitleID      uint
		PositionID   uint
		DepartmentID uint
		MajorID      uint
		WorkStatusID uint

		User struct {
			UsernameID string
			Password   string
			RoleID     uint
		}
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := entity.User{
		UsernameID: input.User.UsernameID,
		Password:   input.User.Password,
		RoleID:     input.User.RoleID,
	}

	if err := config.DB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง User ได้: " + err.Error()})
		return
	}

	instructor := entity.Instructor{
		Image:        input.Image,
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		Email:        input.Email,
		Phone:        input.Phone,
		AccessDate:   input.AccessDate,
		TitleID:      input.TitleID,
		PositionID:   input.PositionID,
		DepartmentID: input.DepartmentID,
		MajorID:      input.MajorID,
		WorkStatusID: input.WorkStatusID,
		UserID:       user.ID,
	}

	if instructor.AccessDate.IsZero() {
		instructor.AccessDate = time.Now()
	}

	if err := config.DB().Create(&instructor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Instructor ได้: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": instructor})
}

func UpdateInstructor(c *gin.Context) {
	var instructor entity.Instructor
	var input map[string]interface{}
	id := c.Param("id")

	if err := config.DB().First(&instructor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instructor ไม่พบ"})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if titleID, ok := input["TitleID"].(float64); ok {
		var title entity.Title
		if err := config.DB().First(&title, uint(titleID)).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "TitleID ที่ระบุไม่พบในระบบ"})
			return
		}
	}

	if err := config.DB().Model(&instructor).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดต Instructor ได้: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": instructor})
}

func DeleteInstructor(c *gin.Context) {
	var instructor entity.Instructor
	id := c.Param("id")

	if err := config.DB().Preload("User").First(&instructor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instructor ไม่พบ"})
		return
	}

	if err := config.DB().Delete(&instructor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบ Instructor ได้: " + err.Error()})
		return
	}

	if err := config.DB().Delete(&entity.User{}, instructor.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบ User ได้: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "ลบสำเร็จ"})
}
