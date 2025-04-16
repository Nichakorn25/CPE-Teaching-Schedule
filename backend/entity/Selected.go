package entity

import (
	"gorm.io/gorm"
)

type Selected struct {
	gorm.Model
	Section uint
	Student uint

	InstructorID uint
	Instructor   Instructor `gorm:"foreignKey:InstructorID"`

	YearTermID uint
	YearTerm   YearTerm `gorm:"foreignKey:YearTermID"`

	SubjectID uint
	Subject   Subject `gorm:"foreignKey:SubjectID"`

	LabID uint
	Lab   Lab `gorm:"foreignKey:LabID"`

	SelectedTA []SelectedTA `gorm:"foreignKey:SelectedID"`
	Schedule   []Schedule   `gorm:"foreignKey:SelectedID"`
}
