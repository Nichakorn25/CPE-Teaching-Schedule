package entity_test

import (
	"gorm.io/gorm"
)

type Subject struct{
	gorm.Model
	Name  string

	GCID 	uint 	
	GC  	GC 			`gorm:"foreignKey:GCID"`

	MajorID 	uint 	
	Major  		Major 			`gorm:"foreignKey:MajorID"`

	UnitID 	uint 	
	Unit  		Unit 			`gorm:"foreignKey:UnitID"`

	SubjectTypeID 	uint 	
	SubjectType  	SubjectType 			`gorm:"foreignKey:SubjectTypeID"`

	Selected []Selected `gorm:"foreignKey:SubjectID"`
	ServiceCenter []ServiceCenter `gorm:"foreignKey:SubjectID"`
}