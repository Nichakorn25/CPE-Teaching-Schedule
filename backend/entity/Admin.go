package entity_test

import (
	"gorm.io/gorm"
)

type Admin struct{
	gorm.Model
	FirstName string
	LastName string
	Email string
	Phone string
}