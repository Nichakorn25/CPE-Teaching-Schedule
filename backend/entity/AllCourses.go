package entity

import (
	"gorm.io/gorm"
)

type AllCourses struct {
	gorm.Model
	Code string `gorm:"unique" valid:"required~Code is required."`
	EnglishName string `valid:"required~English name is required.,alpha~English name must contain only letters."`
	ThaiName    string	`valid:"required~ThaiName is required."`
	Ismain	 	bool   `valid:"required~ismain is required."`

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
