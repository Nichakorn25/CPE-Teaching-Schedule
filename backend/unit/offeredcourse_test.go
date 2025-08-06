package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestOfferedCoursesValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Missing Year", func(t *testing.T) {
		c := entity.OfferedCourses{Year: 0, Term: 1, Section: 1, Capacity: 1, UserID: 1, AllCoursesID: 1}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Year is required."))
	})

	t.Run("Missing Term", func(t *testing.T) {
		c := entity.OfferedCourses{Year: 2566, Term: 0, Section: 1, Capacity: 1, UserID: 1, AllCoursesID: 1}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Term is required."))
	})

	t.Run("Missing Section", func(t *testing.T) {
		c := entity.OfferedCourses{Year: 2566, Term: 1, Section: 0, Capacity: 1, UserID: 1, AllCoursesID: 1}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Section is required."))
	})

	t.Run("Missing Capacity", func(t *testing.T) {
		c := entity.OfferedCourses{Year: 2566, Term: 1, Section: 1, Capacity: 0, UserID: 1, AllCoursesID: 1}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Capacity is required."))
	})

	t.Run("Missing UserID", func(t *testing.T) {
		c := entity.OfferedCourses{Year: 2566, Term: 1, Section: 1, Capacity: 30, UserID: 0, AllCoursesID: 1}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("UserID is required."))
	})

	t.Run("Missing AllCoursesID", func(t *testing.T) {
		c := entity.OfferedCourses{Year: 2566, Term: 1, Section: 1, Capacity: 30, UserID: 1, AllCoursesID: 0}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("AllCoursesID is required."))
	})

	t.Run("All fields valid", func(t *testing.T) {
		c := entity.OfferedCourses{
			Year:         2566,
			Term:         1,
			Section:      2,
			Capacity:     40,
			UserID:       1,
			AllCoursesID: 1,
			IsFixCourses: false,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Multiple fields missing", func(t *testing.T) {
		c := entity.OfferedCourses{
			Year:         0,
			Term:         0,
			Section:      0,
			Capacity:     0,
			UserID:       0,
			AllCoursesID: 0,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Year is required."))
		g.Expect(err.Error()).To(ContainSubstring("Term is required."))
		g.Expect(err.Error()).To(ContainSubstring("Section is required."))
		g.Expect(err.Error()).To(ContainSubstring("Capacity is required."))
		g.Expect(err.Error()).To(ContainSubstring("UserID is required."))
		g.Expect(err.Error()).To(ContainSubstring("AllCoursesID is required."))
	})
}
