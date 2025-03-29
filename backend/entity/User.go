package entity_test

import (
	"gorm.io/gorm"
)

type User struct{
	gorm.Model
	Username  string
	Password  string

	RoleID 	uint 	
	Role  	Role 			`gorm:"foreignKey:RoleID"`

	Instructor []Instructor `gorm:"foreignKey:UserID"`
	Admin []Admin `gorm:"foreignKey:UserID"`
}