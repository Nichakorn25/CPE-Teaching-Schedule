package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username       string `gorm:"unique"`
	Password       string
	Firstname      string
	Lastname       string
	Image          string
	Email          string
	PhoneNumber    string
	Address        string
	FirstPassword bool

	TitleID uint
	Title   Title `gorm:"foreignKey:TitleID"`

	PositionID uint
	Position   Position `gorm:"foreignKey:PositionID"`

	MajorID uint
	Major   Major `gorm:"foreignKey:MajorID"`

	RoleID uint
	Role   Role `gorm:"foreignKey:RoleID"`

	Conditions     []Condition      `gorm:"foreignKey:UserID"`
	OfferedCourses []OfferedCourses `gorm:"foreignKey:UserID"`
	UserAllCourses []UserAllCourses `gorm:"foreignKey:UserID"`
}
