package entity

import (
	"gorm.io/gorm"
)

type Credit struct {
	gorm.Model
	Unit    uint
	Lectrue uint
	Lab     uint
	Self    uint

	AllCourses []AllCourses `gorm:"foreignKey:CreditID"`
}
