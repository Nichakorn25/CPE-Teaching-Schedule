package unit

import (
	"testing"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestUserUsername(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Username is required", func(t *testing.T) {
		user := entity.User{
			Username:    "", // ค่าว่าง
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Smith",
			Image:       "avatar_url",
			PhoneNumber: "0123456789",
			Email:       "test@example.com",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Username is required."))
	})

	t.Run("Username must be 1 letter followed by 5 digits", func(t *testing.T) {
		user := entity.User{
			Username:    "123456", // ผิดฟอร์ม
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Smith",
			Image:       "avatar_url",
			PhoneNumber: "0123456789",
			Email:       "test@example.com",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Username must be 1 letter followed by 5 digits."))
	})

	t.Run("Username is valid", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345", // ต้องแบบนี้
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Smith",
			Image:       "avatar_url",
			PhoneNumber: "0123456789",
			Email:       "test@example.com",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}

func TestUserPasswordValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Password is required", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "", // ค่าว่าง
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "john.doe@example.com",
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Password is required."))
	})

	t.Run("Password must be at least 8 characters", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "short", // น้อยกว่า 8 ตัว
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "john.doe@example.com",
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Password must be at least 8 characters."))
	})
}

func TestUserNameValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Firstname is required", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "", // ค่าว่าง
			Lastname:    "Doe",
			Email:       "john.doe@example.com",
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Firstname is required."))
	})

	t.Run("Firstname must contain only letters", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John123", // ไม่ได้มีแค่เฉพาะตัวอักษร
			Lastname:    "Doe",
			Email:       "john.doe@example.com",
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Firstname must contain only letters."))
	})

	t.Run("Lastname is required", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "", // ค่าว่าง
			Email:       "john.doe@example.com",
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Lastname is required."))
	})

	t.Run("Lastname must contain only letters", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Doe99", // ไม่ได้มีเฉพาะตัวอักษร
			Email:       "john.doe@example.com",
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Lastname must contain only letters."))
	})
}

func TestUserContactValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Email is required", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "", // ว่าง
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Email is required."))
	})

	t.Run("Email must be in valid format", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "invalid-email", // ไม่ใช่อีเมล
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Invalid email format."))
	})

	t.Run("PhoneNumber is required", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "john@example.com",
			PhoneNumber: "", // ว่าง
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Phone number is required."))
	})

	t.Run("PhoneNumber must be 10 digits", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "john@example.com",
			PhoneNumber: "12345", // ไม่ครบ 10 หลัก
			Address:     "123 Main St",
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Phone number must be 10 digits."))
	})

	t.Run("Address is required", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "john@example.com",
			PhoneNumber: "0123456789",
			Address:     "", // ว่าง
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Address is required."))
	})

	t.Run("Image is optional - empty is OK", func(t *testing.T) {
		user := entity.User{
			Username:    "A12345",
			Password:    "password123",
			Firstname:   "John",
			Lastname:    "Doe",
			Email:       "john@example.com",
			PhoneNumber: "0123456789",
			Address:     "123 Main St",
			Image:       "", // ว่างได้ เพราะ optional
			TitleID:     1,
			PositionID:  1,
			MajorID:     1,
			RoleID:      1,
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}

