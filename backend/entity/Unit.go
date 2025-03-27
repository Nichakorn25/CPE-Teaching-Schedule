package entity_test

import (
	"gorm.io/gorm"
)

type Unit struct{
	gorm.Model
	Unit  string
	Lectrue  uint
	Lab  uint
	SelfStudy  uint
}