package config

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

// ของไดม่อนนนนนนนนน มันไม่สร้างนะ  ถ้าเธอได้คลุมของเค้าไว้แทนลบออกนะ

// func ConnectionDB() {
// 	// แก้ตรงนี้ให้เป็นค่าจริงของคุณ
// 	dsn := "host=localhost user=postgres password=1234 dbname=mydb port=5432 sslmode=disable TimeZone=Asia/Bangkok"
// 	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
// 	if err != nil {
// 		panic("failed to connect to database")
// 	}
// 	fmt.Println("connected to database")
// 	db = database
// }

func CreateDatabase() {
	dsn := "host=localhost user=postgres password=1234 port=5432 sslmode=disable"
	dbSQL, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL:", err)
	}
	defer dbSQL.Close()

	dbName := "cpe_schedule"
	_, err = dbSQL.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
	if err != nil {
		fmt.Println("Database may already exist:", err)
	} else {
		fmt.Println("Database created successfully")
	}
}

func ConnectionDB() {
	CreateDatabase()
	dsn := "host=localhost user=postgres password=1234 dbname=cpe_schedule port=5432 sslmode=disable TimeZone=Asia/Bangkok"
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	fmt.Println("connected to database")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Admin{},
		&entity.Day{},
		&entity.GradeCurriculum{},
		&entity.Grade{},
		&entity.Instructor{},
		&entity.Condition{},
		&entity.Lab{},
		&entity.Major{},
		&entity.Curriculum{},
		&entity.Period{},
		&entity.Position{},
		&entity.Role{},
		&entity.Schedule{},
		&entity.Selected{},
		&entity.SelectedTA{},
		&entity.ServiceCenter{},
		&entity.Status{},
		&entity.Subject{},
		&entity.SubjectType{},
		&entity.TeachingAssistant{},
		&entity.Term{},
		&entity.Unit{},
		&entity.User{},
		&entity.Year{},
		&entity.YearTerm{},
	)
	seedRoles()
	seedPositions()
	seedUsersAndRelatedData()
}

func seedRoles() {
	roles := []string{"A", "B", "C"}
	for _, role := range roles {
		db.FirstOrCreate(&entity.Role{}, &entity.Role{Role: role})
	}
}

func seedPositions() {
	positions := []struct {
		Name     string
		Priority uint
	}{
		{"Lecturer", 1},
		{"Assistant Professor", 2},
		{"Associate Professor", 3},
		{"Professor", 4},
	}

	for _, pos := range positions {
		db.FirstOrCreate(&entity.Position{}, &entity.Position{
			Position: pos.Name,
			Priority: pos.Priority,
		})
	}
}

func seedUsersAndRelatedData() {
	// หา Role ID ที่ต้องใช้
	var roleA entity.Role
	db.First(&roleA, "role = ?", "A")

	var roleB entity.Role
	db.First(&roleB, "role = ?", "B")

	var roleC entity.Role
	db.First(&roleC, "role = ?", "C")

	// --- Users ชุดเดิม ---
	userA := entity.User{UserID: "userA", Password: "passA", RoleID: roleA.ID}
	userB := entity.User{UserID: "userB", Password: "passB", RoleID: roleB.ID}
	userC := entity.User{UserID: "userC", Password: "passC", RoleID: roleC.ID}

	db.FirstOrCreate(&userA, entity.User{UserID: "userA"})
	db.FirstOrCreate(&userB, entity.User{UserID: "userB"})
	db.FirstOrCreate(&userC, entity.User{UserID: "userC"})

	// --- เพิ่ม Users ใหม่ ---
	userD := entity.User{UserID: "userD", Password: "passD", RoleID: roleA.ID}
	userE := entity.User{UserID: "userE", Password: "passE", RoleID: roleB.ID}

	db.FirstOrCreate(&userD, entity.User{UserID: "userD"})
	db.FirstOrCreate(&userE, entity.User{UserID: "userE"})

	// --- Admins ---
	admin1 := entity.Admin{
		FirstName: "Alice",
		LastName:  "Admin",
		Email:     "alice.admin@example.com",
		Phone:     "0123456789",
		UserID:    userA.ID,
	}
	admin2 := entity.Admin{
		FirstName: "Charlie",
		LastName:  "Admin",
		Email:     "charlie.admin@example.com",
		Phone:     "0111222333",
		UserID:    userD.ID,
	}
	db.FirstOrCreate(&admin1, entity.Admin{Email: "alice.admin@example.com"})
	db.FirstOrCreate(&admin2, entity.Admin{Email: "charlie.admin@example.com"})

	// --- Instructor ---
	var lecturer entity.Position
	db.First(&lecturer, "position = ?", "Lecturer")

	instructor1 := entity.Instructor{
		FirstName:  "Bob",
		LastName:   "Instructor",
		Email:      "bob.instructor@example.com",
		Phone:      "0987654321",
		Degree:     "Ph.D.",
		UserID:     userB.ID,
		PositionID: lecturer.ID,
	}
	instructor2 := entity.Instructor{
		FirstName:  "Diana",
		LastName:   "Lecturer",
		Email:      "diana.lecturer@example.com",
		Phone:      "0222333444",
		Degree:     "M.Sc.",
		UserID:     userE.ID,
		PositionID: lecturer.ID,
	}
	db.FirstOrCreate(&instructor1, entity.Instructor{Email: "bob.instructor@example.com"})
	db.FirstOrCreate(&instructor2, entity.Instructor{Email: "diana.lecturer@example.com"})
}
