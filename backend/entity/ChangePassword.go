package entity

import (
	"gorm.io/gorm"
)

type ChangePassword struct {
	gorm.Model
	UsernameID string
	Password   string
	Email      string

	StatusChangePasswordID uint
	StatusChangePassword   StatusChangePassword `gorm:"foreignKey:StatusChangePasswordID"`
}
