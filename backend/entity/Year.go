package entity

import (
	"gorm.io/gorm"
)

type Year struct {
	gorm.Model
	Year uint
	YT   []YT `gorm:"foreignKey:YearID"`
}
