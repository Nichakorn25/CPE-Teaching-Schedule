package entity

import (
	"gorm.io/gorm"
)

type Curriculum struct {
	gorm.Model
	CurriculumName string `valid:"required~CurriculumName is required."`
	Year           uint   `valid:"required~Year is required."`
	Started        uint   `valid:"required~Started is required."`

	MajorID uint
	Major   Major `gorm:"foreignKey:MajorID"`

	AllCourses []AllCourses `gorm:"foreignKey:CurriculumID"`
}
