package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	UsernameID   string `gorm:"uniqueIndex"`
	Password string

	RoleID uint
	Role   Role `gorm:"foreignKey:RoleID"`

	Instructor []Instructor `gorm:"foreignKey:UserID"`
	Admin      []Admin      `gorm:"foreignKey:UserID"`
}
