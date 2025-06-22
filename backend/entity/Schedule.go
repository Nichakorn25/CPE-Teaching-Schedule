package entity

import (
	"time"

	"gorm.io/gorm"
)

type Schedule struct {
	gorm.Model
	NameTable     string
	SectionNumber uint
	DayOfWeek     string
	StartTime     time.Time
	EndTime       time.Time

	OfferedCoursesID uint
	OfferedCourses   OfferedCourses `gorm:"foreignKey:OfferedCoursesID"`

	TimeFixedCourses          []TimeFixedCourses          `gorm:"foreignKey:ScheduleID"`
	ScheduleTeachingAssistant []ScheduleTeachingAssistant `gorm:"foreignKey:ScheduleID"`
}
