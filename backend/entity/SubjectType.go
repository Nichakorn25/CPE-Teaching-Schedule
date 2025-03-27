package entity_test

import (
	"gorm.io/gorm"
)

type SubjectType struct{
	gorm.Model
	Name string
}