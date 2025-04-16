package entity_test

import (
	"gorm.io/gorm"
)

type Day struct{
	gorm.Model
	Name  string

	Schedule      []Schedule      `gorm:"foreignKey:DayID"`
	ServiceCenter []ServiceCenter `gorm:"foreignKey:DayID"`
	Condition     []Condition     `gorm:"foreignKey:DayID"`
}
