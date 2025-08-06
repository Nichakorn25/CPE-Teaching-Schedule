package unit

import (
	"testing"
	"time"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestScheduleValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	validStart := time.Date(2025, 1, 1, 8, 0, 0, 0, time.UTC)
	validEnd := time.Date(2025, 1, 1, 10, 0, 0, 0, time.UTC)

	t.Run("Missing NameTable", func(t *testing.T) {
		s := entity.Schedule{
			NameTable:        "",
			SectionNumber:    1,
			DayOfWeek:        "Tuesday",
			StartTime:        validStart,
			EndTime:          validEnd,
			OfferedCoursesID: 1,
		}
		ok, err := govalidator.ValidateStruct(s)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("NameTable is required."))
	})

	t.Run("Missing SectionNumber", func(t *testing.T) {
		s := entity.Schedule{
			NameTable:        "T01",
			SectionNumber:    0,
			DayOfWeek:        "Tuesday",
			StartTime:        validStart,
			EndTime:          validEnd,
			OfferedCoursesID: 1,
		}
		ok, err := govalidator.ValidateStruct(s)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("SectionNumber is required."))
	})

	t.Run("Missing DayOfWeek", func(t *testing.T) {
		s := entity.Schedule{
			NameTable:        "T01",
			SectionNumber:    1,
			DayOfWeek:        "",
			StartTime:        validStart,
			EndTime:          validEnd,
			OfferedCoursesID: 1,
		}
		ok, err := govalidator.ValidateStruct(s)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("DayOfWeek is required."))
	})

	t.Run("Missing StartTime", func(t *testing.T) {
		s := entity.Schedule{
			NameTable:        "T01",
			SectionNumber:    1,
			DayOfWeek:        "Tuesday",
			EndTime:          validEnd,
			OfferedCoursesID: 1,
		}
		ok, err := govalidator.ValidateStruct(s)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("StartTime is required."))
	})

	t.Run("Missing EndTime", func(t *testing.T) {
		s := entity.Schedule{
			NameTable:        "T01",
			SectionNumber:    1,
			DayOfWeek:        "Tuesday",
			StartTime:        validStart,
			OfferedCoursesID: 1,
		}
		ok, err := govalidator.ValidateStruct(s)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("EndTime is required."))
	})

	t.Run("Missing OfferedCoursesID", func(t *testing.T) {
		s := entity.Schedule{
			NameTable:        "T01",
			SectionNumber:    1,
			DayOfWeek:        "Tuesday",
			StartTime:        validStart,
			EndTime:          validEnd,
			OfferedCoursesID: 0,
		}
		ok, err := govalidator.ValidateStruct(s)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("OfferedCoursesID is required."))
	})

	t.Run("All fields valid", func(t *testing.T) {
		s := entity.Schedule{
			NameTable:        "T01",
			SectionNumber:    1,
			DayOfWeek:        "Tuesday",
			StartTime:        validStart,
			EndTime:          validEnd,
			OfferedCoursesID: 1,
		}
		ok, err := govalidator.ValidateStruct(s)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
