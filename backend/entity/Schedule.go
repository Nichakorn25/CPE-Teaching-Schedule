package entity

import (
	"time"
	"gorm.io/gorm"
)

type Schedule struct {
	gorm.Model

	NameTable     string    `valid:"required~NameTable is required."`
	SectionNumber uint      `valid:"required~SectionNumber is required."`
	DayOfWeek     string    `valid:"required~DayOfWeek is required."`
	StartTime     time.Time `valid:"required~StartTime is required."`
	EndTime       time.Time `valid:"required~EndTime is required."`

	OfferedCoursesID uint           `valid:"required~OfferedCoursesID is required."`
	OfferedCourses OfferedCourses `gorm:"foreignKey:OfferedCoursesID" valid:"-"`

	TimeFixedCourses          []TimeFixedCourses          `gorm:"foreignKey:ScheduleID"`
	ScheduleTeachingAssistant []ScheduleTeachingAssistant `gorm:"foreignKey:ScheduleID"`
}
