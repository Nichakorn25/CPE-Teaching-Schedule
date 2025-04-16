package entity

import (
	"gorm.io/gorm"
)

type Year struct {
	gorm.Model
	Year uint
	YearTerm   []YearTerm `gorm:"foreignKey:YearID"`
}
