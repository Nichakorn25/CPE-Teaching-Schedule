package entity

import (
	"gorm.io/gorm"
)

type Position struct {
	gorm.Model
	Position string
	Priority uint

	Instructor []Instructor `gorm:"foreignKey:PositionID"`
}
