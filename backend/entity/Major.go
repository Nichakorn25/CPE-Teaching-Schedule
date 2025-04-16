package entity_test

import (
	"gorm.io/gorm"
)

type Major struct{
	gorm.Model
	Name       string
	Curriculum []Curriculum `gorm:"foreignKey:MajorID"`
	Subject    []Subject    `gorm:"foreignKey:MajorID"`
}
