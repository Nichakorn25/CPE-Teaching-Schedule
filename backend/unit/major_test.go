package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestMajorValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("MajorName is required", func(t *testing.T) {
		major := entity.Major{
			MajorName:    "", // ว่าง
			DepartmentID: 1,
		}

		ok, err := govalidator.ValidateStruct(major)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("MajorName is required."))
	})

	t.Run("DepartmentID is required", func(t *testing.T) {
		major := entity.Major{
			MajorName:    "วิศวกรรมคอมพิวเตอร์",
			DepartmentID: 0, // ค่า default ของ uint
		}

		ok, err := govalidator.ValidateStruct(major)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("DepartmentID is required."))
	})

	t.Run("Major is valid", func(t *testing.T) {
		major := entity.Major{
			MajorName:    "วิศวกรรมคอมพิวเตอร์",
			DepartmentID: 1,

			// ถ้า Department มี validation และถูก validate อัตโนมัติ ให้กำหนดข้อมูลไว้ด้วย
			// Department: entity.Department{...}
		}

		ok, err := govalidator.ValidateStruct(major)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
