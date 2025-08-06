package entity

import (
	"time"

	"gorm.io/gorm"
)

type TimeFixedCourses struct {
	gorm.Model

	Year      uint      `valid:"required~Year is required."`
	Term      uint      `valid:"required~Term is required."`
	DayOfWeek string    `valid:"required~DayOfWeek is required."`
	StartTime time.Time `valid:"required~StartTime is required."`
	EndTime   time.Time `valid:"required~EndTime is required."`
	RoomFix   string    `valid:"required~RoomFix is required."`
	Section   uint      `valid:"required~Section is required."`
	Capacity  uint      `valid:"required~Capacity is required."`

	AllCoursesID uint       `valid:"required~AllCoursesID is required."`
	AllCourses AllCourses `gorm:"foreignKey:AllCoursesID" valid:"-"`
	ScheduleID uint     `valid:"required~ScheduleID is required."`
	Schedule   Schedule   `gorm:"foreignKey:ScheduleID" valid:"-"`
}
