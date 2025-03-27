package entity_test

import (
	"gorm.io/gorm"
)

type Period struct{
	gorm.Model
	Period uint
	Start  string
	End  string
}