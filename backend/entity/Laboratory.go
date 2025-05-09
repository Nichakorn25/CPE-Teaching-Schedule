package entity

import (
	"gorm.io/gorm"
)

type Laboratory struct {
	gorm.Model
	Room     string
	Building string
	Capacity string

	OfferedCourses []OfferedCourses `gorm:"foreignKey:LaboratoryID"`
}
