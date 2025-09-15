package entity

import "gorm.io/gorm"

type AllCourses struct {
	gorm.Model
	Code        string `gorm:"uniqueIndex" valid:"required~Code is required."`
	EnglishName string `valid:"required~English name is required.,matches(^[A-Za-z ]+$)~English name must contain only letters."`
	ThaiName    string `valid:"required~ThaiName is required."`


	Ismain bool `valid:"-"` 

	CurriculumID    uint `valid:"required~CurriculumID is required."`
	Curriculum      Curriculum `gorm:"foreignKey:CurriculumID" json:"-" valid:"-"`

	AcademicYearID  *uint       `valid:"-"` 
	AcademicYear    AcademicYear `gorm:"foreignKey:AcademicYearID" json:"-" valid:"-"`

	TypeOfCoursesID uint `valid:"required~TypeOfCoursesID is required."`
	TypeOfCourses   TypeOfCourses `gorm:"foreignKey:TypeOfCoursesID" json:"-" valid:"-"`

	CreditID        uint `valid:"required~CreditID is required."`
	Credit          Credit `gorm:"foreignKey:CreditID" json:"-" valid:"-"`

	UserAllCourses   []UserAllCourses   `gorm:"foreignKey:AllCoursesID" json:"-" valid:"-"`
	OfferedCourses   []OfferedCourses   `gorm:"foreignKey:AllCoursesID" json:"-" valid:"-"`
	TimeFixedCourses []TimeFixedCourses `gorm:"foreignKey:AllCoursesID" json:"-" valid:"-"`
}
