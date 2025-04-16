package entity

import (
	"gorm.io/gorm"
)

type YearTerm struct {
	gorm.Model
	YearID uint
	Year   Year `gorm:"foreignKey:YearID"`

	TermID uint
	Term   Term `gorm:"foreignKey:TermID"`

	Selected      []Selected      `gorm:"foreignKey:YearTermID"`
	Schedule      []Schedule      `gorm:"foreignKey:YearTermID"`
	ServiceCenter []ServiceCenter `gorm:"foreignKey:YearTermID"`
}
