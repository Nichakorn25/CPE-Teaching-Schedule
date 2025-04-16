package entity

import (
	"gorm.io/gorm"
)

type GradeCurriculum struct {
	gorm.Model
	GradeID uint
	Grade   Grade `gorm:"foreignKey:GradeID"`

	CurriculumID uint
	Curriculum   Curriculum `gorm:"foreignKey:CurriculumID"`
	
	Subject []Subject `gorm:"foreignKey:GradeCurriculumID"`
}
