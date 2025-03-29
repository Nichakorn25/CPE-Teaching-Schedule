package entity

import (
	"gorm.io/gorm"
)

type Grade struct {
	gorm.Model
	Grade uint

	GC []GC `gorm:"foreignKey:GradeID"`
}
