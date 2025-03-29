package entity_test

import (
	"gorm.io/gorm"
)

type Grade struct{
	gorm.Model
	Grade  uint

	GC []GC `gorm:"foreignKey:GradeID"`
}