package entity_test

import (
	"gorm.io/gorm"
)

type Branch struct{
	gorm.Model
	Name  string
}