package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestCurriculumValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("CurriculumName is required", func(t *testing.T) {
		curriculum := entity.Curriculum{
			CurriculumName: "",
			Year:           2566,
			Started:        1,
			MajorID:        1,
		}

		ok, err := govalidator.ValidateStruct(curriculum)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("CurriculumName is required."))
	})

	t.Run("Year is required", func(t *testing.T) {
		curriculum := entity.Curriculum{
			CurriculumName: "หลักสูตรวิศวกรรมซอฟต์แวร์",
			Year:           0, // ค่า default ของ uint จะถือว่าไม่มีค่า
			Started:        1,
			MajorID:        1,
		}

		ok, err := govalidator.ValidateStruct(curriculum)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Year is required."))
	})

	t.Run("Started is required", func(t *testing.T) {
		curriculum := entity.Curriculum{
			CurriculumName: "หลักสูตรวิศวกรรมซอฟต์แวร์",
			Year:           2566,
			Started:        0, // default
			MajorID:        1,
		}

		ok, err := govalidator.ValidateStruct(curriculum)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Started is required."))
	})

	t.Run("Curriculum is valid", func(t *testing.T) {
		curriculum := entity.Curriculum{
			CurriculumName: "หลักสูตรวิศวกรรมซอฟต์แวร์",
			Year:           2566,
			Started:        1,
			MajorID:        1,

			// ถ้า Major มี validation ให้กำหนดด้วย
			// Major: entity.Major{...}
		}

		ok, err := govalidator.ValidateStruct(curriculum)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
