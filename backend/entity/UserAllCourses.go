package entity

import (
	"gorm.io/gorm"
)

type UserAllCourses struct {
	gorm.Model

	UserID       uint
	User         User `gorm:"foreignKey:UserID"`
	AllCoursesID uint
	AllCourses   AllCourses `gorm:"foreignKey:AllCoursesID"`
}
