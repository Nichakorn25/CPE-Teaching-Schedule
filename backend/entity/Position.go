package entity

import (
	"gorm.io/gorm"
)

type Position struct {
	gorm.Model
	Position string
	Priority *uint

	Users []User `gorm:"foreignKey:PositionID"`
}
