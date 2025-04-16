package entity

import (
	"gorm.io/gorm"
)

type Unit struct{
	gorm.Model
	Unit  string
	Lectrue  uint
	Lab  uint
	SelfStudy  uint

	Subject []Subject `gorm:"foreignKey:UnitID"`
}