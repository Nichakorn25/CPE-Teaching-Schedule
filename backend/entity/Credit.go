package entity

import (
	"gorm.io/gorm"
)

type Credit struct {
	gorm.Model
	Unit    uint `valid:"required~Unit is required."`
	Lecture uint `valid:"required~Lecture is required."`
	Lab     uint `valid:"required~Lab is required."`
	Self    uint `valid:"required~Self is required."`

	AllCourses []AllCourses `gorm:"foreignKey:CreditID"`
}
