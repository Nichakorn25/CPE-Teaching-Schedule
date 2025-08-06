package entity

import (
	"gorm.io/gorm"
)

type OfferedCourses struct {
	gorm.Model

	Year         uint `valid:"required~Year is required."`
	Term         uint `valid:"required~Term is required."`
	Section      uint `valid:"required~Section is required."`
	Capacity     uint `valid:"required~Capacity is required."`
	IsFixCourses bool

	UserID       uint `valid:"required~UserID is required."`
	User         User `gorm:"foreignKey:UserID" valid:"-"`

	AllCoursesID uint       `valid:"required~AllCoursesID is required."`
	AllCourses   AllCourses `gorm:"foreignKey:AllCoursesID" valid:"-"`

	LaboratoryID *uint
	Laboratory   Laboratory `gorm:"foreignKey:LaboratoryID" valid:"-"`

	Schedule []Schedule `gorm:"foreignKey:OfferedCoursesID"`
}
