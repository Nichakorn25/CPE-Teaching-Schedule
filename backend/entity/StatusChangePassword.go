package entity

import (
	"gorm.io/gorm"
)

type StatusChangePassword struct {
	gorm.Model
	StatusName      string
	
	StatusChangePasswords []ChangePassword `gorm:"foreignKey:StatusChangePasswordID"`
}
