package entity

import (
	"gorm.io/gorm"
)

type Major struct {
	gorm.Model
	Name       string
	Curriculum []Curriculum `gorm:"foreignKey:Major"`
	Subject    []Subject    `gorm:"foreignKey:Major"`
}
