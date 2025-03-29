package entity

import (
	"gorm.io/gorm"
)

type Term struct {
	gorm.Model
	Term uint

	YT []YT `gorm:"foreignKey:TermID"`
}
