package entity

import (
	"gorm.io/gorm"
)

type TypeOfCourses struct {
	gorm.Model
	Type     uint
	TypeName string

	AllCourses []AllCourses `gorm:"foreignKey:TypeOfCoursesID"`
}
