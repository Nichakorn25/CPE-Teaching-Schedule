package entity

import (
	"gorm.io/gorm"
)

type Major struct {
	gorm.Model
	MajorName string

	DepartmentID uint
	Department   Department `gorm:"foreignKey:DepartmentID"`

	Users      []User       `gorm:"foreignKey:MajorID"`
	Curriculum []Curriculum `gorm:"foreignKey:MajorID"`
}
