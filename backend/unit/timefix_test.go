package unit

import (
	"testing"
	"time"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestTimeFixedCoursesValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	start := time.Date(2025, 1, 1, 9, 0, 0, 0, time.UTC)
	end := time.Date(2025, 1, 1, 11, 0, 0, 0, time.UTC)

	t.Run("Missing Year", func(t *testing.T) {
		c := entity.TimeFixedCourses{
			Year:      0,
			Term:      1,
			DayOfWeek: "Monday",
			StartTime: start,
			EndTime:   end,
			RoomFix:   "LAB101",
			Section:   1,
			Capacity:  30,
			AllCoursesID: 1,
			ScheduleID:   1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Year is required."))
	})

	t.Run("Missing Term", func(t *testing.T) {
		c := entity.TimeFixedCourses{
			Year:      2566,
			Term:      0,
			DayOfWeek: "Monday",
			StartTime: start,
			EndTime:   end,
			RoomFix:   "LAB101",
			Section:   1,
			Capacity:  30,
			AllCoursesID: 1,
			ScheduleID:   1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Term is required."))
	})

	t.Run("Missing RoomFix", func(t *testing.T) {
		c := entity.TimeFixedCourses{
			Year:      2566,
			Term:      1,
			DayOfWeek: "Monday",
			StartTime: start,
			EndTime:   end,
			RoomFix:   "",
			Section:   1,
			Capacity:  30,
			AllCoursesID: 1,
			ScheduleID:   1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("RoomFix is required."))
	})

	t.Run("Missing ScheduleID", func(t *testing.T) {
		c := entity.TimeFixedCourses{
			Year:      2566,
			Term:      1,
			DayOfWeek: "Monday",
			StartTime: start,
			EndTime:   end,
			RoomFix:   "LAB101",
			Section:   1,
			Capacity:  30,
			AllCoursesID: 1,
			ScheduleID:   0,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("ScheduleID is required."))
	})

	t.Run("All fields valid", func(t *testing.T) {
		c := entity.TimeFixedCourses{
			Year:      2566,
			Term:      1,
			DayOfWeek: "Monday",
			StartTime: start,
			EndTime:   end,
			RoomFix:   "LAB101",
			Section:   1,
			Capacity:  30,
			AllCoursesID: 1,
			ScheduleID:   1,
		}
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
