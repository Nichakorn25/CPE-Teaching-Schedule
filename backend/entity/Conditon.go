package entity

import (
	"gorm.io/gorm"
)

type Condition struct{
	gorm.Model
	InstructorID 	uint 	
	Instructor  	Instructor 			`gorm:"foreignKey:InstructorID"`

	DayID 	uint 	
	Day  	Day 			`gorm:"foreignKey:DayID"`

	PeriodID 	uint 	
	Period  	Period 			`gorm:"foreignKey:PeriodID"`
}