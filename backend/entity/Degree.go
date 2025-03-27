package entity_test

import (
	"gorm.io/gorm"
)

type Degree struct{
	gorm.Model
	Status  string
}