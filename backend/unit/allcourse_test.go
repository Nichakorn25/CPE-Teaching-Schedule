package unit

import (
	"os"
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestMain(m *testing.M) {
	govalidator.SetFieldsRequiredByDefault(false)
	os.Exit(m.Run())
}

func TestAllCoursesValidation(t *testing.T) {

	t.Run("Code is required", func(t *testing.T) {
		g := NewWithT(t)

		c := entity.AllCourses{
			Code:        "",
			EnglishName: "SoftwareEngineering",
			ThaiName:    "วิศวกรรมซอฟต์แวร์",
			Ismain:      true,

			CurriculumID:    1,
			TypeOfCoursesID: 1,
			CreditID:        1,

			Curriculum: entity.Curriculum{
				CurriculumName: "CPE",
				Year:           2568,
				Started:        1,
				MajorID:        1,
				Major: entity.Major{
					MajorName:    "Computer Engineering",
					DepartmentID: 1,
				},
			},
			Credit: entity.Credit{Unit: 3, Lecture: 2, Lab: 1, Self: 2},
		}

		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Code is required."))
	})

	t.Run("EnglishName must contain only letters", func(t *testing.T) {
		g := NewWithT(t)

		c := entity.AllCourses{
			Code:        "CS101",
			EnglishName: "Software123", // มีตัวเลข
			ThaiName:    "วิศวกรรมซอฟต์แวร์",
			Ismain:      true,

			CurriculumID:    1,
			TypeOfCoursesID: 1,
			CreditID:        1,

			Curriculum: entity.Curriculum{
				CurriculumName: "CPE",
				Year:           2568,
				Started:        1,
				MajorID:        1,
				Major: entity.Major{
					MajorName:    "Computer Engineering",
					DepartmentID: 1,
				},
			},
			Credit: entity.Credit{Unit: 3, Lecture: 2, Lab: 1, Self: 2},
		}

		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("English name must contain only letters."))
	})

	t.Run("ThaiName is required", func(t *testing.T) {
		g := NewWithT(t)

		c := entity.AllCourses{
			Code:        "CS101",
			EnglishName: "SoftwareEngineering",
			ThaiName:    "",
			Ismain:      true,

			CurriculumID:    1,
			TypeOfCoursesID: 1,
			CreditID:        1,

			Curriculum: entity.Curriculum{
				CurriculumName: "CPE",
				Year:           2568,
				Started:        1,
				MajorID:        1,
				Major: entity.Major{
					MajorName:    "Computer Engineering",
					DepartmentID: 1,
				},
			},
			Credit: entity.Credit{Unit: 3, Lecture: 2, Lab: 1, Self: 2},
		}

		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("ThaiName is required."))
	})

	t.Run("Ismain is required (must be true)", func(t *testing.T) {
		g := NewWithT(t)

		c := entity.AllCourses{
			Code:        "CS101",
			EnglishName: "SoftwareEngineering",
			ThaiName:    "วิศวกรรมซอฟต์แวร์",
			Ismain:      false, 
			CurriculumID:    1,
			TypeOfCoursesID: 1,
			CreditID:        1,

			Curriculum: entity.Curriculum{
				CurriculumName: "CPE",
				Year:           2568,
				Started:        1,
				MajorID:        1,
				Major: entity.Major{
					MajorName:    "Computer Engineering",
					DepartmentID: 1,
				},
			},
			Credit: entity.Credit{Unit: 3, Lecture: 2, Lab: 1, Self: 2},
		}

		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("ismain is required."))
	})

	t.Run("All fields are valid", func(t *testing.T) {
		g := NewWithT(t)

		c := entity.AllCourses{
			Code:        "CS101",
			EnglishName: "SoftwareEngineering", 
			ThaiName:    "วิศวกรรมซอฟต์แวร์",
			Ismain:      true,

			CurriculumID:    1,
			TypeOfCoursesID: 1,
			CreditID:        1,

			Curriculum: entity.Curriculum{
				CurriculumName: "CPE",
				Year:           2568,
				Started:        1,
				MajorID:        1,
				Major: entity.Major{
					MajorName:    "Computer Engineering",
					DepartmentID: 1,
				},
			},
			Credit: entity.Credit{Unit: 3, Lecture: 2, Lab: 1, Self: 2},
		}

		ok, err := govalidator.ValidateStruct(c)
		g.Expect(err).To(BeNil(), "validation failed: %v", err)
		g.Expect(ok).To(BeTrue())
	})
}
