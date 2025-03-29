package entity_test

import (
	"gorm.io/gorm"
)

type Day struct{
	gorm.Model
	Name  string

	Schedule []Schedule `gorm:"foreignKey:Day"`
	ServiceCenter []ServiceCenter `gorm:"foreignKey:Day"`
	Condition []Condition `gorm:"foreignKey:Day"`
}