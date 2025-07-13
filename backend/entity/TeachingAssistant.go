package entity

import (
	"gorm.io/gorm"
)

type TeachingAssistant struct {
	gorm.Model
	Firstname   string
	Lastname    string
	Email    string
	PhoneNumber string

	TitleID uint
	Title   Title `gorm:"foreignKey:TitleID"`

	ScheduleTeachingAssistant []ScheduleTeachingAssistant `gorm:"foreignKey:TeachingAssistantID"`
}
