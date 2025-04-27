package entity

import (
	"time"

	"gorm.io/gorm"
)

type Instructor struct {
	gorm.Model
	Image      string
	FirstName  string
	LastName   string
	Email      string
	Phone      string
	AccessDate time.Time

	TitleID uint
	Title   Title

	UserID uint
	User   User `gorm:"foreignKey:UserID"`

	PositionID uint
	Position   Position `gorm:"foreignKey:PositionID"`

	DepartmentID uint
	Department   Department `gorm:"foreignKey:DepartmentID"`

	MajorID uint
	Major   Major `gorm:"foreignKey:MajorID"`

	Selected  []Selected  `gorm:"foreignKey:InstructorID"`
	Schedule  []Schedule  `gorm:"foreignKey:InstructorID"`
	Condition []Condition `gorm:"foreignKey:InstructorID"`
}
