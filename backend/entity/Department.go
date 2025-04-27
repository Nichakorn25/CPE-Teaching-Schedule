package entity

import (
	"gorm.io/gorm"
)

type Department struct {
	gorm.Model
	Name string

	Instructors []Instructor `gorm:"foreignKey:DepartmentID"`
	Majors      []Major      `gorm:"foreignKey:DepartmentID"`
}
