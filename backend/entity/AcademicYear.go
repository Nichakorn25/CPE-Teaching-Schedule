package entity

import (
	"gorm.io/gorm"
)

type AcademicYear struct {
	gorm.Model
	Level string

	AllCourses []AllCourses `gorm:"foreignKey:AcademicYearID"`
}
