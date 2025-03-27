package entity_test

import (
	"gorm.io/gorm"
)

type Day struct{
	gorm.Model
	Name  string
}