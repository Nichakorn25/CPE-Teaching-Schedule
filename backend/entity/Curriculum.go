package entity_test

import (
	"gorm.io/gorm"
)

type Curriculum struct{
	gorm.Model
	Name  string
	Year  uint
	Started  uint

	MajorID 	uint 	
	Major  	Major 			`gorm:"foreignKey:MajorID"`

	GC []GC `gorm:"foreignKey:CurriculumID"`
}