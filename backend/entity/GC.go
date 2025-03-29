package entity

import (
	"gorm.io/gorm"
)

type GC struct {
	gorm.Model
	GradeID uint
	Grade   Grade `gorm:"foreignKey:YearID"`

	CurriculumID uint
	Curriculum   Curriculum `gorm:"foreignKey:CurriculumID"`
}
