package entity_test

import (
	"gorm.io/gorm"
)

type Subject struct{
	gorm.Model
	Name  string
}