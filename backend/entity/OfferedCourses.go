package entity

import (
	"gorm.io/gorm"
)

type OfferedCourses struct {
	gorm.Model
	Year         uint
	Term         uint
	Section      uint
	Capacity     uint
	IsFixCourses bool

	UserID       uint
	User         User `gorm:"foreignKey:UserID"`
	AllCoursesID uint
	AllCourses   AllCourses `gorm:"foreignKey:AllCoursesID"`
	LaboratoryID *uint
	Laboratory   Laboratory `gorm:"foreignKey:LaboratoryID"`

	Schedule []Schedule `gorm:"foreignKey:OfferedCoursesID"`
}
