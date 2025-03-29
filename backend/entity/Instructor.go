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

	UserID 	uint 	
	User  	User 			`gorm:"foreignKey:UserID"`

	PositionID 	uint 	
	Position  	Position 		`gorm:"foreignKey:PositionID"`

	Selected []Selected `gorm:"foreignKey:InstructorID"`
	Schedule []Schedule `gorm:"foreignKey:InstructorID"`
	Condition []Condition `gorm:"foreignKey:InstructorID"`
}