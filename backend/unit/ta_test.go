package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestTeachingAssistantValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Firstname is required", func(t *testing.T) {
		ta := entity.TeachingAssistant{
			Firstname:   "",
			Lastname:    "Doe",
			Email:       "ta@example.com",
			PhoneNumber: "0891234567",
			TitleID:     1,
		}
		ok, err := govalidator.ValidateStruct(ta)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Firstname is required."))
	})

	t.Run("Lastname is required", func(t *testing.T) {
		ta := entity.TeachingAssistant{
			Firstname:   "John",
			Lastname:    "",
			Email:       "ta@example.com",
			PhoneNumber: "0891234567",
			TitleID:     1,
		}
		ok, err := govalidator.ValidateStruct(ta)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Lastname is required."))
	})

	t.Run("Email must be valid", func(t *testing.T) {
		ta := entity.TeachingAssistant{
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "invalid-email",
			PhoneNumber: "0891234567",
			TitleID:     1,
		}
		ok, err := govalidator.ValidateStruct(ta)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Invalid email format."))
	})

	t.Run("PhoneNumber must be valid Thai format", func(t *testing.T) {
		ta := entity.TeachingAssistant{
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "ta@example.com",
			PhoneNumber: "1234567890", // ไม่ตรง pattern
			TitleID:     1,
		}
		ok, err := govalidator.ValidateStruct(ta)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Invalid Thai phone number."))
	})

	t.Run("TitleID is required", func(t *testing.T) {
		ta := entity.TeachingAssistant{
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "ta@example.com",
			PhoneNumber: "0891234567",
			TitleID:     0,
		}
		ok, err := govalidator.ValidateStruct(ta)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Title is required."))
	})

	t.Run("All fields are valid", func(t *testing.T) {
		ta := entity.TeachingAssistant{
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "ta@example.com",
			PhoneNumber: "0891234567",
			TitleID:     1,
		}
		ok, err := govalidator.ValidateStruct(ta)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
