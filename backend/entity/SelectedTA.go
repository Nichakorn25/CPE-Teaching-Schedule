package entity

import (
	"gorm.io/gorm"
)

type SelectedTA struct {
	gorm.Model
	TeachingHours uint

	SelectedID uint
	Selected   Selected `gorm:"foreignKey:SelectedID"`

	TAID uint
	TA   TeachingAssistant `gorm:"foreignKey:TAID"`
}
