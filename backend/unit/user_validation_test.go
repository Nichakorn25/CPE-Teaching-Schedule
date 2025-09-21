package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func validUser() entity.User {
	return entity.User{
		Username:    "sarunya.k",
		Password:    "password123",
		Firstname:   "John",
		Lastname:    "Smith",
		Image:       "avatar_url",
		Email:       "test@example.com",
		PhoneNumber: "0123456789",
		Address:     "123 Main St",
		TitleID:     1,
		PositionID:  1,
		MajorID:     1,
		RoleID:      1,
		Major: entity.Major{
			MajorName:    "Computer Engineering",
			DepartmentID: 1,
		},
	}
}

func TestUserUsername(t *testing.T) {

	t.Run("Username is required", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Username = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Username is required."))
	})

	t.Run("Username must start with letters, followed by a dot, and end with one letter", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Username = "123456"

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Username must start with letters and dot and end with one letter."))
	})

	t.Run("Username is valid", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(err).To(BeNil(), "validation failed: %v", err)
		g.Expect(ok).To(BeTrue())
	})
}

func TestUserPasswordValidation(t *testing.T) {

	t.Run("Password is required", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Password = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Password is required."))
	})

	t.Run("Password must be at least 8 characters", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Password = "short"

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Password must be at least 8 characters."))
	})
}

func TestUserNameValidation(t *testing.T) {

	t.Run("Firstname is required", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Firstname = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Firstname is required."))
	})

	t.Run("Firstname must contain only letters", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Firstname = "John123"

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Firstname must contain only letters."))
	})

	t.Run("Lastname is required", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Lastname = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Lastname is required."))
	})

	t.Run("Lastname must contain only letters", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Lastname = "Doe99"

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Lastname must contain only letters."))
	})
}

func TestUserContactValidation(t *testing.T) {

	t.Run("Email is required", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Email = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Email is required."))
	})

	t.Run("Email must be in valid format", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Email = "invalid-email"

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Invalid email format."))
	})

	t.Run("PhoneNumber is required", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.PhoneNumber = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Phone number is required."))
	})

	t.Run("PhoneNumber must be 10 digits", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.PhoneNumber = "12345"

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Phone number must be 10 digits."))
	})

	t.Run("Address is required", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Address = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Address is required."))
	})

	t.Run("Image is optional - empty is OK", func(t *testing.T) {
		g := NewWithT(t)
		user := validUser()
		user.Image = ""

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(err).To(BeNil(), "validation failed: %v", err)
		g.Expect(ok).To(BeTrue())
	})
}
