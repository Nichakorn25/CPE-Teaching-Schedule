package config

////////////////////////////////////// ของไดม่อนอย่าลบ //////////////////////////////////////////////////////////
// import (
// 	// "database/sql"
// 	"errors"
// 	"fmt"
// 	"log"
// 	"os"
// 	"time"

// 	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
// 	_ "github.com/lib/pq"

// 	// "gorm.io/driver/postgres"
// 	"gorm.io/driver/sqlite"
// 	"gorm.io/gorm"
// )

// var db *gorm.DB

// func DB() *gorm.DB {
// 	return db
// }

// func CreateDatabase() {
// 	dbName := "cpe_schedule.db"

// 	// เช็คว่าไฟล์ฐานข้อมูลมีอยู่แล้วหรือยัง
// 	if _, err := os.Stat(dbName); os.IsNotExist(err) {
// 		file, err := os.Create(dbName)
// 		if err != nil {
// 			log.Fatal("Failed to create SQLite database file:", err)
// 		}
// 		file.Close()
// 		fmt.Println("Database file created successfully")
// 	} else {
// 		fmt.Println("Database file already exists")
// 	}
// }

// func ConnectionDB() {
// 	database, err := gorm.Open(sqlite.Open("CPE_Schdule.db?cache=shared"), &gorm.Config{})
// 	if err != nil {
// 		panic("failed to connect database")
// 	}
// 	fmt.Println("connected database")
// 	db = database
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////

import (
	"database/sql"
	"errors"
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

func CreateDatabase() {
	// dsn := "host=localhost user=postgres password=nichakorn25 port=5432 sslmode=disable"
	dsn := "host=localhost user=postgres password=1234 port=5432 sslmode=disable" //salisa
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
	// dsn := "host=localhost user=postgres password=nichakorn25 dbname=cpe_schedule port=5432 sslmode=disable TimeZone=Asia/Bangkok"
	dsn := "host=localhost user=postgres password=1234 dbname=cpe_schedule port=5432 sslmode=disable TimeZone=Asia/Bangkok" //salisa
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
	SeedTitles()
	SeedPositions()
	SeedRoles()
	SeedLaboratory()
	SeedDepartments()
	SeedMajors()
	SeedDataUser()
	SeedCredits()
	SeedTypeOfCourses()
	SeedAcademicYears()
	SeedCurriculums()
	SeedAllCourses()
	SeedUserAllCourses()
	SeedTeachingAssistants()
	SeedConditions()
	SeedOfferedCourses()
	SeedSchedules()
	SeedTimeFixedCourses()
	SeedScheduleTeachingAssistants()
}

// //////////////////////////////////////////////////// ผู้ใช้งาน ///////////////////////////////////////////////
// ครบ
func SeedTitles() {
	titles := []string{
		"ศาสตราจารย์ ดร.",
		"รองศาสตราจารย์ ดร.",
		"ผู้ช่วยศาสตราจารย์ ดร.",
		"อาจารย์ ดร.",
		"ศาสตราจารย์",
		"รองศาสตราจารย์",
		"ผู้ช่วยศาสตราจารย์",
		"อาจารย์",
		"นาย",
		"นาง",
		"นางสาว",
	}
	for _, title := range titles {
		db.FirstOrCreate(&entity.Title{}, entity.Title{Title: title})
	}
}

// เช็คอีกที
func SeedPositions() {
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

// ครบ
func SeedRoles() {
	roles := []string{"Admin", "Scheduler", "Instructor"}
	for _, role := range roles {
		db.FirstOrCreate(&entity.Role{}, &entity.Role{Role: role})
	}
}

// พอแล้ว
func SeedDepartments() {
	departments := []string{
		"สำนักวิชาวิศวกรรมศาสตร์",
		"สำนักวิชาแพทยศาสตร์",
		"สำนักวิชาวิทยาศาสตร์",
	}
	for _, dept := range departments {
		db.FirstOrCreate(&entity.Department{}, entity.Department{DepartmentName: dept})
	}
}

// พอแล้ว
func SeedMajors() {
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

// ครบ
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
			PhoneNumber:   "044224422",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE01",
			FirstPassword: true,
			TitleID:       9,
			PositionID:    4,
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
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE04",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    2,
			MajorID:       1,
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
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE16",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    1,
			MajorID:       1,
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
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE07",
			FirstPassword: false,
			TitleID:       4,
			PositionID:    2,
			MajorID:       1,
			RoleID:        3,
		},
		{
			Username:      "C1234",
			Password:      hashedPassword,
			Firstname:     "คะชา",
			Lastname:      "ชาญศิลป์",
			Image:         "",
			Email:         "kacha@sut.ac.th",
			PhoneNumber:   "044224237",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE12",
			FirstPassword: false,
			TitleID:       2,
			PositionID:    2,
			MajorID:       1,
			RoleID:        3,
		},
		{
			Username:      "D1234",
			Password:      hashedPassword,
			Firstname:     "กิตติศักดิ์",
			Lastname:      "เกิดประสพ",
			Image:         "",
			Email:         "kerdpras@sut.ac.th",
			PhoneNumber:   "044224349",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE09",
			FirstPassword: false,
			TitleID:       2,
			PositionID:    2,
			MajorID:       1,
			RoleID:        3,
		},
		{
			Username:      "E1234",
			Password:      hashedPassword,
			Firstname:     "คมศัลล์",
			Lastname:      "ศรีวิสุทธิ์",
			Image:         "",
			Email:         "komsan@sut.ac.th",
			PhoneNumber:   "044224664",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE13",
			FirstPassword: false,
			TitleID:       4,
			PositionID:    3,
			MajorID:       1,
			RoleID:        3,
		},
		{
			Username:      "F1234",
			Password:      hashedPassword,
			Firstname:     "นิตยา",
			Lastname:      "เกิดประสพ",
			Image:         "",
			Email:         "nittaya@sut.ac.th",
			PhoneNumber:   "044224432",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE10",
			FirstPassword: false,
			TitleID:       2,
			PositionID:    2,
			MajorID:       1,
			RoleID:        3,
		},
		{
			Username:      "G1234",
			Password:      hashedPassword,
			Firstname:     "ปรเมศวร์",
			Lastname:      "ห่อแก้ว",
			Image:         "",
			Email:         "phorkaew@sut.ac.th",
			PhoneNumber:   "044224432",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE08",
			FirstPassword: false,
			TitleID:       2,
			PositionID:    2,
			MajorID:       1,
			RoleID:        3,
		},
		{
			Username:      "H1234",
			Password:      hashedPassword,
			Firstname:     "ปริญญ์",
			Lastname:      "ศรเลิศล้ำวาณิช",
			Image:         "",
			Email:         "parin.s@sut.ac.th",
			PhoneNumber:   "044224452",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE11",
			FirstPassword: false,
			TitleID:       4,
			PositionID:    2,
			MajorID:       1,
			RoleID:        3,
		},
		{
			Username:      "I1234",
			Password:      hashedPassword,
			Firstname:     "สุภาพร",
			Lastname:      "บุญฤทธิ์",
			Image:         "",
			Email:         "sbunrit@sut.ac.th",
			PhoneNumber:   "044224422",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง CPE06",
			FirstPassword: false,
			TitleID:       4,
			PositionID:    2,
			MajorID:       1,
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

// //////////////////////////////////////////////////////////// เงื่อนไข ///////////////////////////////////////////////////////
// ยังใส่ไม่ครบ
func SeedConditions() {
	loc, _ := time.LoadLocation("Asia/Bangkok")

	conditions := []struct {
		DayOfWeek    string
		StartTimeStr string
		EndTimeStr   string
		UserID       uint
	}{
		{"จันทร์", "08:00", "12:00", 8},
		{"อังคาร", "13:00", "17:00", 2},
		{"พุธ", "09:30", "11:30", 3},
		{"พุธ", "12:30", "16:30", 6},
		{"พฤหัสบดี", "09:30", "17:30", 3},
	}

	for _, c := range conditions {
		const fixedDate = "2000-01-01"
		startTime, _ := time.ParseInLocation("2006-01-02 15:04", fixedDate+" "+c.StartTimeStr, loc)
		endTime, _ := time.ParseInLocation("2006-01-02 15:04", fixedDate+" "+c.EndTimeStr, loc)

		db.FirstOrCreate(&entity.Condition{}, &entity.Condition{
			DayOfWeek: c.DayOfWeek,
			StartTime: startTime,
			EndTime:   endTime,
			UserID:    c.UserID,
		})
	}
}

// //////////////////////////////////////////////////////////// วิชา ///////////////////////////////////////////////////////

// ครบ
func SeedLaboratory() {
	laboratories := []entity.Laboratory{
		{Room: "F11419", Building: "อาคารเครื่องมือ 11 (F11)", Capacity: "40"},
		{Room: "F11421", Building: "อาคารเครื่องมือ 11 (F11)", Capacity: "30"},
		{Room: "F11422", Building: "อาคารเครื่องมือ 11 (F11)", Capacity: "50"},
	}

	for _, lab := range laboratories {
		db.FirstOrCreate(&entity.Laboratory{}, &entity.Laboratory{
			Room:     lab.Room,
			Building: lab.Building,
			Capacity: lab.Capacity,
		})
	}
}

// ยังใส่ไม่ครบ
func SeedCredits() {
	credits := []entity.Credit{
		{Unit: 2, Lecture: 2, Lab: 0, Self: 4},
		{Unit: 1, Lecture: 0, Lab: 2, Self: 1},
		{Unit: 3, Lecture: 3, Lab: 0, Self: 6},
		{Unit: 1, Lecture: 1, Lab: 0, Self: 2},
		{Unit: 2, Lecture: 1, Lab: 2, Self: 3},
		{Unit: 4, Lecture: 4, Lab: 0, Self: 8},
		{Unit: 1, Lecture: 0, Lab: 3, Self: 0},
		{Unit: 1, Lecture: 0, Lab: 3, Self: 3},
		{Unit: 2, Lecture: 1, Lab: 3, Self: 5},
		{Unit: 4, Lecture: 3, Lab: 3, Self: 9},
		{Unit: 4, Lecture: 2, Lab: 4, Self: 8},
		{Unit: 1, Lecture: 0, Lab: 0, Self: 0},
		{Unit: 8, Lecture: 0, Lab: 0, Self: 0},
		{Unit: 9, Lecture: 0, Lab: 0, Self: 0},
	}

	for _, credit := range credits {
		var existing entity.Credit
		if err := db.Where("unit = ? AND lecture = ? AND lab = ? AND self = ?", credit.Unit, credit.Lecture, credit.Lab, credit.Self).First(&existing).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			db.Create(&credit)
		}
	}
}

// เคลีย
func SeedTypeOfCourses() {
	types := []entity.TypeOfCourses{
		{Type: 1, TypeName: "หมวดวิชาจากศูนย์บริการ"},
		{Type: 2, TypeName: "กลุ่มวิชาพื้นฐานทางวิศวกรรมศาสตร์"},
		{Type: 3, TypeName: "กลุ่มวิชาชีพบังคับทางวิศวกรรมคอมพิวเตอร์"},
		{Type: 4, TypeName: "กลุ่มวิชาเลือกทางวิศวกรรมคอมพิวเตอร์"},
	}

	for _, t := range types {
		db.FirstOrCreate(&entity.TypeOfCourses{}, entity.TypeOfCourses{
			Type:     t.Type,
			TypeName: t.TypeName,
		})
	}
}

// ครบ
func SeedAcademicYears() {
	years := []entity.AcademicYear{
		{Level: "เรียนได้ทุกชั้นปี"},
		{Level: "1"},
		{Level: "2"},
		{Level: "3"},
		{Level: "4"},
	}
	for _, y := range years {
		db.FirstOrCreate(&entity.AcademicYear{}, entity.AcademicYear{
			Level: y.Level,
		})
	}
}

// พอแล้ว
func SeedCurriculums() {
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
		{CurriculumName: "107050101650	วิศวกรรมคอมพิวเตอร์-2565", Year: 2565, Started: 2566, MajorID: comEng.ID},
		{CurriculumName: "107050101600	วิศวกรรมคอมพิวเตอร์-2560", Year: 2560, Started: 2561, MajorID: comEng.ID},
		{CurriculumName: "107070101003	วิศวกรรมเครื่องกล-2564 (วิศวกรรมชีวการแพทย์)", Year: 2564, Started: 2565, MajorID: mechEng.ID},
		{CurriculumName: "107070101005	วิศวกรรมเครื่องกล-2564 (วิศวกรรมระบบควบคุม)", Year: 2564, Started: 2565, MajorID: mechEng.ID},
		{CurriculumName: "109010101580	ทันตแพทยศาสตรบัณฑิต-2558", Year: 2558, Started: 2559, MajorID: dentistry.ID},
		{CurriculumName: "109010101601	ทันตแพทยศาสตรบัณฑิต-2560(2558)", Year: 2565, Started: 2022, MajorID: dentistry.ID},
		{CurriculumName: "107110101600	วิศวกรรมไฟฟ้า-2560(2559)", Year: 2560, Started: 2561, MajorID: elecEng.ID},
		{CurriculumName: "101220101660	วิทยาการคอมพิวเตอร์-2566", Year: 2566, Started: 2567, MajorID: csScience.ID},
		{CurriculumName: "101220101661	วิทยาการคอมพิวเตอร์-2566 -โทความเป็นผู้ประกอบการ", Year: 2566, Started: 2567, MajorID: csScience.ID},
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

// ยังใส่ไม่ครบ
func SeedAllCourses() {
	var (
		curriculumComEng1 entity.Curriculum

		yearAll entity.AcademicYear
		year1   entity.AcademicYear
		year2   entity.AcademicYear
		year3   entity.AcademicYear
		year4   entity.AcademicYear

		type1 entity.TypeOfCourses
		type2 entity.TypeOfCourses
		type3 entity.TypeOfCourses
		type4 entity.TypeOfCourses

		credit2_2_0_4 entity.Credit
		credit1_0_2_1 entity.Credit
		credit3_3_0_6 entity.Credit
		credit1_1_0_2 entity.Credit
		credit2_1_2_3 entity.Credit
		credit4_4_0_8 entity.Credit
		credit1_0_3_0 entity.Credit
		credit1_0_3_3 entity.Credit
		credit2_1_3_5 entity.Credit
		credit4_3_3_9 entity.Credit
		credit4_2_4_8 entity.Credit
		credit1_0_0_0 entity.Credit
		credit8_0_0_0 entity.Credit
		credit9_0_0_0 entity.Credit
	)
	db.First(&curriculumComEng1, "curriculum_name = ?", "107050101650	วิศวกรรมคอมพิวเตอร์-2565")

	db.First(&yearAll, "level = ?", "เรียนได้ทุกชั้นปี")
	db.First(&year1, "level = ?", "1")
	db.First(&year2, "level = ?", "2")
	db.First(&year3, "level = ?", "3")
	db.First(&year4, "level = ?", "4")

	db.First(&type1, "type_name = ?", "หมวดวิชาจากศูนย์บริการ")
	db.First(&type2, "type_name = ?", "กลุ่มวิชาพื้นฐานทางวิศวกรรมศาสตร์")
	db.First(&type3, "type_name = ?", "กลุ่มวิชาชีพบังคับทางวิศวกรรมคอมพิวเตอร์")
	db.First(&type4, "type_name = ?", "กลุ่มวิชาเลือกทางวิศวกรรมคอมพิวเตอร์")

	db.First(&credit2_2_0_4, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 2, 2, 0, 4)
	db.First(&credit1_0_2_1, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 1, 0, 2, 1)
	db.First(&credit3_3_0_6, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 3, 3, 0, 6)
	db.First(&credit1_1_0_2, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 1, 1, 0, 2)
	db.First(&credit2_1_2_3, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 2, 1, 2, 3)
	db.First(&credit4_4_0_8, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 4, 4, 0, 8)
	db.First(&credit1_0_3_0, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 1, 0, 3, 0)
	db.First(&credit1_0_3_3, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 1, 0, 3, 3)
	db.First(&credit2_1_3_5, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 2, 1, 3, 5)
	db.First(&credit4_3_3_9, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 4, 3, 3, 9)
	db.First(&credit4_2_4_8, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 4, 2, 4, 8)
	db.First(&credit1_0_0_0, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 1, 0, 0, 0)
	db.First(&credit8_0_0_0, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 8, 0, 0, 0)
	db.First(&credit9_0_0_0, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 9, 0, 0, 0)

	courses := []entity.AllCourses{
		{
			Code:            "IST20 1001",
			EnglishName:     "Digital Literacy",
			ThaiName:        "การรู้ดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 1002",
			EnglishName:     "Use of Application Programs for Learning",
			ThaiName:        "การใช้โปรแกรมประยุกต์เพื่อการเรียนรู้",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit1_0_2_1.ID,
		},
		{
			Code:            "IST20 1003",
			EnglishName:     "Life Skills",
			ThaiName:        "ทักษะชีวิต",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST20 1004",
			EnglishName:     "Citizenship and Global Citizens",
			ThaiName:        "ความเป็นพลเมืองและพลเมืองโลก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST20 2001",
			EnglishName:     "Man, Society and Environment",
			ThaiName:        "มนุษย์กับสังคมและสิ่งแวดล้อม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST20 2002",
			EnglishName:     "Man, Economy and Development",
			ThaiName:        "มนุษย์กับเศรษฐกิจและการพัฒนา",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST30 1101",
			EnglishName:     "English for Communication I",
			ThaiName:        "ภาษาอังกฤษเพื่อการสื่อสาร 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST30 1102",
			EnglishName:     "English for Communication II",
			ThaiName:        "ภาษาอังกฤษเพื่อการสื่อสาร 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST30 1103",
			EnglishName:     "English for Academic Purposes",
			ThaiName:        "ภาษาอังกฤษเพื่อวัตถุประสงค์ทางวิชาการ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST30 1104",
			EnglishName:     "English for Specific Purposes",
			ThaiName:        "ภาษาอังกฤษเพื่อวัตถุประสงค์เฉพาะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "IST30 1105",
			EnglishName:     "English for Careers",
			ThaiName:        "ภาษาอังกฤษเพื่อการทำงาน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
		},
		{
			Code:            "DGT00 0140",
			EnglishName:     "ARTIFICIAL INTELLIGENCE LITERACY",
			ThaiName:        "การรู้เท่าทันปัญญาประดิษฐ์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit1_1_0_2.ID,
		},
		{
			Code:            "ENG20 1110",
			EnglishName:     "PERSONAL FINANCE",
			ThaiName:        "การเงินส่วนบุคคล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "ENG51 1901",
			EnglishName:     "AI FOR EFFECTIVE LEARNING",
			ThaiName:        "การใช้ปัญญาประดิษฐ์สำหรับการเรียนรู้อย่างมีประสิทธิภาพ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IPH03 4013",
			EnglishName:     "ADOLESCENT AND YOUTH SAFETY",
			ThaiName:        "ความปลอดภัยสำหรับวัยรุ่นและเยาวชน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 1501",
			EnglishName:     "THAI FOR COMMUNICATION",
			ThaiName:        "ภาษาไทยเพื่อการสื่อสาร",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 1502",
			EnglishName:     "ART APPRECIATION",
			ThaiName:        "ศิลปวิจักษ์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 1503",
			EnglishName:     "HOLISTIC HEALTH",
			ThaiName:        "สุขภาพองค์รวม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 1504",
			EnglishName:     "LAW IN DAILY LIFE",
			ThaiName:        "กฎหมายในชีวิตประจำวัน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 1507",
			EnglishName:     "LAW IN DAILY LIFE",
			ThaiName:        "กฎหมายในชีวิตประจำวัน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 2501",
			EnglishName:     "PROFESSIONAL AND COMMUNITY ENGAGEMENT",
			ThaiName:        "พันธกิจสัมพันธ์ชุมชนกับกลุ่มอาชีพ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 2502",
			EnglishName:     "PLURI-CULTURAL THAI STUDIES",
			ThaiName:        "ไทยศึกษาเชิงพหุวัฒนธรรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 2503",
			EnglishName:     "ASEAN STUDIES",
			ThaiName:        "อาเซียนศึกษา ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 2504",
			EnglishName:     "DESIGN THINKING",
			ThaiName:        "การคิดเชิงออกแบบ ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "IST20 2505",
			EnglishName:     "LOVE YOURSELF",
			ThaiName:        "ฮักเจ้าของ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "ENG20 1010",
			EnglishName:     "Introduction to Engineering Profession",
			ThaiName:        "แนะนำวิชาชีพวิศวกรรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit1_0_3_3.ID,
		},
		{
			Code:            "ENG23 1001",
			EnglishName:     "Computer Programming I",
			ThaiName:        "การเขียนโปรแกรมคอมพิวเตอร์ 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_1_3_5.ID,
		},
		{
			Code:            "ENG23 2001",
			EnglishName:     "Computer Programming II",
			ThaiName:        "การเขียนโปรแกรมคอมพิวเตอร์ 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_1_3_5.ID,
		},
		{
			Code:            "ENG23 3001",
			EnglishName:     "Computer Statistics",
			ThaiName:        "สถิติทางคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_2_0_4.ID,
		},
		{
			Code:            "ENG25 1010",
			EnglishName:     "Engineering Graphics I",
			ThaiName:        "การเขียนแบบวิศวกรรม 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_1_3_5.ID,
		},
		{
			Code:            "ENG31 1001",
			EnglishName:     "Engineering Materials",
			ThaiName:        "วัสดุวิศวกรรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 2003",
			EnglishName:     "Problem Solving with Programming",
			ThaiName:        "การแก้ปัญหาด้วยการโปรแกรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit2_1_3_5.ID,
		},
		{
			Code:            "ENG23 2011",
			EnglishName:     "Database Systems",
			ThaiName:        "ระบบฐานข้อมูล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 4080",
			EnglishName:     "Computer Engineering Capstone Project",
			ThaiName:        "โครงงานวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 2031",
			EnglishName:     "Data Structures and Algorithms",
			ThaiName:        "โครงสร้างข้อมูลและขั้นตอนวิธี",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 2032",
			EnglishName:     "Object–Oriented Technology",
			ThaiName:        "เทคโนโลยีเชิงวัตถุ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3031",
			EnglishName:     "System Analysis and Design",
			ThaiName:        "การวิเคราะห์และออกแบบระบบ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3032",
			EnglishName:     "Software Engineering",
			ThaiName:        "วิศวกรรมซอฟต์แวร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 2051",
			EnglishName:     "Programming Fundamentals",
			ThaiName:        "พื้นฐานการเขียนโปรแกรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3051",
			EnglishName:     "Formal Methods and Computability",
			ThaiName:        "วิธีฟอร์มลและภาวะคำนวณได้",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3052",
			EnglishName:     "Computer and Communication",
			ThaiName:        "คอมพิวเตอร์และการสื่อสาร",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3053",
			EnglishName:     "Computer Networks",
			ThaiName:        "เครือข่ายคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3054",
			EnglishName:     "Operating Systems",
			ThaiName:        "ระบบปฏิบัติการ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 2071",
			EnglishName:     "Electronics for Computer Engineering",
			ThaiName:        "อิเล็กทรอนิกส์สำหรับวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 2072",
			EnglishName:     "Electronic Laboratory for Computer Engineering",
			ThaiName:        "ปฏิบัติการอิเล็กทรอนิกส์สำหรับวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit1_0_3_3.ID,
		},
		{
			Code:            "ENG23 2073",
			EnglishName:     "Digital System Design",
			ThaiName:        "การออกแบบระบบดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 2074",
			EnglishName:     "Digital System Laboratory",
			ThaiName:        "ปฏิบัติการระบบดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit1_0_3_3.ID,
		},
		{
			Code:            "ENG23 2075",
			EnglishName:     "Computer Mathematics",
			ThaiName:        "คณิตศาสตร์ทางคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 2076",
			EnglishName:     "Computer Architecture and Organization",
			ThaiName:        "โครงสร้างและสถาปัตยกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 2077",
			EnglishName:     "Microprocessors",
			ThaiName:        "ไมโครโพรเซสเซอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3012",
			EnglishName:     "Knowledge Discovery and Data Mining",
			ThaiName:        "การค้นพบความรู้และการทำเหมืองข้อมูล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3013",
			EnglishName:     "Web Applications",
			ThaiName:        "เว็บแอพพลิเคชัน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3014",
			EnglishName:     "Introduction to Natural Language Processing",
			ThaiName:        "การประมวลผลภาษาธรรมชาติเบื้องต้น",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3015",
			EnglishName:     "Machine Learning Fundamentals",
			ThaiName:        "พื้นฐานการเรียนรู้ของเครื่อง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3016",
			EnglishName:     "Business Intelligence",
			ThaiName:        "ธุรกิจอัจฉริยะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3033",
			EnglishName:     "Event-Driven Programming",
			ThaiName:        "การเขียนโปรแกรมที่ขับเคลื่อนโดยเหตุการณ์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3055",
			EnglishName:     "Introduction to Blockchain Technology",
			ThaiName:        "เทคโนโลยีบล็อกเชนเบื้องต้น",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3072",
			EnglishName:     "Embedded Systems",
			ThaiName:        "ระบบฝังตัว",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3073",
			EnglishName:     "Advanced Digital System Design",
			ThaiName:        "การออกแบบระบบดิจิทัลขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 3074",
			EnglishName:     "Serverless and Cloud Architectures",
			ThaiName:        "สถาปัตยกรรมไร้แม่ข่ายและคลาวด์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 3075",
			EnglishName:     "Advanced Database Systems",
			ThaiName:        "ระบบฐานข้อมูลขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4011",
			EnglishName:     "Artificial Intelligence in Applications",
			ThaiName:        "ปัญญาประดิษฐ์ในงานประยุกต์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4013",
			EnglishName:     "Intelligent Methodologies",
			ThaiName:        "ระเบียบวิธีอัจฉริยะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4014",
			EnglishName:     "Artificial Neural Networks",
			ThaiName:        "เครือข่ายประสาทเทียม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4015",
			EnglishName:     "Semantic Web",
			ThaiName:        "เว็บเชิงความหมาย",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4016",
			EnglishName:     "Computer and Data Analysis",
			ThaiName:        "คอมพิวเตอร์และการวิเคราะห์ข้อมูล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4017",
			EnglishName:     "Health and Environmental Informatics",
			ThaiName:        "อินฟอร์แมติกส์สุขภาพและสิ่งแวดล้อม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4018",
			EnglishName:     "Deep Learning",
			ThaiName:        "การเรียนรู้เชิงลึก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4019",
			EnglishName:     "Advanced Web Application Development",
			ThaiName:        "การพัฒนาเว็บแอพพลิเคชันขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 4033",
			EnglishName:     "Software Testing",
			ThaiName:        "การทดสอบซอฟต์แวร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4035",
			EnglishName:     "Software Process",
			ThaiName:        "กระบวนการซอฟต์แวร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4041",
			EnglishName:     "Cyber Security Fundamentals",
			ThaiName:        "พื้นฐานความมั่นคงไซเบอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4042",
			EnglishName:     "Advanced Cyber Security",
			ThaiName:        "ความมั่นคงไซเบอร์ขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4031",
			EnglishName:     "Computer Graphics",
			ThaiName:        "คอมพิวเตอร์กราฟิก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4032",
			EnglishName:     "Digital Image Processing",
			ThaiName:        "การประมวลผลภาพดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4033",
			EnglishName:     "Computer Vision",
			ThaiName:        "การมองเห็นด้วยคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4034",
			EnglishName:     "Computer Network Programming and Network Automation",
			ThaiName:        "การเขียนโปรแกรมเครือข่ายคอมพิวเตอร์และเครือข่ายอัตโนมัติ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 4060",
			EnglishName:     "Algorithm Analysis and Design",
			ThaiName:        "การวิเคราะห์และออกแบบขั้นตอนวิธี",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4071",
			EnglishName:     "Optimization Methods",
			ThaiName:        "วิธีหาค่าเหมาะที่สุด",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4072",
			EnglishName:     "Numerical Analysis",
			ThaiName:        "การวิเคราะห์เชิงตัวเลข",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4073",
			EnglishName:     "Micro Robot Development",
			ThaiName:        "การพัฒนาหุ่นยนต์ขนาดเล็ก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 4074",
			EnglishName:     "Internet of Things and Smart System",
			ThaiName:        "อินเทอร์เน็ตของสรรพสิ่งและระบบอัจฉริยะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
		},
		{
			Code:            "ENG23 4081",
			EnglishName:     "Special Problems in Computer Engineering I",
			ThaiName:        "ปัญหาเฉพาะเรื่องทางวิศวกรรมคอมพิวเตอร์ 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4082",
			EnglishName:     "Special Problems in Computer Engineering II",
			ThaiName:        "ปัญหาเฉพาะเรื่องทางวิศวกรรมคอมพิวเตอร์ 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4097",
			EnglishName:     "Advanced Topics in Computer Engineering I",
			ThaiName:        "หัวข้อขั้นสูงในวิศวกรรมคอมพิวเตอร์ 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4098",
			EnglishName:     "Advanced Topics in Computer Engineering II",
			ThaiName:        "หัวข้อขั้นสูงในวิศวกรรมคอมพิวเตอร์ 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4099",
			EnglishName:     "Introduction to Research Methods",
			ThaiName:        "ความรู้เบื้องต้นเกี่ยวกับวิธีวิจัย",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
		},
		{
			Code:            "ENG23 4090",
			EnglishName:     "Pre-cooperative Education",
			ThaiName:        "เตรียมสหกิจศึกษา",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit1_0_0_0.ID,
		},
		{
			Code:            "ENG23 4091",
			EnglishName:     "Cooperative Education I",
			ThaiName:        "สหกิจศึกษา 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit8_0_0_0.ID,
		},
		{
			Code:            "ENG23 4092",
			EnglishName:     "Cooperative Education II",
			ThaiName:        "สหกิจศึกษา 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit8_0_0_0.ID,
		},
		{
			Code:            "ENG23 4094",
			EnglishName:     "Computer Engineering Study Project",
			ThaiName:        "โครงการศึกษาวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit9_0_0_0.ID,
		},
		{
			Code:            "ENG20 2010",
			EnglishName:     "Multidisciplinary Project-Based Learning I",
			ThaiName:        "การเรียนรู้โดยโครงงานสหวิทยาการเบื้องต้น 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
		},
		{
			Code:            "ENG20 3010",
			EnglishName:     "Multidisciplinary Project-Based Learning II",
			ThaiName:        "การเรียนรู้โดยโครงงานสหวิทยาการเบื้องต้น 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
		},
		{
			Code:            "ENG20 4010",
			EnglishName:     "Multidisciplinary Project-Based Learning III",
			ThaiName:        "การเรียนรู้โดยโครงงานสหวิทยาการเบื้องต้น 3",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
		},
		{
			Code:            "ENG20 2020",
			EnglishName:     "Global Project Based Learning I",
			ThaiName:        "การเรียนรู้โดยโครงงานนานาชาติขั้นพื้นฐาน 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
		},
		{
			Code:            "ENG20 3020",
			EnglishName:     "Global Project Based Learning II",
			ThaiName:        "การเรียนรู้โดยโครงงานนานาชาติขั้นพื้นฐาน 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
		},
		{
			Code:            "ENG20 4020",
			EnglishName:     "Global Project Based Learning III",
			ThaiName:        "การเรียนรู้โดยโครงงานนานาชาติขั้นพื้นฐาน 3",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
		},
	}
	for _, course := range courses {
		var existing entity.AllCourses
		db.Where("code = ?", course.Code).First(&existing)

		if existing.ID == 0 {
			db.Create(&course)
		}
	}

}

// ยังใส่ไม่ครบ
func SeedUserAllCourses() {
	var (
		admin  entity.User
		ss1234 entity.User
		a1234  entity.User
		b1234  entity.User
		c1234  entity.User
		d1234  entity.User
		e1234  entity.User
		f1234  entity.User
		g1234  entity.User
		h1234  entity.User
		i1234  entity.User

		ist201001 entity.AllCourses
		ist201002 entity.AllCourses
		ist201003 entity.AllCourses
		ist201004 entity.AllCourses
		ist202001 entity.AllCourses
		ist202002 entity.AllCourses
		ist301101 entity.AllCourses
		ist301102 entity.AllCourses
		ist301103 entity.AllCourses
		ist301104 entity.AllCourses
		ist301105 entity.AllCourses
		dgt000140 entity.AllCourses
		eng201110 entity.AllCourses
		eng511901 entity.AllCourses
		iph034013 entity.AllCourses
		ist201501 entity.AllCourses
		ist201502 entity.AllCourses
		ist201503 entity.AllCourses
		ist201504 entity.AllCourses
		ist201507 entity.AllCourses
		ist202501 entity.AllCourses
		ist202502 entity.AllCourses
		ist202503 entity.AllCourses
		ist202504 entity.AllCourses
		ist202505 entity.AllCourses
		eng201010 entity.AllCourses
		eng231001 entity.AllCourses
		eng232001 entity.AllCourses
		eng233001 entity.AllCourses
		eng251010 entity.AllCourses
		eng311001 entity.AllCourses
		eng232003 entity.AllCourses
		eng232011 entity.AllCourses
		eng234080 entity.AllCourses
		eng232031 entity.AllCourses
		eng232032 entity.AllCourses
		eng233031 entity.AllCourses
		eng233032 entity.AllCourses
		eng232051 entity.AllCourses
		eng233051 entity.AllCourses
		eng233052 entity.AllCourses
		eng233053 entity.AllCourses
		eng233054 entity.AllCourses
		eng232071 entity.AllCourses
		eng232072 entity.AllCourses
		eng232073 entity.AllCourses
		eng232074 entity.AllCourses
		eng232075 entity.AllCourses
		eng232076 entity.AllCourses
		eng232077 entity.AllCourses
		eng233012 entity.AllCourses
		eng233013 entity.AllCourses
		eng233014 entity.AllCourses
		eng233015 entity.AllCourses
		eng233016 entity.AllCourses
		eng233033 entity.AllCourses
		eng233055 entity.AllCourses
		eng233072 entity.AllCourses
		eng233073 entity.AllCourses
		eng233074 entity.AllCourses
		eng233075 entity.AllCourses
		eng234011 entity.AllCourses
		eng234013 entity.AllCourses
		eng234014 entity.AllCourses
		eng234015 entity.AllCourses
		eng234016 entity.AllCourses
		eng234017 entity.AllCourses
		eng234018 entity.AllCourses
		eng234019 entity.AllCourses
		eng234033 entity.AllCourses
		eng234035 entity.AllCourses
		eng234041 entity.AllCourses
		eng234042 entity.AllCourses
		eng234031 entity.AllCourses
		eng234032 entity.AllCourses
		eng234034 entity.AllCourses
		eng234060 entity.AllCourses
		eng234071 entity.AllCourses
		eng234072 entity.AllCourses
		eng234073 entity.AllCourses
		eng234074 entity.AllCourses
		eng234081 entity.AllCourses
		eng234082 entity.AllCourses
		eng234097 entity.AllCourses
		eng234098 entity.AllCourses
		eng234099 entity.AllCourses
		eng234090 entity.AllCourses
		eng234091 entity.AllCourses
		eng234092 entity.AllCourses
		eng234094 entity.AllCourses
		eng202010 entity.AllCourses
		eng203010 entity.AllCourses
		eng204010 entity.AllCourses
		eng202020 entity.AllCourses
		eng203020 entity.AllCourses
		eng204020 entity.AllCourses
	)

	db.First(&admin, "username = ?", "admin")
	db.First(&ss1234, "username = ?", "SS1234")
	db.First(&a1234, "username = ?", "A1234")
	db.First(&b1234, "username = ?", "B1234")
	db.First(&c1234, "username = ?", "C1234")
	db.First(&d1234, "username = ?", "D1234")
	db.First(&e1234, "username = ?", "E1234")
	db.First(&f1234, "username = ?", "F1234")
	db.First(&g1234, "username = ?", "G1234")
	db.First(&h1234, "username = ?", "H1234")
	db.First(&i1234, "username = ?", "I1234")

	db.First(&ist201001, "code = ?", "IST20 1001")
	db.First(&ist201002, "code = ?", "IST20 1002")
	db.First(&ist201003, "code = ?", "IST20 1003")
	db.First(&ist201004, "code = ?", "IST20 1004")
	db.First(&ist202001, "code = ?", "IST20 2001")
	db.First(&ist202002, "code = ?", "IST20 2002")
	db.First(&ist301101, "code = ?", "IST30 1101")
	db.First(&ist301102, "code = ?", "IST30 1102")
	db.First(&ist301103, "code = ?", "IST30 1103")
	db.First(&ist301104, "code = ?", "IST30 1104")
	db.First(&ist301105, "code = ?", "IST30 1105")
	db.First(&dgt000140, "code = ?", "DGT00 0140")
	db.First(&eng201110, "code = ?", "ENG20 1110")
	db.First(&eng511901, "code = ?", "ENG51 1901")
	db.First(&iph034013, "code = ?", "IPH03 4013")
	db.First(&ist201501, "code = ?", "IST20 1501")
	db.First(&ist201502, "code = ?", "IST20 1502")
	db.First(&ist201503, "code = ?", "IST20 1503")
	db.First(&ist201504, "code = ?", "IST20 1504")
	db.First(&ist201507, "code = ?", "IST20 1507")
	db.First(&ist202501, "code = ?", "IST20 2501")
	db.First(&ist202502, "code = ?", "IST20 2502")
	db.First(&ist202503, "code = ?", "IST20 2503")
	db.First(&ist202504, "code = ?", "IST20 2504")
	db.First(&ist202505, "code = ?", "IST20 2505")
	db.First(&eng201010, "code = ?", "ENG20 1010")
	db.First(&eng231001, "code = ?", "ENG23 1001")
	db.First(&eng232001, "code = ?", "ENG23 2001")
	db.First(&eng233001, "code = ?", "ENG23 3001")
	db.First(&eng251010, "code = ?", "ENG25 1010")
	db.First(&eng311001, "code = ?", "ENG31 1001")
	db.First(&eng232003, "code = ?", "ENG23 2003")
	db.First(&eng232011, "code = ?", "ENG23 2011")
	db.First(&eng234080, "code = ?", "ENG23 4080")
	db.First(&eng232031, "code = ?", "ENG23 2031")
	db.First(&eng232032, "code = ?", "ENG23 2032")
	db.First(&eng233031, "code = ?", "ENG23 3031")
	db.First(&eng233032, "code = ?", "ENG23 3032")
	db.First(&eng232051, "code = ?", "ENG23 2051")
	db.First(&eng233051, "code = ?", "ENG23 3051")
	db.First(&eng233052, "code = ?", "ENG23 3052")
	db.First(&eng233053, "code = ?", "ENG23 3053")
	db.First(&eng233054, "code = ?", "ENG23 3054")
	db.First(&eng232071, "code = ?", "ENG23 2071")
	db.First(&eng232072, "code = ?", "ENG23 2072")
	db.First(&eng232073, "code = ?", "ENG23 2073")
	db.First(&eng232074, "code = ?", "ENG23 2074")
	db.First(&eng232075, "code = ?", "ENG23 2075")
	db.First(&eng232076, "code = ?", "ENG23 2076")
	db.First(&eng232077, "code = ?", "ENG23 2077")
	db.First(&eng233012, "code = ?", "ENG23 3012")
	db.First(&eng233013, "code = ?", "ENG23 3013")
	db.First(&eng233014, "code = ?", "ENG23 3014")
	db.First(&eng233015, "code = ?", "ENG23 3015")
	db.First(&eng233016, "code = ?", "ENG23 3016")
	db.First(&eng233033, "code = ?", "ENG23 3033")
	db.First(&eng233055, "code = ?", "ENG23 3055")
	db.First(&eng233072, "code = ?", "ENG23 3072")
	db.First(&eng233073, "code = ?", "ENG23 3073")
	db.First(&eng233074, "code = ?", "ENG23 3074")
	db.First(&eng233075, "code = ?", "ENG23 3075")
	db.First(&eng234011, "code = ?", "ENG23 4011")
	db.First(&eng234013, "code = ?", "ENG23 4013")
	db.First(&eng234014, "code = ?", "ENG23 4014")
	db.First(&eng234015, "code = ?", "ENG23 4015")
	db.First(&eng234016, "code = ?", "ENG23 4016")
	db.First(&eng234017, "code = ?", "ENG23 4017")
	db.First(&eng234018, "code = ?", "ENG23 4018")
	db.First(&eng234019, "code = ?", "ENG23 4019")
	db.First(&eng234033, "code = ?", "ENG23 4033")
	db.First(&eng234035, "code = ?", "ENG23 4035")
	db.First(&eng234041, "code = ?", "ENG23 4041")
	db.First(&eng234042, "code = ?", "ENG23 4042")
	db.First(&eng234031, "code = ?", "ENG23 4031")
	db.First(&eng234032, "code = ?", "ENG23 4032")
	db.First(&eng234034, "code = ?", "ENG23 4034")
	db.First(&eng234060, "code = ?", "ENG23 4060")
	db.First(&eng234071, "code = ?", "ENG23 4071")
	db.First(&eng234072, "code = ?", "ENG23 4072")
	db.First(&eng234073, "code = ?", "ENG23 4073")
	db.First(&eng234074, "code = ?", "ENG23 4074")
	db.First(&eng234081, "code = ?", "ENG23 4081")
	db.First(&eng234082, "code = ?", "ENG23 4082")
	db.First(&eng234097, "code = ?", "ENG23 4097")
	db.First(&eng234098, "code = ?", "ENG23 4098")
	db.First(&eng234099, "code = ?", "ENG23 4099")
	db.First(&eng234090, "code = ?", "ENG23 4090")
	db.First(&eng234091, "code = ?", "ENG23 4091")
	db.First(&eng234092, "code = ?", "ENG23 4092")
	db.First(&eng234094, "code = ?", "ENG23 4094")
	db.First(&eng202010, "code = ?", "ENG20 2010")
	db.First(&eng203010, "code = ?", "ENG20 3010")
	db.First(&eng204010, "code = ?", "ENG20 4010")
	db.First(&eng202020, "code = ?", "ENG20 2020")
	db.First(&eng203020, "code = ?", "ENG20 3020")
	db.First(&eng204020, "code = ?", "ENG20 4020")

	enrollments := []entity.UserAllCourses{
		{UserID: admin.ID, AllCoursesID: ist201001.ID},
		{UserID: admin.ID, AllCoursesID: ist201002.ID},
		{UserID: admin.ID, AllCoursesID: ist201003.ID},
		{UserID: admin.ID, AllCoursesID: ist201004.ID},
		{UserID: admin.ID, AllCoursesID: ist202001.ID},
		{UserID: admin.ID, AllCoursesID: ist202002.ID},
		{UserID: admin.ID, AllCoursesID: ist301101.ID},
		{UserID: admin.ID, AllCoursesID: ist301102.ID},
		{UserID: admin.ID, AllCoursesID: ist301103.ID},
		{UserID: admin.ID, AllCoursesID: ist301104.ID},
		{UserID: admin.ID, AllCoursesID: ist301105.ID},
		{UserID: admin.ID, AllCoursesID: dgt000140.ID},
		{UserID: admin.ID, AllCoursesID: eng201110.ID},
		{UserID: admin.ID, AllCoursesID: eng511901.ID},
		{UserID: admin.ID, AllCoursesID: iph034013.ID},
		{UserID: admin.ID, AllCoursesID: ist201501.ID},
		{UserID: admin.ID, AllCoursesID: ist201502.ID},
		{UserID: admin.ID, AllCoursesID: ist201503.ID},
		{UserID: admin.ID, AllCoursesID: ist201504.ID},
		{UserID: admin.ID, AllCoursesID: ist201507.ID},
		{UserID: admin.ID, AllCoursesID: ist202501.ID},
		{UserID: admin.ID, AllCoursesID: ist202502.ID},
		{UserID: admin.ID, AllCoursesID: ist202503.ID},
		{UserID: admin.ID, AllCoursesID: ist202504.ID},
		{UserID: admin.ID, AllCoursesID: ist202505.ID},
		{UserID: admin.ID, AllCoursesID: eng201010.ID},
		{UserID: admin.ID, AllCoursesID: eng231001.ID},
		{UserID: admin.ID, AllCoursesID: eng232001.ID},
		{UserID: admin.ID, AllCoursesID: eng233001.ID},
		{UserID: admin.ID, AllCoursesID: eng251010.ID},
		{UserID: admin.ID, AllCoursesID: eng311001.ID},

		{UserID: a1234.ID, AllCoursesID: eng232003.ID},
		{UserID: ss1234.ID, AllCoursesID: eng232011.ID},
		{UserID: a1234.ID, AllCoursesID: eng232011.ID},
		{UserID: i1234.ID, AllCoursesID: eng234080.ID},
		{UserID: i1234.ID, AllCoursesID: eng232031.ID},
		{UserID: a1234.ID, AllCoursesID: eng232032.ID},
		{UserID: e1234.ID, AllCoursesID: eng233031.ID},
		{UserID: e1234.ID, AllCoursesID: eng233031.ID},
		{UserID: e1234.ID, AllCoursesID: eng233032.ID},
		{UserID: f1234.ID, AllCoursesID: eng232051.ID},
		{UserID: d1234.ID, AllCoursesID: eng233051.ID},
		{UserID: g1234.ID, AllCoursesID: eng233052.ID},
		{UserID: h1234.ID, AllCoursesID: eng233053.ID},
		{UserID: ss1234.ID, AllCoursesID: eng233054.ID},
		{UserID: a1234.ID, AllCoursesID: eng233054.ID},
		{UserID: b1234.ID, AllCoursesID: eng232071.ID},
		{UserID: g1234.ID, AllCoursesID: eng232071.ID},
		{UserID: b1234.ID, AllCoursesID: eng232072.ID},
		{UserID: g1234.ID, AllCoursesID: eng232072.ID},
		{UserID: b1234.ID, AllCoursesID: eng232073.ID},
		{UserID: b1234.ID, AllCoursesID: eng232074.ID},
		{UserID: ss1234.ID, AllCoursesID: eng232075.ID},
		{UserID: i1234.ID, AllCoursesID: eng232075.ID},
		{UserID: i1234.ID, AllCoursesID: eng232076.ID},
		{UserID: b1234.ID, AllCoursesID: eng232077.ID},

		{UserID: admin.ID, AllCoursesID: eng233012.ID},
		{UserID: admin.ID, AllCoursesID: eng233013.ID},
		{UserID: admin.ID, AllCoursesID: eng233014.ID},
		{UserID: admin.ID, AllCoursesID: eng233015.ID},
		{UserID: admin.ID, AllCoursesID: eng233016.ID},
		{UserID: admin.ID, AllCoursesID: eng233033.ID},
		{UserID: admin.ID, AllCoursesID: eng233055.ID},
		{UserID: admin.ID, AllCoursesID: eng233072.ID},
		{UserID: admin.ID, AllCoursesID: eng233073.ID},
		{UserID: admin.ID, AllCoursesID: eng233074.ID},
		{UserID: admin.ID, AllCoursesID: eng233075.ID},
		{UserID: admin.ID, AllCoursesID: eng234011.ID},
		{UserID: admin.ID, AllCoursesID: eng234013.ID},
		{UserID: admin.ID, AllCoursesID: eng234014.ID},
		{UserID: admin.ID, AllCoursesID: eng234015.ID},
		{UserID: admin.ID, AllCoursesID: eng234016.ID},
		{UserID: admin.ID, AllCoursesID: eng234017.ID},
		{UserID: admin.ID, AllCoursesID: eng234018.ID},
		{UserID: admin.ID, AllCoursesID: eng234019.ID},
		{UserID: admin.ID, AllCoursesID: eng234033.ID},
		{UserID: admin.ID, AllCoursesID: eng234035.ID},
		{UserID: admin.ID, AllCoursesID: eng234041.ID},
		{UserID: admin.ID, AllCoursesID: eng234042.ID},
		{UserID: admin.ID, AllCoursesID: eng234031.ID},
		{UserID: admin.ID, AllCoursesID: eng234032.ID},
		{UserID: admin.ID, AllCoursesID: eng234034.ID},
		{UserID: admin.ID, AllCoursesID: eng234060.ID},
		{UserID: admin.ID, AllCoursesID: eng234071.ID},
		{UserID: admin.ID, AllCoursesID: eng234072.ID},
		{UserID: admin.ID, AllCoursesID: eng234073.ID},
		{UserID: admin.ID, AllCoursesID: eng234074.ID},
		{UserID: admin.ID, AllCoursesID: eng234081.ID},
		{UserID: admin.ID, AllCoursesID: eng234082.ID},
		{UserID: admin.ID, AllCoursesID: eng234097.ID},
		{UserID: admin.ID, AllCoursesID: eng234098.ID},
		{UserID: admin.ID, AllCoursesID: eng234099.ID},
		{UserID: admin.ID, AllCoursesID: eng234090.ID},
		{UserID: admin.ID, AllCoursesID: eng234091.ID},
		{UserID: admin.ID, AllCoursesID: eng234092.ID},
		{UserID: admin.ID, AllCoursesID: eng234094.ID},
		{UserID: admin.ID, AllCoursesID: eng202010.ID},
		{UserID: admin.ID, AllCoursesID: eng203010.ID},
		{UserID: admin.ID, AllCoursesID: eng204010.ID},
		{UserID: admin.ID, AllCoursesID: eng202020.ID},
		{UserID: admin.ID, AllCoursesID: eng203020.ID},
		{UserID: admin.ID, AllCoursesID: eng204020.ID},
	}
	for _, enroll := range enrollments {
		db.Where("user_id = ? AND all_courses_id = ?", enroll.UserID, enroll.AllCoursesID).FirstOrCreate(&enroll)
	}
}

// //////////////////////////////////////////////////////////// ผู้ช่วยสอน ///////////////////////////////////////////////////////
// ยังไม่แก้ไข
func SeedTeachingAssistants() {

	assistants := []entity.TeachingAssistant{
		{
			Firstname:   "สมชาย",
			Lastname:    "ใจดี",
			Email:       "แม็ค",
			PhoneNumber: "0812345678",
			TitleID:     9,
		},
		{
			Firstname:   "วรัญญา",
			Lastname:    "ศรีสวัสดิ์",
			Email:       "นุ่น",
			PhoneNumber: "0898765432",
			TitleID:     10,
		},
		{
			Firstname:   "นภัส",
			Lastname:    "ทองคำ",
			Email:       "บูม",
			PhoneNumber: "0822223344",
			TitleID:     11,
		},
	}

	for _, ta := range assistants {
		db.FirstOrCreate(&entity.TeachingAssistant{}, &entity.TeachingAssistant{
			Firstname:   ta.Firstname,
			Lastname:    ta.Lastname,
			Email:       ta.Email,
			PhoneNumber: ta.PhoneNumber,
			TitleID:     ta.TitleID,
		})
	}
}

// ยังไม่ครบ
func SeedScheduleTeachingAssistants() {
	entries := []struct {
		TeachingAssistantID uint
		ScheduleID          uint
	}{
		{TeachingAssistantID: 1, ScheduleID: 1},
		{TeachingAssistantID: 1, ScheduleID: 2},
		{TeachingAssistantID: 2, ScheduleID: 1},
		{TeachingAssistantID: 3, ScheduleID: 2},
	}

	for _, e := range entries {
		db.FirstOrCreate(&entity.ScheduleTeachingAssistant{}, &entity.ScheduleTeachingAssistant{
			TeachingAssistantID: e.TeachingAssistantID,
			ScheduleID:          e.ScheduleID,
		})
	}
}

// //////////////////////////////////////////////////////////// วิชาที่จะเปิดสอนในเทอมนั้น ///////////////////////////////////////////////////////
// ยังไม่ครบ
func SeedOfferedCourses() {
	labID3 := uint(3)

	courses := []entity.OfferedCourses{
		{
			Year:         2566,
			Term:         1,
			Section:      2,
			Capacity:     30,
			IsFixCourses: false,
			UserID:       3,
			AllCoursesID: 3,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     30,
			IsFixCourses: false,
			UserID:       2,
			AllCoursesID: 10,
			LaboratoryID: &labID3,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     40,
			IsFixCourses: false,
			UserID:       3,
			AllCoursesID: 3,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         2,
			Section:      1,
			Capacity:     35,
			IsFixCourses: true,
			UserID:       6,
			AllCoursesID: 5,
			LaboratoryID: nil,
		},
		{
			Year:         2566,
			Term:         1,
			Section:      1,
			Capacity:     40,
			IsFixCourses: true,
			UserID:       6,
			AllCoursesID: 6,
			LaboratoryID: nil,
		},
	}

	for _, c := range courses {
		db.FirstOrCreate(&entity.OfferedCourses{}, &entity.OfferedCourses{
			Year:         c.Year,
			Term:         c.Term,
			Section:      c.Section,
			Capacity:     c.Capacity,
			IsFixCourses: c.IsFixCourses,
			UserID:       c.UserID,
			AllCoursesID: c.AllCoursesID,
			LaboratoryID: c.LaboratoryID,
		})
	}
}

// ยังไม่ครบ
func SeedTimeFixedCourses() {
	layout := "15:04"

	entries := []struct {
		Year         uint
		Term         uint
		DayOfWeek    string
		StartTimeStr string
		EndTimeStr   string
		RoomFix      string
		Section      uint
		Capacity     uint
		AllCoursesID uint
		ScheduleID   uint
	}{
		{
			Year:         2566,
			Term:         1,
			DayOfWeek:    "จันทร์",
			StartTimeStr: "09:00",
			EndTimeStr:   "11:00",
			RoomFix:      "Lecture 101",
			Section:      1,
			Capacity:     40,
			AllCoursesID: 6,
			ScheduleID:   1,
		},
		{
			Year:         2567,
			Term:         1,
			DayOfWeek:    "อังคาร",
			StartTimeStr: "13:00",
			EndTimeStr:   "15:00",
			RoomFix:      "Lecture 102",
			Section:      2,
			Capacity:     35,
			AllCoursesID: 6,
			ScheduleID:   1,
		},
		{
			Year:         2567,
			Term:         2,
			DayOfWeek:    "พฤหัสบดี",
			StartTimeStr: "10:30",
			EndTimeStr:   "12:30",
			RoomFix:      "Lecture 201",
			Section:      1,
			Capacity:     30,
			AllCoursesID: 5,
			ScheduleID:   2,
		},
	}

	for _, entry := range entries {
		startTime, _ := time.Parse(layout, entry.StartTimeStr)
		endTime, _ := time.Parse(layout, entry.EndTimeStr)

		db.FirstOrCreate(&entity.TimeFixedCourses{}, &entity.TimeFixedCourses{
			Year:         entry.Year,
			Term:         entry.Term,
			DayOfWeek:    entry.DayOfWeek,
			StartTime:    startTime,
			EndTime:      endTime,
			RoomFix:      entry.RoomFix,
			Section:      entry.Section,
			Capacity:     entry.Capacity,
			AllCoursesID: entry.AllCoursesID,
			ScheduleID:   entry.ScheduleID,
		})
	}
}

// //////////////////////////////////////////////////////////// ตารางสอน ///////////////////////////////////////////////////////
// ยังไม่ครบ
func SeedSchedules() {
	layout := "15:04"

	schedules := []entity.Schedule{
		{
			NameTable:        "ตารางเรียนปี 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        mustParseTime(layout, "09:00"),
			EndTime:          mustParseTime(layout, "11:00"),
			OfferedCoursesID: 1, // ต้องตรงกับ ID ของ OfferedCourses ที่มีอยู่ใน DB
		},
		{
			NameTable:        "ตารางเรียนปี 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "อังคาร",
			StartTime:        mustParseTime(layout, "13:00"),
			EndTime:          mustParseTime(layout, "15:00"),
			OfferedCoursesID: 2,
		},
		{
			NameTable:        "ตารางเรียนปี 2567 เทอม 2",
			SectionNumber:    1,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        mustParseTime(layout, "10:30"),
			EndTime:          mustParseTime(layout, "12:30"),
			OfferedCoursesID: 4,
		},
	}

	for _, s := range schedules {
		db.FirstOrCreate(&entity.Schedule{}, &s)
	}
}

// ตัวช่วยแปลงเวลาหรือ panic ถ้าพลาด
func mustParseTime(layout, value string) time.Time {
	t, err := time.Parse(layout, value)
	if err != nil {
		panic(err)
	}
	return t
}
