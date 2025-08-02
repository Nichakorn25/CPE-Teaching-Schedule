package unit

import (
	"fmt"
	"testing"
	"time"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

// Employee
// func TestUserUsername(t *testing.T) {
// 	g := NewGomegaWithT(t)

// 	t.Run(`First Name is required`, func(t *testing.T) {
// 		employee := entity.Employee{
// 			E_FirstName: "",
// 			E_LastName:  "Smith",
// 			Avatar:      "avatar_url",
// 			Number:      "1234567890",
// 			Email:       "test@example.com",
// 			Password:    "password123",
// 			Address:     "123 Main St",
// 			StartDate:   time.Now(),
// 			AccessLevel: "Admin",
// 			GenderID:    1,
// 			PositionID:  1,
// 			WarehouseID: 1,
// 		}

// 		ok, err := govalidator.ValidateStruct(employee)

// 		g.Expect(ok).NotTo(BeTrue())
// 		g.Expect(err).NotTo(BeNil())
// 		g.Expect(err.Error()).To(Equal("First Name is required."))
// 	})

// 	t.Run(`First Name must contain only letters`, func(t *testing.T) {
// 		employee := entity.Employee{
// 			E_FirstName: "John123", // Invalid First Name
// 			E_LastName:  "Smith",
// 			Avatar:      "avatar_url",
// 			Number:      "1234567890",
// 			Email:       "test@example.com",
// 			Password:    "password123",
// 			Address:     "123 Main St",
// 			StartDate:   time.Now(),
// 			AccessLevel: "Admin",
// 			GenderID:    1,
// 			PositionID:  1,
// 			WarehouseID: 1,
// 		}

// 		ok, err := govalidator.ValidateStruct(employee)

// 		g.Expect(ok).NotTo(BeTrue())
// 		g.Expect(err).NotTo(BeNil())
// 		g.Expect(err.Error()).To(Equal("First Name must contain only letters."))
// 	})
// }
