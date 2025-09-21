package entity

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username      string `gorm:"unique" valid:"required~Username is required.,matches(^[A-Za-z]+\\.[A-Za-z]$)~Username must start with letters and dot and end with one letter."`
	Password      string `valid:"required~Password is required.,minstringlength(8)~Password must be at least 8 characters."`
	Firstname     string `valid:"required~Firstname is required.,alpha~Firstname must contain only letters."`
	Lastname      string `valid:"required~Lastname is required.,alpha~Lastname must contain only letters."`
	Image         string `valid:"optional"`
	Email         string `gorm:"unique" valid:"required~Email is required.,email~Invalid email format."`
	PhoneNumber   string `valid:"required~Phone number is required.,matches(^[0-9]{10}$)~Phone number must be 10 digits."`
	Address       string `valid:"required~Address is required."`
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
