package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestAllCoursesValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Code is required", func(t *testing.T) {
		course := entity.AllCourses{
			Code:         "",
			EnglishName:  "SoftwareEngineering",
			ThaiName:     "วิศวกรรมซอฟต์แวร์",
			CurriculumID: 1,
			TypeOfCoursesID: 1,
			CreditID:        1,
		}

		ok, err := govalidator.ValidateStruct(course)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Code is required."))
	})

	t.Run("EnglishName must contain only letters", func(t *testing.T) {
		course := entity.AllCourses{
			Code:         "CS101",
			EnglishName:  "Software123", // มีตัวเลข
			ThaiName:     "วิศวกรรมซอฟต์แวร์",
			CurriculumID: 1,
			TypeOfCoursesID: 1,
			CreditID:        1,
		}

		ok, err := govalidator.ValidateStruct(course)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("English name must contain only letters."))
	})

	t.Run("ThaiName is required", func(t *testing.T) {
		course := entity.AllCourses{
			Code:         "CS101",
			EnglishName:  "SoftwareEngineering",
			ThaiName:     "",
			CurriculumID: 1,
			TypeOfCoursesID: 1,
			CreditID:        1,
		}

		ok, err := govalidator.ValidateStruct(course)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("ThaiName is required."))
	})

	t.Run("All fields are valid", func(t *testing.T) {
	course := entity.AllCourses{
		Code:         "CS101",
		EnglishName:  "SoftwareEngineering",
		ThaiName:     "วิศวกรรมซอฟต์แวร์",
		CurriculumID: 1,
		TypeOfCoursesID: 1,
		CreditID:        1,

		// 👇 ต้องใส่ struct นี้เพื่อให้ validation ผ่าน
		Credit: entity.Credit{
			Unit:    3,
			Lecture: 2,
			Lab:     1,
			Self:    2,
		},

		// ถ้า Curriculum, TypeOfCourses มี validation ก็ต้องใส่ด้วยเช่นกัน
		// Curriculum: entity.Curriculum{...},
		// TypeOfCourses: entity.TypeOfCourses{...},
	}

	ok, err := govalidator.ValidateStruct(course)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
})

}
