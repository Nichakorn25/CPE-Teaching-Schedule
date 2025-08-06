package entity

import (
	"time"
	"gorm.io/gorm"
)

type Condition struct {
	gorm.Model

	DayOfWeek string    `valid:"required~DayOfWeek is required."`
	StartTime time.Time `valid:"required~StartTime is required."`
	EndTime   time.Time `valid:"required~EndTime is required."`

	UserID uint `valid:"required~UserID is required."`
	User User `gorm:"foreignKey:UserID" valid:"-"`
}
