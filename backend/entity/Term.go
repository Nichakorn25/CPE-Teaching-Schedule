package entity

import (
	"gorm.io/gorm"
)

type Term struct{
	gorm.Model
	Term uint

	YearTerm []YearTerm `gorm:"foreignKey:TermID"`
}
