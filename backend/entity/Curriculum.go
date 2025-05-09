package entity

import (
	"gorm.io/gorm"
)

type Curriculum struct {
	gorm.Model
	CurriculumName string
	Year           uint
	Started        uint

	MajorID uint
	Major   Major `gorm:"foreignKey:MajorID"`

	AllCourses []AllCourses `gorm:"foreignKey:CurriculumID"`
}
