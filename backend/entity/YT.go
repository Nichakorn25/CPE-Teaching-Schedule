package entity

import (
	"gorm.io/gorm"
)

type YT struct {
	gorm.Model
	YearID uint
	Year   Year `gorm:"foreignKey:YearID"`

	TermID uint
	Term   Term `gorm:"foreignKey:TermID"`

	Selected      []Selected      `gorm:"foreignKey:YTID"`
	Schedule      []Schedule      `gorm:"foreignKey:YTID"`
	ServiceCenter []ServiceCenter `gorm:"foreignKey:YTID"`
}
