package entity

import (
	"gorm.io/gorm"
)

type Period struct{
	gorm.Model
	Period uint
	Start  string
	End  string

	Schedule []Schedule `gorm:"foreignKey:PeriodID"`
	ServiceCenter []ServiceCenter `gorm:"foreignKey:PeriodID"`
	Condition []Condition `gorm:"foreignKey:PeriodID"`
}