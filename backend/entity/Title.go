package entity

import (
	"gorm.io/gorm"
)

type Title struct {
	gorm.Model
	Name        string
	Instructors []Instructor `gorm:"foreignKey:TitleID"`
}
