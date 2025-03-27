package entity_test

import (
	"gorm.io/gorm"
)

type Instructor struct{
	gorm.Model
	FirstName string
	LastName string
	Email string
	Phone string
	Degree string
}