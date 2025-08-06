package entity

import (
	"gorm.io/gorm"
)

type Major struct {
	gorm.Model
	MajorName string `valid:"required~MajorName is required."`

	DepartmentID uint       `valid:"required~DepartmentID is required."`
	Department   Department `gorm:"foreignKey:DepartmentID"`

	Users      []User       `gorm:"foreignKey:MajorID"`
	Curriculum []Curriculum `gorm:"foreignKey:MajorID"`
}
