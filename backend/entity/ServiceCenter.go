package entity_test

import (
	"gorm.io/gorm"
)

type ServiceCenter struct{
	gorm.Model
	SubjectID 	uint 	
	Subject  	Subject 			`gorm:"foreignKey:SubjectID"`

	DayID 	uint 	
	Day  	Day 			`gorm:"foreignKey:DayID"`

	PeriodID 	uint 	
	Period  	Period 			`gorm:"foreignKey:PeriodID"`

	AdminID uint
	Admin   Admin `gorm:"foreignKey:AdminID"`

	YearTermID uint
	YearTerm   YearTerm `gorm:"foreignKey:YearTermID"`
}
