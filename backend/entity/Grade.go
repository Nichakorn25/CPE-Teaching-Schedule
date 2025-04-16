package entity

import (
	"gorm.io/gorm"
)

type Grade struct{
	gorm.Model
	Grade  uint

	GradeCurriculum []GradeCurriculum `gorm:"foreignKey:GradeID"`
}
