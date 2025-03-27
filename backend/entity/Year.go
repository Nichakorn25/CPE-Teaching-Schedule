package entity_test

import (
	"gorm.io/gorm"
)

type Year struct{
	gorm.Model
	Year uint
}