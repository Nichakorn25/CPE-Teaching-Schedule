package entity

import (
	"gorm.io/gorm"
)

type ScheduleTeachingAssistant struct {
	gorm.Model

	TeachingAssistantID uint
	TeachingAssistant   TeachingAssistant `gorm:"foreignKey:TeachingAssistantID"`

	ScheduleID uint
	Schedule   Schedule `gorm:"foreignKey:ScheduleID"`
}
