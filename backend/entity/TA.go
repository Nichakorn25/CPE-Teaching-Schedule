package entity

import (
	"gorm.io/gorm"
)

type TA struct {
	gorm.Model
	Name       string
	Nickname   string
	TotalHours uint

	StatusID uint
	Status   Status `gorm:"foreignKey:StatusID"`
}
