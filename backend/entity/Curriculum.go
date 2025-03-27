package entity_test

import (
	"gorm.io/gorm"
)

type Curriculum struct{
	gorm.Model
	Name  string
	Year  uint
	Started  uint
}