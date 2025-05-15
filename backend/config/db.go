package config

import (
	"database/sql"
	"errors"
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
		&entity.Title{},
		&entity.Position{},
		&entity.Role{},
		&entity.Department{},
		&entity.Major{},
		&entity.Laboratory{},
		&entity.Credit{},
		&entity.TypeOfCourses{},
		&entity.AcademicYear{},
		&entity.Curriculum{},
		&entity.TeachingAssistant{},
		&entity.User{},
		&entity.Condition{},
		&entity.AllCourses{},
		&entity.UserAllCourses{},
		&entity.OfferedCourses{},
		&entity.TimeFixedCourses{},
		&entity.Schedule{},
		&entity.ScheduleTeachingAssistant{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	seedTitles()
	seedPositions()
	seedRoles()
	seedDepartments()
	seedMajors()
	SeedDataUser()
	seedCredits()
	seedTypeOfCourses()
	seedAcademicYears()
	seedCurriculums()
	seedAllCourses()
	SeedUserAllCourses()
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
		db.FirstOrCreate(&entity.Title{}, entity.Title{Title: title})
	}
}

func seedPositions() {
	priority1 := uint(1)
	priority2 := uint(2)

	positions := []struct {
		Position string
		Priority *uint
	}{
		{"หัวหน้าสาขาวิศวกรรมคอมพิวเตอร์", &priority1},
		{"อาจารย์ประจำสาขาวิชา", &priority2},
		{"หัวหน้าสถานนวัตกรรมวิศวศึกษา", &priority1},
		{"ผู้ดูแลระบบ", nil},
	}

	for _, pos := range positions {
		db.FirstOrCreate(&entity.Position{}, &entity.Position{
			Position: pos.Position,
			Priority: pos.Priority,
		})
	}
}

func seedRoles() {
	roles := []string{"Admin", "Scheduler", "Instructor"}
	for _, role := range roles {
		db.FirstOrCreate(&entity.Role{}, &entity.Role{Role: role})
	}
}

func seedDepartments() {
	departments := []string{
		"สำนักวิชาวิศวกรรม",
		"สำนักวิชาแพทยศาสตร์",
		"สำนักวิชาวิทยาศาสตร์",
	}
	for _, dept := range departments {
		db.FirstOrCreate(&entity.Department{}, entity.Department{DepartmentName: dept})
	}
}

func seedMajors() {
	var M1, M2, M3 entity.Department
	db.First(&M1, "department_name = ?", "สำนักวิชาวิศวกรรม")
	db.First(&M2, "department_name = ?", "สำนักวิชาแพทยศาสตร์")
	db.First(&M3, "department_name = ?", "สำนักวิชาวิทยาศาสตร์")

	majors := []entity.Major{
		{MajorName: "สาขาวิศวกรรมคอมพิวเตอร์", DepartmentID: M1.ID},
		{MajorName: "สาขาวิศวกรรมเครื่องกล", DepartmentID: M1.ID},
		{MajorName: "สาขาทันตแพทย์", DepartmentID: M2.ID},
		{MajorName: "สาขาวิศวกรรมไฟฟ้า", DepartmentID: M1.ID},
		{MajorName: "สาขาวิทยาศาสตร์คอมพิวเตอร์", DepartmentID: M3.ID},
	}
	for _, major := range majors {
		db.FirstOrCreate(&entity.Major{}, entity.Major{
			MajorName:    major.MajorName,
			DepartmentID: major.DepartmentID,
		})
	}
}

func SeedDataUser() {
	hashedPassword01, err := HashPassword("admin")
	if err != nil {
		log.Fatalf("Failed to hash admin password: %v", err)
	}
	hashedPassword, err := HashPassword("1234")
	if err != nil {
		log.Fatalf("Failed to hash user password: %v", err)
	}

	users := []entity.User{
		{
			Username:      "admin",
			Password:      hashedPassword01,
			Firstname:     "SUT",
			Lastname:      "ADMIN",
			Image:         "",
			Email:         "SutAdmin@sut.ac.th",
			PhoneNumber:   "0844444444",
			Address:       "อาคารบริการ 1 ชั้น 1 ห้อง C2",
			FirstPassword: true,
			TitleID:       1,
			PositionID:    1,
			MajorID:       1,
			RoleID:        1,
		},
		{
			Username:      "SS1234",
			Password:      hashedPassword,
			Firstname:     "ศรัญญา",
			Lastname:      "กาญจนวัฒนา",
			Image:         "",
			Email:         "sarunya.k@sut.ac.th",
			PhoneNumber:   "044224447",
			Address:       "อาคารบริการ 1 ชั้น 3 ห้อง 12",
			FirstPassword: false,
			TitleID:       2,
			PositionID:    2,
			MajorID:       2,
			RoleID:        2,
		},
		{
			Username:      "A1234",
			Password:      hashedPassword,
			Firstname:     "นันทวุฒิ",
			Lastname:      "คะอังกุ",
			Image:         "",
			Email:         "nuntawut@sut.ac.th",
			PhoneNumber:   "044224559",
			Address:       "อาคารบริการ 1 ชั้น 3 ห้อง 25",
			FirstPassword: false,
			TitleID:       2,
			PositionID:    2,
			MajorID:       2,
			RoleID:        3,
		},
		{
			Username:      "B1234",
			Password:      hashedPassword,
			Firstname:     "วิชัย",
			Lastname:      "ศรีสุรักษ์",
			Image:         "",
			Email:         "wichai@sut.ac.th",
			PhoneNumber:   "044224646",
			Address:       "F11 ชั้น 4 ห้อง 421",
			FirstPassword: false,
			TitleID:       2,
			PositionID:    2,
			MajorID:       2,
			RoleID:        3,
		},
	}
	for _, user := range users {
		var existing entity.User
		err := db.Where("username = ?", user.Username).First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := db.Create(&user).Error; err != nil {
				log.Printf("Error creating user %s: %v\n", user.Username, err)
			} else {
				log.Printf("User %s created successfully.\n", user.Username)
			}
		} else if err != nil {
			log.Printf("DB error checking user %s: %v\n", user.Username, err)
		} else {
			log.Printf("User %s already exists.\n", user.Username)
		}
	}
}

func seedCredits() {
	credits := []entity.Credit{
		{Unit: 2, Lectrue: 1, Lab: 3, Self: 5},
		{Unit: 4, Lectrue: 4, Lab: 0, Self: 8},
		{Unit: 4, Lectrue: 3, Lab: 3, Self: 9},
		{Unit: 3, Lectrue: 3, Lab: 0, Self: 6},
		{Unit: 1, Lectrue: 0, Lab: 3, Self: 3},
		{Unit: 2, Lectrue: 2, Lab: 0, Self: 4},
		{Unit: 1, Lectrue: 0, Lab: 0, Self: 0},
		{Unit: 1, Lectrue: 0, Lab: 3, Self: 0},
	}

	for _, credit := range credits {
		db.FirstOrCreate(&entity.Credit{}, entity.Credit{
			Unit:    credit.Unit,
			Lectrue: credit.Lectrue,
			Lab:     credit.Lab,
			Self:    credit.Self,
		})
	}
}

func seedTypeOfCourses() {
	types := []entity.TypeOfCourses{
		{Type: 1, TypeName: "กลุ่มวิชาแกนศึกษาทั่วไป"},
		{Type: 2, TypeName: "กลุ่มวิชาภาษา"},
		{Type: 3, TypeName: "กลุ่มวิชาศึกษาทั่วไปแบบเลือก"},
		{Type: 4, TypeName: "หมวดวิชาเฉพาะ"},
		{Type: 5, TypeName: "กลุ่มวิชาชีพบังคับทางวิศวกรรมคอมพิวเตอร์"},
		{Type: 6, TypeName: "หมวดวิชาสหกิจศึกษา"},
		{Type: 7, TypeName: "หมวดวิชาเลือกเสรี"},
	}

	for _, t := range types {
		db.FirstOrCreate(&entity.TypeOfCourses{}, entity.TypeOfCourses{
			Type:     t.Type,
			TypeName: t.TypeName,
		})
	}
}

func seedAcademicYears() {
	years := []entity.AcademicYear{
		{Level: 1},
		{Level: 2},
		{Level: 3},
		{Level: 4},
	}
	for _, y := range years {
		db.FirstOrCreate(&entity.AcademicYear{}, entity.AcademicYear{
			Level: y.Level,
		})
	}
}

func seedCurriculums() {
	var (
		comEng    entity.Major
		mechEng   entity.Major
		dentistry entity.Major
		elecEng   entity.Major
		csScience entity.Major
	)
	db.First(&comEng, "major_name = ?", "สาขาวิศวกรรมคอมพิวเตอร์")
	db.First(&mechEng, "major_name = ?", "สาขาวิศวกรรมเครื่องกล")
	db.First(&dentistry, "major_name = ?", "สาขาทันตแพทย์")
	db.First(&elecEng, "major_name = ?", "สาขาวิศวกรรมไฟฟ้า")
	db.First(&csScience, "major_name = ?", "สาขาวิทยาศาสตร์คอมพิวเตอร์")

	curriculums := []entity.Curriculum{
		{CurriculumName: "วิศวกรรมคอมพิวเตอร์ 2565", Year: 2565, Started: 2022, MajorID: comEng.ID},
		{CurriculumName: "วิศวกรรมคอมพิวเตอร์ 2566", Year: 2566, Started: 2023, MajorID: comEng.ID},
		{CurriculumName: "วิศวกรรมเครื่องกล 2564", Year: 2564, Started: 2021, MajorID: mechEng.ID},
		{CurriculumName: "วิศวกรรมเครื่องกล 2566", Year: 2566, Started: 2023, MajorID: mechEng.ID},
		{CurriculumName: "ทันตแพทย์ 2564", Year: 2564, Started: 2021, MajorID: dentistry.ID},
		{CurriculumName: "ทันตแพทย์ 2565", Year: 2565, Started: 2022, MajorID: dentistry.ID},
		{CurriculumName: "วิศวกรรมไฟฟ้า 2563", Year: 2563, Started: 2020, MajorID: elecEng.ID},
		{CurriculumName: "วิทยาการคอมพิวเตอร์ 2566", Year: 2566, Started: 2023, MajorID: csScience.ID},
		{CurriculumName: "วิทยาการคอมพิวเตอร์ 2567", Year: 2567, Started: 2024, MajorID: csScience.ID},
	}
	for _, curriculum := range curriculums {
		db.FirstOrCreate(&entity.Curriculum{}, entity.Curriculum{
			CurriculumName: curriculum.CurriculumName,
			Year:           curriculum.Year,
			Started:        curriculum.Started,
			MajorID:        curriculum.MajorID,
		})
	}
}

func seedAllCourses() {
	var (
		curriculumComEng2566  entity.Curriculum
		curriculumMechEng2566 entity.Curriculum
		curriculumDentist2565 entity.Curriculum

		credit3_3_0 entity.Credit
		credit2_2_0 entity.Credit
		credit4_4_0 entity.Credit
		credit1_0_3 entity.Credit

		typeSpecific entity.TypeOfCourses
		typeLanguage entity.TypeOfCourses
		typeGeneral  entity.TypeOfCourses

		year1 entity.AcademicYear
		year2 entity.AcademicYear
		year3 entity.AcademicYear
	)
	db.First(&curriculumComEng2566, "curriculum_name = ?", "วิศวกรรมคอมพิวเตอร์ 2566")
	db.First(&curriculumMechEng2566, "curriculum_name = ?", "วิศวกรรมเครื่องกล 2566")
	db.First(&curriculumDentist2565, "curriculum_name = ?", "ทันตแพทย์ 2565")

	db.First(&credit3_3_0, "unit = ? AND lectrue = ? AND lab = ?", 3, 3, 0)
	db.First(&credit2_2_0, "unit = ? AND lectrue = ? AND lab = ?", 2, 2, 0)
	db.First(&credit4_4_0, "unit = ? AND lectrue = ? AND lab = ?", 4, 4, 0)
	db.First(&credit1_0_3, "unit = ? AND lectrue = ? AND lab = ?", 1, 0, 3)

	db.First(&typeSpecific, "type_name = ?", "หมวดวิชาเฉพาะ")
	db.First(&typeLanguage, "type_name = ?", "กลุ่มวิชาภาษา")
	db.First(&typeGeneral, "type_name = ?", "กลุ่มวิชาแกนศึกษาทั่วไป")

	db.First(&year1, "level = ?", 1)
	db.First(&year2, "level = ?", 2)
	db.First(&year3, "level = ?", 3)

	courses := []entity.AllCourses{
		{
			Code:            "COMP201",
			EnglishName:     "Data Structures",
			ThaiName:        "โครงสร้างข้อมูล",
			CurriculumID:    curriculumComEng2566.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: typeSpecific.ID,
			CreditID:        credit3_3_0.ID,
		},
		{
			Code:            "COMP101",
			EnglishName:     "Introduction to Programming",
			ThaiName:        "การเขียนโปรแกรมเบื้องต้น",
			CurriculumID:    curriculumComEng2566.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: typeSpecific.ID,
			CreditID:        credit2_2_0.ID,
		},
		{
			Code:            "MECH301",
			EnglishName:     "Thermodynamics",
			ThaiName:        "อุณหพลศาสตร์",
			CurriculumID:    curriculumMechEng2566.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: typeSpecific.ID,
			CreditID:        credit4_4_0.ID,
		},
		{
			Code:            "DENT201",
			EnglishName:     "Oral Anatomy",
			ThaiName:        "กายวิภาคช่องปาก",
			CurriculumID:    curriculumDentist2565.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: typeSpecific.ID,
			CreditID:        credit3_3_0.ID,
		},
		{
			Code:            "LANG101",
			EnglishName:     "English for Communication",
			ThaiName:        "ภาษาอังกฤษเพื่อการสื่อสาร",
			CurriculumID:    curriculumComEng2566.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: typeLanguage.ID,
			CreditID:        credit2_2_0.ID,
		},
		{
			Code:            "GEN101",
			EnglishName:     "Philosophy and Ethics",
			ThaiName:        "ปรัชญาและจริยธรรม",
			CurriculumID:    curriculumComEng2566.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: typeGeneral.ID,
			CreditID:        credit3_3_0.ID,
		},
		{
			Code:            "COMP301",
			EnglishName:     "Database Systems",
			ThaiName:        "ระบบฐานข้อมูล",
			CurriculumID:    curriculumComEng2566.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: typeSpecific.ID,
			CreditID:        credit3_3_0.ID,
		},
		{
			Code:            "MECH201",
			EnglishName:     "Fluid Mechanics",
			ThaiName:        "กลศาสตร์ของไหล",
			CurriculumID:    curriculumMechEng2566.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: typeSpecific.ID,
			CreditID:        credit4_4_0.ID,
		},
		{
			Code:            "DENT301",
			EnglishName:     "Dental Materials",
			ThaiName:        "วัสดุทางทันตกรรม",
			CurriculumID:    curriculumDentist2565.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: typeSpecific.ID,
			CreditID:        credit2_2_0.ID,
		},
		{
			Code:            "LAB101",
			EnglishName:     "Physics Lab",
			ThaiName:        "ปฏิบัติการฟิสิกส์",
			CurriculumID:    curriculumComEng2566.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: typeGeneral.ID,
			CreditID:        credit1_0_3.ID,
		},
	}

	for _, course := range courses {
		db.FirstOrCreate(&entity.AllCourses{}, entity.AllCourses{
			Code:            course.Code,
			EnglishName:     course.EnglishName,
			ThaiName:        course.ThaiName,
			CurriculumID:    course.CurriculumID,
			AcademicYearID:  course.AcademicYearID,
			TypeOfCoursesID: course.TypeOfCoursesID,
			CreditID:        course.CreditID,
		})
	}
}

func SeedUserAllCourses() {
	var (
		ss1234 entity.User
		a1234  entity.User
		b1234  entity.User

		comp101 entity.AllCourses
		comp201 entity.AllCourses
		comp301 entity.AllCourses
		lang101 entity.AllCourses
		gen101  entity.AllCourses
		lab101  entity.AllCourses
		mech201 entity.AllCourses
		mech301 entity.AllCourses
		dent201 entity.AllCourses
		dent301 entity.AllCourses
	)

	db.First(&ss1234, "username = ?", "SS1234")
	db.First(&a1234, "username = ?", "A1234")
	db.First(&b1234, "username = ?", "B1234")

	db.First(&comp101, "code = ?", "COMP101")
	db.First(&comp201, "code = ?", "COMP201")
	db.First(&comp301, "code = ?", "COMP301")
	db.First(&lang101, "code = ?", "LANG101")
	db.First(&gen101, "code = ?", "GEN101")
	db.First(&lab101, "code = ?", "LAB101")
	db.First(&mech201, "code = ?", "MECH201")
	db.First(&mech301, "code = ?", "MECH301")
	db.First(&dent201, "code = ?", "DENT201")
	db.First(&dent301, "code = ?", "DENT301")

	enrollments := []entity.UserAllCourses{
		{UserID: ss1234.ID, AllCoursesID: comp101.ID},
		{UserID: ss1234.ID, AllCoursesID: comp201.ID},
		{UserID: ss1234.ID, AllCoursesID: lab101.ID},

		{UserID: a1234.ID, AllCoursesID: comp101.ID},
		{UserID: a1234.ID, AllCoursesID: mech201.ID},
		{UserID: a1234.ID, AllCoursesID: mech301.ID},

		{UserID: b1234.ID, AllCoursesID: comp101.ID},
		{UserID: b1234.ID, AllCoursesID: dent201.ID},
		{UserID: b1234.ID, AllCoursesID: dent301.ID},
	}
	for _, enroll := range enrollments {
		err := db.Create(&enroll).Error
		if err != nil {
			log.Printf("❌ พบข้อผิดพลาดในการลงทะเบียน: ผู้ใช้ user_id=%d กับรายวิชา course_id=%d : %v", enroll.UserID, enroll.AllCoursesID, err)
		} else {
			log.Printf("ลงทะเบียนสำเร็จ: ผู้ใช้ user_id=%d กับรายวิชา course_id=%d", enroll.UserID, enroll.AllCoursesID)
		}
	}
}
