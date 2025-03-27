package entity_test

import (
	"gorm.io/gorm"
)

type Selected struct{
	gorm.Model
	Section  uint
	Student  uint
}