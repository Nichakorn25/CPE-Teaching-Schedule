package entity

import (
	"gorm.io/gorm"
)

type AcademicYear struct {
	gorm.Model
	Level uint

	AllCourses []AllCourses `gorm:"foreignKey:AcademicYearID"`
}
