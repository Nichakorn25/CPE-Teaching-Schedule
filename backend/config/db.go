package config

import (
	"database/sql"
	"fmt"
	"log"
	"time"

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
		&entity.Department{},
		&entity.Major{},
		&entity.Title{},
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
		&entity.Curriculum{},
		&entity.Schedule{},
		&entity.Selected{},
		&entity.SelectedTA{},
		&entity.ServiceCenter{},
		&entity.Status{},
		&entity.Subject{},
		&entity.SubjectType{},
		&entity.TeachingAssistant{},
		&entity.StatusChangePassword{},
		&entity.ChangePassword{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	seedRoles()
	seedTitles()
	seedDepartments()
	seedMajors()
	seedStatusChangePassword()
	seedPositions()
	seedUsersData()
}

func seedTitles() {
	titles := []string{
		"ศาสตราจารย์ ดร.",
		"รองศาสตราจารย์ ดร.",
		"ผู้ช่วยศาสตราจารย์ ดร.",
		"อาจารย์ ดร.",
		"ศาสตราจารย์",
		"รองศาสตราจารย์",
		"ผู้ช่วยศาสตราจารย์",
		"อาจารย์",
	}

	for _, title := range titles {
		db.FirstOrCreate(&entity.Title{}, entity.Title{Name: title})
	}
}

func seedDepartments() {
	departments := []string{
		"สำนักวิชาวิศวกรรม",
		"สำนักวิชาแพทยศาสตร์",
		"สำนักวิชาวิทยาศาสตร์",
	}

	for _, dept := range departments {
		db.FirstOrCreate(&entity.Department{}, entity.Department{Name: dept})
	}
}

func seedMajors() {
	var M1 entity.Department
	db.First(&M1, "name = ?", "สำนักวิชาวิศวกรรม")

	var M2 entity.Department
	db.First(&M2, "name = ?", "สำนักวิชาแพทยศาสตร์")

	var M3 entity.Department
	db.First(&M3, "name = ?", "สำนักวิชาวิทยาศาสตร์")

	majors := []entity.Major{
		{Name: "สาขาวิศวกรรมคอมพิวเตอร์", DepartmentID: M1.ID},
		{Name: "สาขาวิศวกรรมเครื่องกล", DepartmentID: M1.ID},
		{Name: "สาขาทันตแพทย์", DepartmentID: M2.ID},
		{Name: "สาขาวิศวกรรมไฟฟ้า", DepartmentID: M1.ID},
	}

	for _, major := range majors {
		db.FirstOrCreate(&entity.Major{}, entity.Major{Name: major.Name, DepartmentID: major.DepartmentID})
	}
}

func seedStatusChangePassword() {
	status := []string{"ยังไม่ได้รับการอนุญาต", "ได้รับการอนุญาตแล้ว"}
	for _, s := range status {
		db.FirstOrCreate(&entity.StatusChangePassword{}, &entity.StatusChangePassword{StatusName: s})
	}
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

	var department entity.Department
	var major entity.Major

	db.First(&department, "name = ?", "สำนักวิชาวิศวกรรม")
	db.First(&major, "name = ?", "สาขาวิศวกรรมคอมพิวเตอร์")

	var titleAssistantDr entity.Title
	var titleLecturerDr entity.Title

	db.First(&titleAssistantDr, "name = ?", "ผู้ช่วยศาสตราจารย์ ดร.")
	db.First(&titleLecturerDr, "name = ?", "อาจารย์ ดร.")

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

	// --- Instructor 1 (Scheduler) ---
	Scheduler1 := entity.Instructor{
		FirstName:    "ศรัญญา",
		LastName:     "กาญจนวัฒนา",
		Email:        "sarunya.k@sut.ac.th",
		Phone:        "044224447",
		UserID:       userSchedule.ID,
		PositionID:   Instructor.ID,
		TitleID:      titleAssistantDr.ID,
		AccessDate:   time.Date(2010, time.June, 1, 0, 0, 0, 0, time.UTC),
		Image:        "sarunya.jpg",
		DepartmentID: department.ID,
		MajorID:      major.ID,
	}

	// --- Instructor 2 ---
	instructor1 := entity.Instructor{
		FirstName:    "นันทวุฒิ",
		LastName:     "คะอังกุ",
		Email:        "nuntawut@sut.ac.th",
		Phone:        "044224559",
		UserID:       userA.ID,
		PositionID:   Director.ID,
		TitleID:      titleAssistantDr.ID,
		AccessDate:   time.Date(2012, time.May, 15, 0, 0, 0, 0, time.UTC),
		Image:        "nuntawut.jpg",
		DepartmentID: department.ID,
		MajorID:      major.ID,
	}

	// --- Instructor 3 ---
	instructor2 := entity.Instructor{
		FirstName:    "วิชัย",
		LastName:     "ศรีสุรักษ์",
		Email:        "wichai@sut.ac.th",
		Phone:        "044224646",
		UserID:       userB.ID,
		PositionID:   Instructor.ID,
		TitleID:      titleLecturerDr.ID,
		AccessDate:   time.Date(2015, time.September, 10, 0, 0, 0, 0, time.UTC),
		Image:        "wichai.jpg",
		DepartmentID: department.ID,
		MajorID:      major.ID,
	}

	// --- บันทึกลงฐานข้อมูล ---
	db.FirstOrCreate(&Scheduler1, entity.Instructor{Email: "sarunya.k@sut.ac.th"})
	db.FirstOrCreate(&instructor1, entity.Instructor{Email: "nuntawut@sut.ac.th"})
	db.FirstOrCreate(&instructor2, entity.Instructor{Email: "wichai@sut.ac.th"})
}
