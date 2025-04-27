package entity

import (
	"gorm.io/gorm"
)

type Major struct {
	gorm.Model
	Name         string
	DepartmentID uint
	Department   Department `gorm:"foreignKey:DepartmentID"`

	Curriculum  []Curriculum `gorm:"foreignKey:MajorID"`
	Subject     []Subject    `gorm:"foreignKey:MajorID"`
	Instructors []Instructor `gorm:"foreignKey:MajorID"`
}