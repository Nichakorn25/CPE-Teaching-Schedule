package entity

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username    string `gorm:"uniqueIndex" json:"username" valid:"required~Username is required.,matches(^[A-Za-z][0-9]{5}$)~Username must be 1 letter followed by 5 digits."`
	Password    string `json:"password" valid:"required~Password is required.,minstringlength(8)~Password must be at least 8 characters."`
	Firstname   string `json:"firstname" valid:"required~Firstname is required.,alpha~Firstname must contain only letters."`
	Lastname    string `json:"lastname"  valid:"required~Lastname is required.,alpha~Lastname must contain only letters."`
	Image       string `json:"image"      valid:"optional"`
	Email       string `gorm:"uniqueIndex" json:"email" valid:"required~Email is required.,email~Invalid email format."`
	PhoneNumber string `json:"phoneNumber" valid:"required~Phone number is required.,matches(^[0-9]{10}$)~Phone number must be 10 digits."`
	Address     string `json:"address"     valid:"required~Address is required."`
	FirstPassword bool `json:"firstPassword" valid:"-"` 

	TitleID   uint  `json:"titleId"   valid:"required~TitleID is required."`
	Title     Title `gorm:"foreignKey:TitleID"   json:"-" valid:"-"`

	PositionID uint    `json:"positionId" valid:"required~PositionID is required."`
	Position   Position `gorm:"foreignKey:PositionID" json:"-" valid:"-"`

	MajorID uint `json:"majorId" valid:"required~MajorID is required."`
	Major   Major `gorm:"foreignKey:MajorID" json:"-" valid:"-"`

	RoleID uint `json:"roleId" valid:"required~RoleID is required."`
	Role   Role `gorm:"foreignKey:RoleID" json:"-" valid:"-"`

	Conditions     []Condition      `gorm:"foreignKey:UserID" json:"-" valid:"-"`
	OfferedCourses []OfferedCourses `gorm:"foreignKey:UserID" json:"-" valid:"-"`
	UserAllCourses []UserAllCourses `gorm:"foreignKey:UserID" json:"-" valid:"-"`
}
