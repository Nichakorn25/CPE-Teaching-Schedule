package entity_test

import (
	"gorm.io/gorm"
)

type Term struct{
	gorm.Model
	Term uint
}