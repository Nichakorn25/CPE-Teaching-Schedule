package entity

import "gorm.io/gorm"

type Curriculum struct {
	gorm.Model
	CurriculumName string `json:"curriculumName" valid:"required~CurriculumName is required."`
	Year           uint   `json:"year"           valid:"required~Year is required."`
	Started        uint   `json:"started"        valid:"required~Started is required."`

	MajorID uint   `json:"majorId"              valid:"required~MajorID is required."`
	Major   Major  `gorm:"foreignKey:MajorID"   json:"-" valid:"-"`

	AllCourses []AllCourses `gorm:"foreignKey:CurriculumID" json:"-" valid:"-"`
}
