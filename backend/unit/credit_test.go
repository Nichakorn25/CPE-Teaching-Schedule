package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestCreditValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Unit is required (0 is not valid)", func(t *testing.T) {
		credit := entity.Credit{
			Unit:    0, 
			Lecture: 1,
			Lab:     1,
			Self:    1,
		}

		ok, err := govalidator.ValidateStruct(credit)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Unit is required."))
	})

	t.Run("Lecture is required (non-zero)", func(t *testing.T) {
		credit := entity.Credit{
			Unit:    1,
			Lecture: 0,
			Lab:     1,
			Self:    1,
		}

		ok, err := govalidator.ValidateStruct(credit)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Lecture is required."))
	})

	t.Run("Valid Credit", func(t *testing.T) {
		credit := entity.Credit{
			Unit:    3,
			Lecture: 2,
			Lab:     1,
			Self:    2,
		}

		ok, err := govalidator.ValidateStruct(credit)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
