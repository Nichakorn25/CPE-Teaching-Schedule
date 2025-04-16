package entity

import (
	"gorm.io/gorm"
)

type SubjectType struct{
	gorm.Model
	Name string
	Subject []Subject `gorm:"foreignKey:SubjectTypeID"`
}