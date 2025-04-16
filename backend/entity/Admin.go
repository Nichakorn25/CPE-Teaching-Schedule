package entity

import (
	"gorm.io/gorm"
)

type Admin struct{
	gorm.Model
	FirstName string
	LastName string
	Email string
	Phone string

	ServiceCenter []ServiceCenter `gorm:"foreignKey:AdminID"`

	UserID uint
	User   User `gorm:"foreignKey:UserID"`
}