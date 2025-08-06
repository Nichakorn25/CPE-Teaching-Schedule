package unit

import (
	"testing"
	"time"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestConditionValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	validStart := time.Date(2025, 1, 1, 9, 0, 0, 0, time.UTC)
	validEnd := time.Date(2025, 1, 1, 10, 0, 0, 0, time.UTC)

	t.Run("Missing DayOfWeek", func(t *testing.T) {
		c := entity.Condition{
			DayOfWeek: "",
			StartTime: validStart,
			EndTime:   validEnd,
			UserID:    1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("DayOfWeek is required."))
	})

	t.Run("Missing StartTime", func(t *testing.T) {
		c := entity.Condition{
			DayOfWeek: "Monday",
			EndTime:   validEnd,
			UserID:    1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("StartTime is required."))
	})

	t.Run("Missing EndTime", func(t *testing.T) {
		c := entity.Condition{
			DayOfWeek: "Monday",
			StartTime: validStart,
			UserID:    1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("EndTime is required."))
	})

	t.Run("Missing UserID", func(t *testing.T) {
		c := entity.Condition{
			DayOfWeek: "Monday",
			StartTime: validStart,
			EndTime:   validEnd,
			UserID:    0,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("UserID is required."))
	})

	t.Run("All fields valid", func(t *testing.T) {
		c := entity.Condition{
			DayOfWeek: "Monday",
			StartTime: validStart,
			EndTime:   validEnd,
			UserID:    1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
