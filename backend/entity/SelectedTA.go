package entity_test

import (
	"gorm.io/gorm"
)

type SelectedTA struct{
	gorm.Model
	TeachingHours  uint
}