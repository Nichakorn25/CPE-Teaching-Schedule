package entity

import (
	"gorm.io/gorm"
)

type TeachingAssistant struct {
	gorm.Model

	Firstname   string `valid:"required~Firstname is required.,alpha~Firstname must contain only letters."`
	Lastname    string `valid:"required~Lastname is required.,alpha~Lastname must contain only letters."`
	Email       string `valid:"required~Email is required.,email~Invalid email format."`
	PhoneNumber string `valid:"required~Phone number is required.,matches(^0[689]{1}[0-9]{8}$)~Invalid Thai phone number."`

	TitleID uint  `valid:"required~Title is required."`
	Title Title `gorm:"foreignKey:TitleID" valid:"-"`

	ScheduleTeachingAssistant []ScheduleTeachingAssistant `gorm:"foreignKey:TeachingAssistantID"`
}
