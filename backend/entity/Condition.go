package entity

import (
	"time"

	"gorm.io/gorm"
)

type Condition struct {
	gorm.Model
	DayOfWeek string
	StartTime time.Time
	EndTime   time.Time

	UserID uint
	User   User `gorm:"foreignKey:UserID"`
}
