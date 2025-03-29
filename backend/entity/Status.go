package entity_test

import (
	"gorm.io/gorm"
)

type Status struct{
	gorm.Model
	Status  string

	TA []TA `gorm:"foreignKey:StatusID"`
}