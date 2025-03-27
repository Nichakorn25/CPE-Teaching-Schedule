package entity_test

import (
	"gorm.io/gorm"
)

type TA struct{
	gorm.Model
	Name  string
	Nickname  string
	TotalHours  uint
}