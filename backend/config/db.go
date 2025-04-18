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
	err := db.AutoMigrate(
		&entity.Role{},
		&entity.User{},
		&entity.Period{},
		&entity.Position{},
		&entity.Admin{},
		&entity.Instructor{},
		&entity.Term{},
		&entity.Unit{},
		&entity.Year{},
		&entity.YearTerm{},
		&entity.Day{},
		&entity.GradeCurriculum{},
		&entity.Grade{},
		&entity.Condition{},
		&entity.Lab{},
		&entity.Major{},
		&entity.Curriculum{},
		&entity.Schedule{},
		&entity.Selected{},
		&entity.SelectedTA{},
		&entity.ServiceCenter{},
		&entity.Status{},
		&entity.Subject{},
		&entity.SubjectType{},
		&entity.TeachingAssistant{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	seedRoles()
	seedPositions()
	seedUsersData()
}

func seedRoles() {
	roles := []string{"Admin", "Scheduler", "Instructor"}
	for _, role := range roles {
		db.FirstOrCreate(&entity.Role{}, &entity.Role{Role: role})
	}
}

func seedPositions() {
	positions := []struct {
		Position string
		Priority uint
	}{
		{"ผู้บริหาร", 1},
		{"อาจารย์ผู้สอน", 2},
	}

	for _, pos := range positions {
		db.FirstOrCreate(&entity.Position{}, &entity.Position{
			Position: pos.Position,
			Priority: pos.Priority,
		})
	}
}

func seedUsersData() {

	// --- Roles ---
	var roleA entity.Role
	var roleB entity.Role
	var roleC entity.Role

	db.First(&roleA, "role = ?", "Admin")
	db.First(&roleB, "role = ?", "Scheduler")
	db.First(&roleC, "role = ?", "Instructor")

	// --- Positions ---
	var Director entity.Position
	var Instructor entity.Position

	db.First(&Director, "position = ?", "ผู้บริหาร")
	db.First(&Instructor, "position = ?", "อาจารย์ผู้สอน")

	hashedPassword, _ := HashPassword("1234")
	// --- Users ---
	userAdmin := entity.User{UsernameID: "Admin1234", Password: hashedPassword, RoleID: roleA.ID} //Admin
	userSchedule := entity.User{UsernameID: "SS1234", Password: hashedPassword, RoleID: roleB.ID} //Scheduler อาจารย์ฟาง
	userA := entity.User{UsernameID: "A1234", Password: hashedPassword, RoleID: roleC.ID}         //ผู้สอนธรรมดา
	userB := entity.User{UsernameID: "B1234", Password: hashedPassword, RoleID: roleC.ID}         //ผู้สอนธรรมดา

	db.FirstOrCreate(&userAdmin, entity.User{UsernameID: "Admin1234"})
	db.FirstOrCreate(&userSchedule, entity.User{UsernameID: "SS1234"})
	db.FirstOrCreate(&userA, entity.User{UsernameID: "A1234"})
	db.FirstOrCreate(&userB, entity.User{UsernameID: "B1234"})

	// --- Admins ---
	admin0 := entity.Admin{
		FirstName: "SUT",
		LastName:  "Admin",
		Email:     "SutAdmin@sut.ac.th",
		Phone:     "0123456789",
		UserID:    userAdmin.ID,
	}
	db.FirstOrCreate(&admin0, entity.Admin{Email: "SutAdmin@sut.ac.th"})

	// --- Instructor ---
	Scheduler1 := entity.Instructor{
		FirstName:  "ผู้ช่วยศาสตราจารย์ ดร. ศรัญญา", //ที่จริงควรเพิ่มฟิลสำหรับคำนำหน้าด้วย
		LastName:   "กาญจนวัฒนา",
		Email:      "sarunya.k@sut.ac.th",
		Phone:      "044224447", //เบอร์โต๊ะ   ควรเพิ่มหมายเลขห้องที่อาคารวิชาการด้วย
		Degree:     "ลืมว่าหาจากไหน",
		UserID:     userSchedule.ID,
		PositionID: Instructor.ID,
	}
	instructor1 := entity.Instructor{
		FirstName:  "ผู้ช่วยศาสตราจารย์ ดร.นันทวุฒิ", //ที่จริงควรเพิ่มฟิลสำหรับคำนำหน้าด้วย
		LastName:   "คะอังกุ",
		Email:      "nuntawut@sut.ac.th",
		Phone:      "044224559", //เบอร์โต๊ะ   ควรเพิ่มหมายเลขห้องที่อาคารวิชาการด้วย
		Degree:     "ลืมว่าหาจากไหน",
		UserID:     userA.ID,
		PositionID: Director.ID,
	}
	instructor2 := entity.Instructor{
		FirstName:  "อาจารย์ ดร. วิชัย",
		LastName:   "ศรีสุรักษ์",
		Email:      "wichai@sut.ac.th",
		Phone:      "044224646",
		Degree:     "ลืมว่าหาจากไหน",
		UserID:     userB.ID,
		PositionID: Instructor.ID,
	}
	db.FirstOrCreate(&Scheduler1, entity.Instructor{Email: "sarunya.k@sut.ac.th"})
	db.FirstOrCreate(&instructor1, entity.Instructor{Email: "nuntawut@sut.ac.th"})
	db.FirstOrCreate(&instructor2, entity.Instructor{Email: "wichai@sut.ac.th"})
}
