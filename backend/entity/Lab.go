package entity

import (
	"gorm.io/gorm"
)

type Lab struct{
	gorm.Model
	Section  uint
	Student  uint

	Selected []Selected `gorm:"foreignKey:LabID"`
}