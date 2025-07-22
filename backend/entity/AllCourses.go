package entity

import (
	"gorm.io/gorm"
)

type AllCourses struct {
	gorm.Model
	Code        string `gorm:"unique"`
	EnglishName string
	ThaiName    string

	CurriculumID    uint
	Curriculum      Curriculum `gorm:"foreignKey:CurriculumID"`
	AcademicYearID  *uint
	AcademicYear    AcademicYear `gorm:"foreignKey:AcademicYearID"`
	TypeOfCoursesID uint
	TypeOfCourses   TypeOfCourses `gorm:"foreignKey:TypeOfCoursesID"`
	CreditID        uint
	Credit          Credit `gorm:"foreignKey:CreditID"`

	UserAllCourses   []UserAllCourses   `gorm:"foreignKey:AllCoursesID"`
	OfferedCourses   []OfferedCourses   `gorm:"foreignKey:AllCoursesID"`
	TimeFixedCourses []TimeFixedCourses `gorm:"foreignKey:AllCoursesID"`
}
