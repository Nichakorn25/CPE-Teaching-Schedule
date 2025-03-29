package entity

import (
	"gorm.io/gorm"
)

type Schedule struct {
	gorm.Model
	YTID uint
	YT   YT `gorm:"foreignKey:YTID"`

	SelectedID uint
	Selected   Selected `gorm:"foreignKey:SelectedID"`

	InstructorID uint
	Instructor   Instructor `gorm:"foreignKey:InstructorID"`

	DayID uint
	Day   Day `gorm:"foreignKey:DayID"`

	PeriodID uint
	Period   Period `gorm:"foreignKey:PeriodID"`
}
