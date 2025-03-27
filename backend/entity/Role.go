package entity_test

import (
	"gorm.io/gorm"
)

type Role struct{
	gorm.Model
	Role  string
}