package entity

import (
	"time"

	"gorm.io/gorm"
)

type TimeFixedCourses struct {
	gorm.Model
	Year      uint
	Term      uint
	DayOfWeek string
	StartTime time.Time
	EndTime   time.Time
	RoomFix   string
	Section   uint
	Capacity  uint

	AllCoursesID uint
	AllCourses   AllCourses `gorm:"foreignKey:AllCoursesID"`
	ScheduleID   uint
	Schedule     Schedule `gorm:"foreignKey:ScheduleID"`
}
