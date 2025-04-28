package entity

import (
	"gorm.io/gorm"
)

type WorkStatus struct {
	gorm.Model
	Name        string
	Instructors []Instructor `gorm:"foreignKey:WorkStatusID"`
}
