package entity

import (
	"gorm.io/gorm"
)

type Title struct {
	gorm.Model
	Title string

	TeachingAssistants []TeachingAssistant `gorm:"foreignKey:TitleID"`
	Users              []User              `gorm:"foreignKey:TitleID"`
}
