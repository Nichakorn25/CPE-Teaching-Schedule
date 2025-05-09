package entity

import (
	"gorm.io/gorm"
)

type Role struct {
	gorm.Model
	Role string

	Users []User `gorm:"foreignKey:RoleID"`
}
