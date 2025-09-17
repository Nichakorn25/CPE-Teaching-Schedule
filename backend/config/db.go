package config

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
	"gorm.io/gorm/logger"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func CreateDatabase() {
	dsn := "host=localhost user=postgres password=nichakorn25 port=5432 sslmode=disable"
	// dsn := "host=localhost user=postgres password=1234 port=5432 sslmode=disable" //salisa
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
	dsn := "host=localhost user=postgres password=nichakorn25 dbname=cpe_schedule port=5432 sslmode=disable TimeZone=Asia/Bangkok"
	// dsn := "host=localhost user=postgres password=1234 dbname=cpe_schedule port=5432 sslmode=disable TimeZone=Asia/Bangkok" //salisa
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
	SeedSchedules()
	SeedTimeFixedCourses()
	// SeedScheduleTeachingAssistants()
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
	db.First(&M1, "department_name = ?", "สำนักวิชาวิศวกรรมศาสตร์")
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
	hashedPassword01, _ := HashPassword("admin")
	hashedPassword, _ := HashPassword("1234")

	users := []entity.User{
		{
			Username:      "admin",
			Password:      hashedPassword01,
			Firstname:     "SUT",
			Lastname:      "ADMIN",
			Image:         "data:image/jpeg;base64,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",
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
			Username:      "sarunya.k",
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
			Username:      "nuntawut.k",
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
			Username:      "wichai.s",
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
			Username:      "kacha.c",
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
			Username:      "kittisak.k",
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
			Username:      "komsan.s",
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
			Username:      "nittaya.k",
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
			Username:      "poramet.h",
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
			Username:      "parin.s",
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
			Username:      "supaporn.s",
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
		{
			Username:      "keerati.c",
			Password:      hashedPassword,
			Firstname:     "กีรติ",
			Lastname:      "ชะกุลศีร์",
			Image:         "",
			Email:         "keerati.ch@sut.ac.th",
			PhoneNumber:   "044224411",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง EE06",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    2,
			MajorID:       4,
			RoleID:        3,
		},
		{
			Username:      "anan.o",
			Password:      hashedPassword,
			Firstname:     "อนันท์",
			Lastname:      "อุ่นศิวิไลย์",
			Image:         "",
			Email:         "anant@sut.ac.th",
			PhoneNumber:   "044224411",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง EE06",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    2,
			MajorID:       4,
			RoleID:        3,
		},
		{
			Username:      "kitti.a",
			Password:      hashedPassword,
			Firstname:     "กิตติ",
			Lastname:      "อัตถกิจมงคล",
			Image:         "",
			Email:         "kitti@sut.ac.th",
			PhoneNumber:   "044224411",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง EE06",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    2,
			MajorID:       4,
			RoleID:        3,
		},
		{
			Username:      "arthit.s",
			Password:      hashedPassword,
			Firstname:     "อาทิตย์",
			Lastname:      "ศรีแก้ว",
			Image:         "",
			Email:         "ra@sut.ac.th",
			PhoneNumber:   "044224411",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง EE06",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    2,
			MajorID:       4,
			RoleID:        3,
		},
		{
			Username:      "thanatchai.k",
			Password:      hashedPassword,
			Firstname:     "ธนัตชัย",
			Lastname:      "กุลวรานิชมงษ์",
			Image:         "",
			Email:         "thanatch@sut.ac.th",
			PhoneNumber:   "044224411",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง EE06",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    2,
			MajorID:       4,
			RoleID:        3,
		},
		{
			Username:      "panomsak.m",
			Password:      hashedPassword,
			Firstname:     "พนมศักดิ์",
			Lastname:      "มีมนต์",
			Image:         "",
			Email:         "panomsak@sut.ac.th",
			PhoneNumber:   "044224411",
			Address:       "อาคารบริการ 1 ชั้น 4 ห้อง EE06",
			FirstPassword: false,
			TitleID:       3,
			PositionID:    2,
			MajorID:       5,
			RoleID:        2,
		},
	}
	for _, user := range users {
		var existing entity.User
		db.Where("username = ?", user.Username).First(&existing)
		if existing.ID == 0 {
			db.Create(&user)
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
		{Unit: 3, Lecture: 2, Lab: 2, Self: 5},
		{Unit: 2, Lecture: 0, Lab: 6, Self: 0},
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
		{Type: 1, TypeName: "กลุ่มวิชาแกนศึกษาทั่วไป"},
		{Type: 2, TypeName: "กลุ่มวิชาพื้นฐานทางวิศวกรรมศาสตร์"},
		{Type: 3, TypeName: "กลุ่มวิชาชีพบังคับทางวิศวกรรมคอมพิวเตอร์"},
		{Type: 4, TypeName: "กลุ่มวิชาเลือกทางวิศวกรรมคอมพิวเตอร์"},
		{Type: 5, TypeName: "กลุ่มวิชาชีพบังคับทางวิศวกรรมไฟฟ้า"},
		{Type: 6, TypeName: "กลุ่มวิชาเลือกทางวิศวกรรมไฟฟ้า"},
		{Type: 7, TypeName: "กลุ่มวิชาภาษา"},
		{Type: 8, TypeName: "กลุ่มวิชาศึกษาทั่วไปแบบเลือก"},
		{Type: 9, TypeName: "กลุ่มวิชาพื้นฐานทางวิทยาศาสตร์และคณิตศาสตร์"},
		{Type: 10, TypeName: "หมวดวิชาสหกิจศึกษา"},
		{Type: 11, TypeName: "กลุ่มวิชาพื้นฐานทางวิทยาการคอมพิวเตอร์"},
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
		curriculumElectricalEng1 entity.Curriculum

		yearAll entity.AcademicYear
		year1   entity.AcademicYear
		year2   entity.AcademicYear
		year3   entity.AcademicYear
		year4   entity.AcademicYear

		type1 entity.TypeOfCourses
		type2 entity.TypeOfCourses
		type3 entity.TypeOfCourses
		type4 entity.TypeOfCourses
		type5 entity.TypeOfCourses
		type6 entity.TypeOfCourses
		type7 entity.TypeOfCourses
		type8 entity.TypeOfCourses
		type9 entity.TypeOfCourses
		type10 entity.TypeOfCourses
		type11 entity.TypeOfCourses

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
		credit3_2_2_5 entity.Credit
		credit2_0_6_0 entity.Credit
	)
	db.First(&curriculumComEng1, "curriculum_name = ?", "107050101650	วิศวกรรมคอมพิวเตอร์-2565")
	db.First(&curriculumElectricalEng1, "curriculum_name = ?", "107110101600	วิศวกรรมไฟฟ้า-2560(2559)")

	db.First(&yearAll, "level = ?", "เรียนได้ทุกชั้นปี")
	db.First(&year1, "level = ?", "1")
	db.First(&year2, "level = ?", "2")
	db.First(&year3, "level = ?", "3")
	db.First(&year4, "level = ?", "4")

	db.First(&type1, "type_name = ?", "กลุ่มวิชาแกนศึกษาทั่วไป")
	db.First(&type2, "type_name = ?", "กลุ่มวิชาพื้นฐานทางวิศวกรรมศาสตร์")
	db.First(&type3, "type_name = ?", "กลุ่มวิชาชีพบังคับทางวิศวกรรมคอมพิวเตอร์")
	db.First(&type4, "type_name = ?", "กลุ่มวิชาเลือกทางวิศวกรรมคอมพิวเตอร์")
	db.First(&type5, "type_name = ?", "กลุ่มวิชาชีพบังคับทางวิศวกรรมไฟฟ้า")
	db.First(&type6, "type_name = ?", "กลุ่มวิชาเลือกทางวิศวกรรมไฟฟ้า")
	db.First(&type7, "type_name = ?", "กลุ่มวิชาภาษา")
	db.First(&type8, "type_name = ?", "กลุ่มวิชาศึกษาทั่วไปแบบเลือก")
	db.First(&type9, "type_name = ?", "กลุ่มวิชาพื้นฐานทางวิทยาศาสตร์และคณิตศาสตร์")
	db.First(&type10, "type_name = ?", "หมวดวิชาสหกิจศึกษา")
	db.First(&type11, "type_name = ?", "กลุ่มวิชาพื้นฐานทางวิทยาการคอมพิวเตอร์")


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
	db.First(&credit3_2_2_5, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 3, 2, 2, 5)
	db.First(&credit2_0_6_0, "unit = ? AND lecture = ? AND lab = ? AND self = ?", 2, 0, 6, 0)

	courses := []entity.AllCourses{
		{
			Code:            "IST20 1001",
			EnglishName:     "Digital Literacy",
			ThaiName:        "การรู้ดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 1002",
			EnglishName:     "Use of Application Programs for Learning",
			ThaiName:        "การใช้โปรแกรมประยุกต์เพื่อการเรียนรู้",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit1_0_2_1.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 1003",
			EnglishName:     "Life Skills",
			ThaiName:        "ทักษะชีวิต",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 1004",
			EnglishName:     "Citizenship and Global Citizens",
			ThaiName:        "ความเป็นพลเมืองและพลเมืองโลก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 2001",
			EnglishName:     "Man, Society and Environment",
			ThaiName:        "มนุษย์กับสังคมและสิ่งแวดล้อม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 2002",
			EnglishName:     "Man, Economy and Development",
			ThaiName:        "มนุษย์กับเศรษฐกิจและการพัฒนา",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 1,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST30 1101",
			EnglishName:     "English for Communication I",
			ThaiName:        "ภาษาอังกฤษเพื่อการสื่อสาร 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 7,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST30 1102",
			EnglishName:     "English for Communication II",
			ThaiName:        "ภาษาอังกฤษเพื่อการสื่อสาร 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 7,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST30 1103",
			EnglishName:     "English for Academic Purposes",
			ThaiName:        "ภาษาอังกฤษเพื่อวัตถุประสงค์ทางวิชาการ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 7,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST30 1104",
			EnglishName:     "English for Specific Purposes",
			ThaiName:        "ภาษาอังกฤษเพื่อวัตถุประสงค์เฉพาะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 7,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "IST30 1105",
			EnglishName:     "English for Careers",
			ThaiName:        "ภาษาอังกฤษเพื่อการทำงาน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 7,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          true,
		},
		{
			Code:            "DGT00 0140",
			EnglishName:     "ARTIFICIAL INTELLIGENCE LITERACY",
			ThaiName:        "การรู้เท่าทันปัญญาประดิษฐ์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit1_1_0_2.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG20 1110",
			EnglishName:     "PERSONAL FINANCE",
			ThaiName:        "การเงินส่วนบุคคล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG51 1901",
			EnglishName:     "AI FOR EFFECTIVE LEARNING",
			ThaiName:        "การใช้ปัญญาประดิษฐ์สำหรับการเรียนรู้อย่างมีประสิทธิภาพ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IPH03 4013",
			EnglishName:     "ADOLESCENT AND YOUTH SAFETY",
			ThaiName:        "ความปลอดภัยสำหรับวัยรุ่นและเยาวชน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 1501",
			EnglishName:     "THAI FOR COMMUNICATION",
			ThaiName:        "ภาษาไทยเพื่อการสื่อสาร",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 1502",
			EnglishName:     "ART APPRECIATION",
			ThaiName:        "ศิลปวิจักษ์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 1503",
			EnglishName:     "HOLISTIC HEALTH",
			ThaiName:        "สุขภาพองค์รวม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 1504",
			EnglishName:     "LAW IN DAILY LIFE",
			ThaiName:        "กฎหมายในชีวิตประจำวัน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 2501",
			EnglishName:     "PROFESSIONAL AND COMMUNITY ENGAGEMENT",
			ThaiName:        "พันธกิจสัมพันธ์ชุมชนกับกลุ่มอาชีพ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 2502",
			EnglishName:     "PLURI-CULTURAL THAI STUDIES",
			ThaiName:        "ไทยศึกษาเชิงพหุวัฒนธรรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 2503",
			EnglishName:     "ASEAN STUDIES",
			ThaiName:        "อาเซียนศึกษา ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 2504",
			EnglishName:     "DESIGN THINKING",
			ThaiName:        "การคิดเชิงออกแบบ ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "IST20 2505",
			EnglishName:     "LOVE YOURSELF",
			ThaiName:        "ฮักเจ้าของ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 8,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG20 1010",
			EnglishName:     "Introduction to Engineering Profession",
			ThaiName:        "แนะนำวิชาชีพวิศวกรรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit1_0_3_3.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG23 1001",
			EnglishName:     "Computer Programming I",
			ThaiName:        "การเขียนโปรแกรมคอมพิวเตอร์ 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_1_3_5.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG23 2001",
			EnglishName:     "Computer Programming II",
			ThaiName:        "การเขียนโปรแกรมคอมพิวเตอร์ 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_1_3_5.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG23 3001",
			EnglishName:     "Computer Statistics",
			ThaiName:        "สถิติทางคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_2_0_4.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG25 1010",
			EnglishName:     "Engineering Graphics I",
			ThaiName:        "การเขียนแบบวิศวกรรม 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit2_1_3_5.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG31 1001",
			EnglishName:     "Engineering Materials",
			ThaiName:        "วัสดุวิศวกรรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 2,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          true,
		},
		{
			Code:            "ENG23 2003",
			EnglishName:     "Problem Solving with Programming",
			ThaiName:        "การแก้ปัญหาด้วยการโปรแกรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit2_1_3_5.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2011",
			EnglishName:     "Database Systems",
			ThaiName:        "ระบบฐานข้อมูล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4080",
			EnglishName:     "Computer Engineering Capstone Project",
			ThaiName:        "โครงงานวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2031",
			EnglishName:     "Data Structures and Algorithms",
			ThaiName:        "โครงสร้างข้อมูลและขั้นตอนวิธี",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2032",
			EnglishName:     "Object-Oriented Technology",
			ThaiName:        "เทคโนโลยีเชิงวัตถุ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3031",
			EnglishName:     "System Analysis and Design",
			ThaiName:        "การวิเคราะห์และออกแบบระบบ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3032",
			EnglishName:     "Software Engineering",
			ThaiName:        "วิศวกรรมซอฟต์แวร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2051",
			EnglishName:     "Programming Fundamentals",
			ThaiName:        "พื้นฐานการเขียนโปรแกรม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3051",
			EnglishName:     "Formal Methods and Computability",
			ThaiName:        "วิธีฟอร์มอลและภาวะคำนวณได้",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3052",
			EnglishName:     "Computer and Communication",
			ThaiName:        "คอมพิวเตอร์และการสื่อสาร",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3053",
			EnglishName:     "Computer Networks",
			ThaiName:        "เครือข่ายคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3054",
			EnglishName:     "Operating Systems",
			ThaiName:        "ระบบปฏิบัติการ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2071",
			EnglishName:     "Electronics for Computer Engineering",
			ThaiName:        "อิเล็กทรอนิกส์สำหรับวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2072",
			EnglishName:     "Electronic Laboratory for Computer Engineering",
			ThaiName:        "ปฏิบัติการอิเล็กทรอนิกส์สำหรับวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit1_0_3_3.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2073",
			EnglishName:     "Digital System Design",
			ThaiName:        "การออกแบบระบบดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2074",
			EnglishName:     "Digital System Laboratory",
			ThaiName:        "ปฏิบัติการระบบดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit1_0_3_3.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2075",
			EnglishName:     "Computer Mathematics",
			ThaiName:        "คณิตศาสตร์ทางคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2076",
			EnglishName:     "Computer Architecture and Organization",
			ThaiName:        "โครงสร้างและสถาปัตยกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 2077",
			EnglishName:     "Microprocessors",
			ThaiName:        "ไมโครโพรเซสเซอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3012",
			EnglishName:     "Knowledge Discovery and Data Mining",
			ThaiName:        "การค้นพบความรู้และการทำเหมืองข้อมูล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3013",
			EnglishName:     "Web Applications",
			ThaiName:        "เว็บแอพพลิเคชัน",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3014",
			EnglishName:     "Introduction to Natural Language Processing",
			ThaiName:        "การประมวลผลภาษาธรรมชาติเบื้องต้น",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3015",
			EnglishName:     "Machine Learning Fundamentals",
			ThaiName:        "พื้นฐานการเรียนรู้ของเครื่อง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3016",
			EnglishName:     "Business Intelligence",
			ThaiName:        "ธุรกิจอัจฉริยะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3033",
			EnglishName:     "Event-Driven Programming",
			ThaiName:        "การเขียนโปรแกรมที่ขับเคลื่อนโดยเหตุการณ์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3055",
			EnglishName:     "Introduction to Blockchain Technology",
			ThaiName:        "เทคโนโลยีบล็อกเชนเบื้องต้น",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3072",
			EnglishName:     "Embedded Systems",
			ThaiName:        "ระบบฝังตัว",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3073",
			EnglishName:     "Advanced Digital System Design",
			ThaiName:        "การออกแบบระบบดิจิทัลขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3074",
			EnglishName:     "Serverless and Cloud Architectures",
			ThaiName:        "สถาปัตยกรรมไร้แม่ข่ายและคลาวด์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 3075",
			EnglishName:     "Advanced Database Systems",
			ThaiName:        "ระบบฐานข้อมูลขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4011",
			EnglishName:     "Artificial Intelligence in Applications",
			ThaiName:        "ปัญญาประดิษฐ์ในงานประยุกต์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4013",
			EnglishName:     "Intelligent Methodologies",
			ThaiName:        "ระเบียบวิธีอัจฉริยะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4014",
			EnglishName:     "Artificial Neural Networks",
			ThaiName:        "เครือข่ายประสาทเทียม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4015",
			EnglishName:     "Semantic Web",
			ThaiName:        "เว็บเชิงความหมาย",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4016",
			EnglishName:     "Computer and Data Analysis",
			ThaiName:        "คอมพิวเตอร์และการวิเคราะห์ข้อมูล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4017",
			EnglishName:     "Health and Environmental Informatics",
			ThaiName:        "อินฟอร์แมติกส์สุขภาพและสิ่งแวดล้อม",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4018",
			EnglishName:     "Deep Learning",
			ThaiName:        "การเรียนรู้เชิงลึก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4019",
			EnglishName:     "Advanced Web Application Development",
			ThaiName:        "การพัฒนาเว็บแอพพลิเคชันขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4033",
			EnglishName:     "Software Testing",
			ThaiName:        "การทดสอบซอฟต์แวร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4035",
			EnglishName:     "Software Process",
			ThaiName:        "กระบวนการซอฟต์แวร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4041",
			EnglishName:     "Cyber Security Fundamentals",
			ThaiName:        "พื้นฐานความมั่นคงไซเบอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4042",
			EnglishName:     "Advanced Cyber Security",
			ThaiName:        "ความมั่นคงไซเบอร์ขั้นสูง",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4031",
			EnglishName:     "Computer Graphics",
			ThaiName:        "คอมพิวเตอร์กราฟิก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4032",
			EnglishName:     "Digital Image Processing",
			ThaiName:        "การประมวลผลภาพดิจิทัล",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4053",
			EnglishName:     "Computer Vision",
			ThaiName:        "การมองเห็นด้วยคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4034",
			EnglishName:     "Computer Network Programming and Network Automation",
			ThaiName:        "การเขียนโปรแกรมเครือข่ายคอมพิวเตอร์และเครือข่ายอัตโนมัติ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4060",
			EnglishName:     "Algorithm Analysis and Design",
			ThaiName:        "การวิเคราะห์และออกแบบขั้นตอนวิธี",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4071",
			EnglishName:     "Optimization Methods",
			ThaiName:        "วิธีหาค่าเหมาะที่สุด",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4072",
			EnglishName:     "Numerical Analysis",
			ThaiName:        "การวิเคราะห์เชิงตัวเลข",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4073",
			EnglishName:     "Micro Robot Development",
			ThaiName:        "การพัฒนาหุ่นยนต์ขนาดเล็ก",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4074",
			EnglishName:     "Internet of Things and Smart System",
			ThaiName:        "อินเทอร์เน็ตของสรรพสิ่งและระบบอัจฉริยะ",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_3_3_9.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4081",
			EnglishName:     "Special Problems in Computer Engineering I",
			ThaiName:        "ปัญหาเฉพาะเรื่องทางวิศวกรรมคอมพิวเตอร์ 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4082",
			EnglishName:     "Special Problems in Computer Engineering II",
			ThaiName:        "ปัญหาเฉพาะเรื่องทางวิศวกรรมคอมพิวเตอร์ 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4097",
			EnglishName:     "Advanced Topics in Computer Engineering I",
			ThaiName:        "หัวข้อขั้นสูงในวิศวกรรมคอมพิวเตอร์ 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4098",
			EnglishName:     "Advanced Topics in Computer Engineering II",
			ThaiName:        "หัวข้อขั้นสูงในวิศวกรรมคอมพิวเตอร์ 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4099",
			EnglishName:     "Introduction to Research Methods",
			ThaiName:        "ความรู้เบื้องต้นเกี่ยวกับวิธีวิจัย",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 4,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4090",
			EnglishName:     "Pre-cooperative Education",
			ThaiName:        "เตรียมสหกิจศึกษา",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 10,
			CreditID:        credit1_0_0_0.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4091",
			EnglishName:     "Cooperative Education I",
			ThaiName:        "สหกิจศึกษา 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 10,
			CreditID:        credit8_0_0_0.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4092",
			EnglishName:     "Cooperative Education II",
			ThaiName:        "สหกิจศึกษา 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 10,
			CreditID:        credit8_0_0_0.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG23 4094",
			EnglishName:     "Computer Engineering Study Project",
			ThaiName:        "โครงการศึกษาวิศวกรรมคอมพิวเตอร์",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 10,
			CreditID:        credit9_0_0_0.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG20 2010",
			EnglishName:     "Multidisciplinary Project-Based Learning I",
			ThaiName:        "การเรียนรู้โดยโครงงานสหวิทยาการเบื้องต้น 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG20 3010",
			EnglishName:     "Multidisciplinary Project-Based Learning II",
			ThaiName:        "การเรียนรู้โดยโครงงานสหวิทยาการเบื้องต้น 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG20 4010",
			EnglishName:     "Multidisciplinary Project-Based Learning III",
			ThaiName:        "การเรียนรู้โดยโครงงานสหวิทยาการเบื้องต้น 3",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG20 2020",
			EnglishName:     "Global Project Based Learning I",
			ThaiName:        "การเรียนรู้โดยโครงงานนานาชาติขั้นพื้นฐาน 1",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG20 3020",
			EnglishName:     "Global Project Based Learning II",
			ThaiName:        "การเรียนรู้โดยโครงงานนานาชาติขั้นพื้นฐาน 2",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG20 4020",
			EnglishName:     "Global Project Based Learning III",
			ThaiName:        "การเรียนรู้โดยโครงงานนานาชาติขั้นพื้นฐาน 3",
			CurriculumID:    curriculumComEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 3,
			CreditID:        credit4_2_4_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 2001",
			EnglishName:     "ELECTRICAL ENGINEERING MATHEMATICS",
			ThaiName:        "คณิตศาสตร์วิศวกรรมไฟฟ้า",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 5,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 2111",
			EnglishName:     "ELECTRIC CIRCUITS",
			ThaiName:        "วงจรไฟฟ้า",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 6,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 2113",
			EnglishName:     "ENGINEERING ELECTRONICS",
			ThaiName:        "อิเล็กทรอนิกส์วิศวกรรม",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 5,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 2115",
			EnglishName:     "CIRCUIT ANALYSIS AND FILTERS",
			ThaiName:        "การวิเคราะห์วงจรและตัวกรอง",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 6,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 2141",
			EnglishName:     "ELECTROMAGNETIC FIELDS",
			ThaiName:        "สนามแม่เหล็กไฟฟ้า",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 5,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 2142",
			EnglishName:     "POWER ELECTRONICS",
			ThaiName:        "อิเล็กทรอนิกส์กำลัง",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 6,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 2131",
			EnglishName:     "ELECTRICAL MACHINES",
			ThaiName:        "เครื่องจักรกลไฟฟ้า",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 5,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 3131",
			EnglishName:     "ELECTRICAL MEASUREMENTS AND INSTRUMENTATION",
			ThaiName:        "การวัดและเครื่องมือทางไฟฟ้า",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 6,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 3132",
			EnglishName:     "CONTROL SYSTEMS",
			ThaiName:        "ระบบควบคุม",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 5,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 3151",
			EnglishName:     "POWER SEMICONDUCTOR DRIVES",
			ThaiName:        "ไดรฟ์เซมิคอนดักเตอร์กำลัง",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 6,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 3152",
			EnglishName:     "POWER PLANT AND SUBSTATION",
			ThaiName:        "โรงไฟฟ้าและสถานีไฟฟ้าย่อย",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 5,
			CreditID:        credit3_3_0_6.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 3153",
			EnglishName:     "ELECTRICAL SYSTEM DESIGN",
			ThaiName:        "การออกแบบระบบไฟฟ้า",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 6,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "ENG29 3154",
			EnglishName:     "ELECTRICAL POWER SYSTEM",
			ThaiName:        "ระบบไฟฟ้ากำลัง",
			CurriculumID:    curriculumElectricalEng1.ID,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 5,
			CreditID:        credit4_4_0_8.ID,
			Ismain:          false,
		},
		{
			Code:            "1101021",
			EnglishName:     "Software Development Foundation I",
			ThaiName:        "พื้นฐานการพัฒนาซอฟต์แวร์ 1",
			CurriculumID:    8,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 11,
			CreditID:        credit3_2_2_5.ID,
			Ismain:          false,
		},
		{
			Code:            "1101022",
			EnglishName:     "Software Development Foundation II",
			ThaiName:        "พื้นฐานการพัฒนาซอฟต์แวร์ 2",
			CurriculumID:    8,
			AcademicYearID:  &year2.ID,
			TypeOfCoursesID: 11,
			CreditID:        credit3_2_2_5.ID,
			Ismain:          false,
		},
		{
			Code:            "1101023",
			EnglishName:     "Project in Basic Software Development",
			ThaiName:        "โครงการการพัฒนาซอฟต์แวร์ขั้นพื้นฐาน",
			CurriculumID:    8,
			AcademicYearID:  &year3.ID,
			TypeOfCoursesID: 11,
			CreditID:        credit2_0_6_0.ID,
			Ismain:          false,
		},
		{
			Code:            "1101031",
			EnglishName:     "Data Science Foundation I",
			ThaiName:        "พื้นฐานวิทยาการข้อมูล 1",
			CurriculumID:    8,
			AcademicYearID:  &year4.ID,
			TypeOfCoursesID: 11,
			CreditID:        credit3_2_2_5.ID,
			Ismain:          false,
		},
		{
			Code:            "1101032",
			EnglishName:     "Data Science Foundation II",
			ThaiName:        "พื้นฐานวิทยาการข้อมูล 2",
			CurriculumID:    8,
			AcademicYearID:  &yearAll.ID,
			TypeOfCoursesID: 11,
			CreditID:        credit3_2_2_5.ID,
			Ismain:          false,
		},
		{
			Code:            "1101033",
			EnglishName:     "Project in Basic Data Science",
			ThaiName:        "โครงการงานวิทยาการข้อมูลขั้นพื้นฐาน",
			CurriculumID:    8,
			AcademicYearID:  &year1.ID,
			TypeOfCoursesID: 11,
			CreditID:        credit2_0_6_0.ID,
			Ismain:          false,
		},		
	}
	for _, c := range courses {
		var course entity.AllCourses
		db.
			Where("code = ?", c.Code).
			FirstOrCreate(&course, entity.AllCourses{
				Code:            c.Code,
				EnglishName:     c.EnglishName,
				ThaiName:        c.ThaiName,
				CurriculumID:    c.CurriculumID,
				AcademicYearID:  c.AcademicYearID,
				TypeOfCoursesID: c.TypeOfCoursesID,
				CreditID:        c.CreditID,
				Ismain:          c.Ismain,
			})
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
		eng234053 entity.AllCourses 
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
		eng292001 entity.AllCourses 
		eng292111 entity.AllCourses 
		eng292113 entity.AllCourses 
		eng292115 entity.AllCourses 
		eng292141 entity.AllCourses 
		eng292142 entity.AllCourses 
		eng292131 entity.AllCourses 
		eng293131 entity.AllCourses 
		eng293132 entity.AllCourses 
		eng293151 entity.AllCourses 
		eng293152 entity.AllCourses 
		eng293153 entity.AllCourses 
		eng293154 entity.AllCourses 
		a1101021 entity.AllCourses 
		a1101022 entity.AllCourses 
		a1101023 entity.AllCourses 
		a1101031 entity.AllCourses 
		a1101032 entity.AllCourses 
		a1101033 entity.AllCourses 
	)

	db.First(&admin, "username = ?", "admin")
	db.First(&ss1234, "username = ?", "sarunya.k")
	db.First(&a1234, "username = ?", "nuntawut.k")
	db.First(&b1234, "username = ?", "wichai.s")
	db.First(&c1234, "username = ?", "kacha.c")
	db.First(&d1234, "username = ?", "kittisak.k")
	db.First(&e1234, "username = ?", "komsan.s")
	db.First(&f1234, "username = ?", "nittaya.k")
	db.First(&g1234, "username = ?", "poramet.h")
	db.First(&h1234, "username = ?", "parin.s")
	db.First(&i1234, "username = ?", "supaporn.s")

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
	db.First(&eng234053, "code = ?", "ENG23 4053")
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
	db.First(&eng292001, "code = ?", "ENG29 2001")
	db.First(&eng292111, "code = ?", "ENG29 2111")
	db.First(&eng292113, "code = ?", "ENG29 2113")
	db.First(&eng292115, "code = ?", "ENG29 2115")
	db.First(&eng292141, "code = ?", "ENG29 2141")
	db.First(&eng292142, "code = ?", "ENG29 2142")
	db.First(&eng292131, "code = ?", "ENG29 2131")
	db.First(&eng293131, "code = ?", "ENG29 3131")
	db.First(&eng293132, "code = ?", "ENG29 3132")
	db.First(&eng293151, "code = ?", "ENG29 3151")
	db.First(&eng293152, "code = ?", "ENG29 3152")
	db.First(&eng293153, "code = ?", "ENG29 3153")
	db.First(&eng293154, "code = ?", "ENG29 3154")
	db.First(&a1101021, "code = ?", "1101021")
	db.First(&a1101022, "code = ?", "1101022")
	db.First(&a1101023, "code = ?", "1101023")
	db.First(&a1101031, "code = ?", "1101031")
	db.First(&a1101032, "code = ?", "1101032")
	db.First(&a1101033, "code = ?", "1101033")

	enrollments := []entity.UserAllCourses{
	
	{UserID: c1234.ID, AllCoursesID: eng231001.ID},
	{UserID: c1234.ID, AllCoursesID: eng232001.ID},
	{UserID: i1234.ID, AllCoursesID: eng233001.ID},

	{UserID: a1234.ID, AllCoursesID: eng232003.ID},
	{UserID: ss1234.ID, AllCoursesID: eng232011.ID},
	{UserID: a1234.ID, AllCoursesID: eng232011.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234080.ID},
	{UserID: a1234.ID, AllCoursesID: eng234080.ID},
	{UserID: b1234.ID, AllCoursesID: eng234080.ID},
	{UserID: c1234.ID, AllCoursesID: eng234080.ID},
	{UserID: d1234.ID, AllCoursesID: eng234080.ID},
	{UserID: e1234.ID, AllCoursesID: eng234080.ID},
	{UserID: f1234.ID, AllCoursesID: eng234080.ID},
	{UserID: g1234.ID, AllCoursesID: eng234080.ID},
	{UserID: h1234.ID, AllCoursesID: eng234080.ID},
	{UserID: i1234.ID, AllCoursesID: eng234080.ID},
	{UserID: i1234.ID, AllCoursesID: eng232031.ID},
	{UserID: e1234.ID, AllCoursesID: eng232032.ID},
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
	{UserID: i1234.ID, AllCoursesID: eng232076.ID},
	{UserID: b1234.ID, AllCoursesID: eng232077.ID},
	{UserID: ss1234.ID, AllCoursesID: eng233012.ID},
	{UserID: c1234.ID, AllCoursesID: eng233013.ID},
	{UserID: ss1234.ID, AllCoursesID: eng233014.ID},
	{UserID: d1234.ID, AllCoursesID: eng233015.ID},
	{UserID: ss1234.ID, AllCoursesID: eng233016.ID},
	{UserID: ss1234.ID, AllCoursesID: eng233033.ID},
	{UserID: h1234.ID, AllCoursesID: eng233055.ID},
	{UserID: b1234.ID, AllCoursesID: eng233072.ID},
	{UserID: ss1234.ID, AllCoursesID: eng233073.ID},
	{UserID: a1234.ID, AllCoursesID: eng233074.ID},
	{UserID: ss1234.ID, AllCoursesID: eng233075.ID},
	{UserID: d1234.ID, AllCoursesID: eng234011.ID},
	{UserID: g1234.ID, AllCoursesID: eng234013.ID},
	{UserID: i1234.ID, AllCoursesID: eng234014.ID},
	{UserID: c1234.ID, AllCoursesID: eng234015.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234016.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234017.ID},
	{UserID: i1234.ID, AllCoursesID: eng234018.ID},
	{UserID: a1234.ID, AllCoursesID: eng234019.ID},
	{UserID: e1234.ID, AllCoursesID: eng234033.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234035.ID},
	{UserID: h1234.ID, AllCoursesID: eng234041.ID},
	{UserID: h1234.ID, AllCoursesID: eng234042.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234031.ID},
	{UserID: b1234.ID, AllCoursesID: eng234032.ID},
	{UserID: g1234.ID, AllCoursesID: eng234032.ID},
	{UserID: g1234.ID, AllCoursesID: eng234053.ID},
	{UserID: h1234.ID, AllCoursesID: eng234034.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234060.ID},
	{UserID: e1234.ID, AllCoursesID: eng234071.ID},
	{UserID: g1234.ID, AllCoursesID: eng234072.ID},
	{UserID: b1234.ID, AllCoursesID: eng234073.ID},
	{UserID: b1234.ID, AllCoursesID: eng234074.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234081.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234082.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234097.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234098.ID},
	{UserID: ss1234.ID, AllCoursesID: eng234099.ID},

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
	{UserID: admin.ID, AllCoursesID: ist202501.ID},
	{UserID: admin.ID, AllCoursesID: ist202502.ID},
	{UserID: admin.ID, AllCoursesID: ist202503.ID},
	{UserID: admin.ID, AllCoursesID: ist202504.ID},
	{UserID: admin.ID, AllCoursesID: ist202505.ID},
	{UserID: admin.ID, AllCoursesID: eng201010.ID},

	{UserID: admin.ID, AllCoursesID: eng251010.ID},
	{UserID: admin.ID, AllCoursesID: eng311001.ID},
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
	{UserID: admin.ID, AllCoursesID: eng292001.ID},
	{UserID: admin.ID, AllCoursesID: eng292111.ID},
	{UserID: admin.ID, AllCoursesID: eng292113.ID},
	{UserID: admin.ID, AllCoursesID: eng292115.ID},
	{UserID: admin.ID, AllCoursesID: eng292141.ID},
	{UserID: admin.ID, AllCoursesID: eng292142.ID},
	{UserID: admin.ID, AllCoursesID: eng292131.ID},
	{UserID: admin.ID, AllCoursesID: eng293131.ID},
	{UserID: admin.ID, AllCoursesID: eng293132.ID},
	{UserID: admin.ID, AllCoursesID: eng293151.ID},
	{UserID: admin.ID, AllCoursesID: eng293152.ID},
	{UserID: admin.ID, AllCoursesID: eng293153.ID},
	{UserID: admin.ID, AllCoursesID: eng293154.ID},
	{UserID: admin.ID, AllCoursesID: a1101021.ID},
	{UserID: admin.ID, AllCoursesID: a1101022.ID},
	{UserID: admin.ID, AllCoursesID: a1101023.ID},
	{UserID: admin.ID, AllCoursesID: a1101031.ID},
	{UserID: admin.ID, AllCoursesID: a1101032.ID},
	{UserID: admin.ID, AllCoursesID: a1101033.ID},

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
			Firstname:   "ธนพล",
			Lastname:    "คงเจริญสุข",
			Email:       "thanaphon.k@g.sut.ac.th",
			PhoneNumber: "0812345678",
			TitleID:     9,
		},
		{
			Firstname:   "สิทธิชัย",
			Lastname:    "สิริฤทธิกุลชัย",
			Email:       "sitthichai.s@g.sut.ac.th",
			PhoneNumber: "0898765432",
			TitleID:     9,
		},
		{
			Firstname:   "ตะวัน",
			Lastname:    "คำอาจ",
			Email:       "tawan.k@g.sut.ac.th",
			PhoneNumber: "0822223344",
			TitleID:     9,
		},
		{
			Firstname:   "ปิยวัฒน์",
			Lastname:    "เขมะวิริยะอนันต์",
			Email:       "piyawat.k@g.sut.ac.th",
			PhoneNumber: "0812345678",
			TitleID:     9,
		},
		{
			Firstname:   "ภูวดล",
			Lastname:    "เดชารัมย์",
			Email:       "phuwadol.d@g.sut.ac.th",
			PhoneNumber: "0812345678",
			TitleID:     9,
		},
		{
			Firstname:   "ธนวรรต",
			Lastname:    "สีแก้วสิ่ว",
			Email:       "thanawat.s@g.sut.ac.th",
			PhoneNumber: "0898765432",
			TitleID:     9,
		},
		{
			Firstname:   "เมธี",
			Lastname:    "สุวิชาเชิดชู",
			Email:       "methee.s@g.sut.ac.th",
			PhoneNumber: "0822223344",
			TitleID:     9,
		},
		{
			Firstname:   "อดิศักดิ์",
			Lastname:    "แดงบุตร",
			Email:       "adisak.d@g.sut.ac.th",
			PhoneNumber: "0812345678",
			TitleID:     9,
		},
		{
			Firstname:   "ศิวศิลป์",
			Lastname:    "พรจำศิลป์",
			Email:       "siwasil.p@g.sut.ac.th",
			PhoneNumber: "0822223344",
			TitleID:     9,
		},
		{
			Firstname:   "พรสวรรค์",
			Lastname:    "เหม็นเณร",
			Email:       "pornsawan.m@g.sut.ac.th",
			PhoneNumber: "0898765432",
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
// func SeedScheduleTeachingAssistants() {
// 	entries := []struct {
// 		TeachingAssistantID uint
// 		ScheduleID          uint
// 	}{
// 		{TeachingAssistantID: 1, ScheduleID: 1},
// 		{TeachingAssistantID: 1, ScheduleID: 2},
// 		{TeachingAssistantID: 2, ScheduleID: 1},
// 		{TeachingAssistantID: 3, ScheduleID: 2},
// 	}

// 	for _, e := range entries {
// 		db.FirstOrCreate(&entity.ScheduleTeachingAssistant{}, &entity.ScheduleTeachingAssistant{
// 			TeachingAssistantID: e.TeachingAssistantID,
// 			ScheduleID:          e.ScheduleID,
// 		})
// 	}
// }

// //////////////////////////////////////////////////////////// วิชาที่จะเปิดสอนในเทอมนั้น ///////////////////////////////////////////////////////
// ยังไม่ครบ
func SeedOfferedCourses() {
	labID2 := uint(2)
	labID3 := uint(3)

	courses := []entity.OfferedCourses{
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 2,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 3,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 4,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 5,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      2,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 6,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 7,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 8,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      2,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 9,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 10,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 11,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      2,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 12,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 13,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 14,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 15,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 16,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 17,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 18,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 19,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      2,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 20,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 21,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 22,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 23,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     300,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 24,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      30,
			Capacity:     10,
			IsFixCourses: true,
			UserID:       1,
			AllCoursesID: 26,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     90,
			IsFixCourses: false,
			UserID:       11,
			AllCoursesID: 28,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      2,
			Capacity:     55,
			IsFixCourses: false,
			UserID:       7,
			AllCoursesID: 31,
			LaboratoryID: &labID3,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      2,
			Capacity:     45,
			IsFixCourses: false,
			UserID:       7,
			AllCoursesID: 36,
			LaboratoryID: &labID3,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     90,
			IsFixCourses: false,
			UserID:       6,
			AllCoursesID: 39,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     120,
			IsFixCourses: false,
			UserID:       4,
			AllCoursesID: 43,
			LaboratoryID: &labID2,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      2,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       1,
			AllCoursesID: 47,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       12,
			AllCoursesID: 97,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       15,
			AllCoursesID: 98,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       13,
			AllCoursesID: 99,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       16,
			AllCoursesID: 100,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       14,
			AllCoursesID: 101,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       12,
			AllCoursesID: 102,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       16,
			AllCoursesID: 103,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       13,
			AllCoursesID: 104,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       12,
			AllCoursesID: 105,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       15,
			AllCoursesID: 106,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       14,
			AllCoursesID: 107,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       16,
			AllCoursesID: 108,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       17,
			AllCoursesID: 110,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       17,
			AllCoursesID: 111,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       17,
			AllCoursesID: 112,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       17,
			AllCoursesID: 113,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       17,
			AllCoursesID: 114,
			LaboratoryID: nil,
		},
		{
			Year:         2567,
			Term:         1,
			Section:      1,
			Capacity:     60,
			IsFixCourses: false,
			UserID:       17,
			AllCoursesID: 115,
			LaboratoryID: nil,
		},
	}
	for _, c := range courses {
		var oc entity.OfferedCourses
		tx := db.Where("year = ? AND term = ? AND all_courses_id = ?", c.Year, c.Term, c.AllCoursesID).First(&oc)

		if tx.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&c).Error; err != nil {
				fmt.Println("Insert error:", err)
			}
		} else if tx.Error != nil {
			fmt.Println("Query error:", tx.Error)
		}
	}

}
func parseTimeWithLoc(layout, value string, loc *time.Location) time.Time {
	t, err := time.ParseInLocation(layout, value, loc)
	if err != nil {
		panic(err)
	}
	// anchor date ไปยังยุคปัจจุบัน เพื่อหลีกเลี่ยง offset ประวัติศาสตร์ +06:42:04
	return time.Date(2006, time.January, 2, t.Hour(), t.Minute(), 0, 0, loc)
}

// // ยังไม่ครบ
func SeedTimeFixedCourses() {
	layout := "15:04"
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		panic(err)
	}

	entries := []entity.TimeFixedCourses{
		{
			Year:         2567,
			Term:         1,
			DayOfWeek:    "อังคาร",
			StartTime:    parseTimeWithLoc(layout, "09:00", loc),
			EndTime:      parseTimeWithLoc(layout, "11:00", loc),
			RoomFix:      "Lecture C",
			Section:      1,
			Capacity:     300,
			AllCoursesID: 2,
			ScheduleID:   1,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "13:00", loc),
			EndTime:   parseTimeWithLoc(layout, "16:00", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 300,
			AllCoursesID: 3, ScheduleID: 2,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "14:00", loc),
			EndTime:   parseTimeWithLoc(layout, "17:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 4, ScheduleID: 3,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "17:00", loc),
			EndTime:   parseTimeWithLoc(layout, "20:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 300,
			AllCoursesID: 5, ScheduleID: 4,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 300,
			AllCoursesID: 6, ScheduleID: 5,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Lecture A", Section: 2, Capacity: 300,
			AllCoursesID: 6, ScheduleID: 6,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "13:00", loc),
			EndTime:   parseTimeWithLoc(layout, "16:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 7, ScheduleID: 7,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "15:00", loc),
			EndTime:   parseTimeWithLoc(layout, "18:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 300,
			AllCoursesID: 8, ScheduleID: 8,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "อังคาร",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 9, ScheduleID: 9,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "อังคาร",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Lecture C", Section: 2, Capacity: 300,
			AllCoursesID: 9, ScheduleID: 10,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "13:00", loc),
			EndTime:   parseTimeWithLoc(layout, "16:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 10, ScheduleID: 11,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "15:00", loc),
			EndTime:   parseTimeWithLoc(layout, "18:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 300,
			AllCoursesID: 11, ScheduleID: 12,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "08:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 300,
			AllCoursesID: 12, ScheduleID: 13,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "08:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Lecture A", Section: 2, Capacity: 300,
			AllCoursesID: 12, ScheduleID: 14,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "จันทร์",
			StartTime: parseTimeWithLoc(layout, "13:00", loc),
			EndTime:   parseTimeWithLoc(layout, "14:00", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 300,
			AllCoursesID: 13, ScheduleID: 15,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "อังคาร",
			StartTime: parseTimeWithLoc(layout, "14:00", loc),
			EndTime:   parseTimeWithLoc(layout, "15:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 14, ScheduleID: 16,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "จันทร์",
			StartTime: parseTimeWithLoc(layout, "15:00", loc),
			EndTime:   parseTimeWithLoc(layout, "16:00", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 300,
			AllCoursesID: 15, ScheduleID: 17,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "17:00", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 300,
			AllCoursesID: 16, ScheduleID: 18,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "17:00", loc),
			EndTime:   parseTimeWithLoc(layout, "18:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 300,
			AllCoursesID: 17, ScheduleID: 19,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "จันทร์",
			StartTime: parseTimeWithLoc(layout, "18:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 18, ScheduleID: 20,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "19:00", loc),
			EndTime:   parseTimeWithLoc(layout, "20:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 19, ScheduleID: 21,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "10:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 20, ScheduleID: 22,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "10:00", loc),
			RoomFix:   "Lecture C", Section: 2, Capacity: 300,
			AllCoursesID: 20, ScheduleID: 23,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "10:00", loc),
			EndTime:   parseTimeWithLoc(layout, "11:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 300,
			AllCoursesID: 21, ScheduleID: 24,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "จันทร์",
			StartTime: parseTimeWithLoc(layout, "11:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 300,
			AllCoursesID: 22, ScheduleID: 25,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "17:30", loc),
			EndTime:   parseTimeWithLoc(layout, "18:30", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 300,
			AllCoursesID: 23, ScheduleID: 26,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "13:00", loc),
			EndTime:   parseTimeWithLoc(layout, "14:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 300,
			AllCoursesID: 24, ScheduleID: 27,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 28,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 2, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 29,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 3, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 30,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 4, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 31,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 5, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 32,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 6, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 33,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 7, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 34,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 8, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 35,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 9, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 36,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 10, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 37,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 11, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 38,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 12, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 39,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 13, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 40,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 14, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 41,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 15, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 42,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 16, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 43,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 17, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 44,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 18, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 45,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 19, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 46,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 20, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 47,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 21, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 48,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 22, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 49,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 23, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 50,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 24, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 51,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 25, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 52,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 26, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 53,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 27, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 54,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 28, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 55,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 29, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 56,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Lecture B", Section: 30, Capacity: 10,
			AllCoursesID: 26, ScheduleID: 57,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "จันทร์",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "11:00", loc),
			RoomFix:   "Lecture A", Section: 1, Capacity: 10,
			AllCoursesID: 97, ScheduleID: 253,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "10:00", loc),
			EndTime:   parseTimeWithLoc(layout, "13:00", loc),
			RoomFix:   "Room 402", Section: 1, Capacity: 10,
			AllCoursesID: 98, ScheduleID: 254,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "13:00", loc),
			EndTime:   parseTimeWithLoc(layout, "15:00", loc),
			RoomFix:   "Lab 1", Section: 1, Capacity: 10,
			AllCoursesID: 99, ScheduleID: 255,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "อังคาร",
			StartTime: parseTimeWithLoc(layout, "15:00", loc),
			EndTime:   parseTimeWithLoc(layout, "18:00", loc),
			RoomFix:   "Lecture B", Section: 1, Capacity: 10,
			AllCoursesID: 100, ScheduleID: 256,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "16:00", loc),
			EndTime:   parseTimeWithLoc(layout, "18:00", loc),
			RoomFix:   "Room 305", Section: 1, Capacity: 10,
			AllCoursesID: 101, ScheduleID: 257,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "11:00", loc),
			EndTime:   parseTimeWithLoc(layout, "13:00", loc),
			RoomFix:   "Lab 2", Section: 1, Capacity: 10,
			AllCoursesID: 102, ScheduleID: 258,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "จันทร์",
			StartTime: parseTimeWithLoc(layout, "14:00", loc),
			EndTime:   parseTimeWithLoc(layout, "18:00", loc),
			RoomFix:   "Seminar Rm", Section: 1, Capacity: 10,
			AllCoursesID: 103, ScheduleID: 259,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "09:00", loc),
			EndTime:   parseTimeWithLoc(layout, "12:00", loc),
			RoomFix:   "Room 201", Section: 1, Capacity: 10,
			AllCoursesID: 104, ScheduleID: 260,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "อังคาร",
			StartTime: parseTimeWithLoc(layout, "12:00", loc),
			EndTime:   parseTimeWithLoc(layout, "14:00", loc),
			RoomFix:   "Lecture C", Section: 1, Capacity: 10,
			AllCoursesID: 105, ScheduleID: 261,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พฤหัสบดี",
			StartTime: parseTimeWithLoc(layout, "17:00", loc),
			EndTime:   parseTimeWithLoc(layout, "19:00", loc),
			RoomFix:   "Room 410", Section: 1, Capacity: 10,
			AllCoursesID: 106, ScheduleID: 262,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "พุธ",
			StartTime: parseTimeWithLoc(layout, "10:00", loc),
			EndTime:   parseTimeWithLoc(layout, "14:00", loc),
			RoomFix:   "Lab 3", Section: 1, Capacity: 10,
			AllCoursesID: 107, ScheduleID: 263,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "ศุกร์",
			StartTime: parseTimeWithLoc(layout, "13:00", loc),
			EndTime:   parseTimeWithLoc(layout, "16:00", loc),
			RoomFix:   "Room 108", Section: 1, Capacity: 10,
			AllCoursesID: 108, ScheduleID: 264,
		},
		{
			Year: 2567, Term: 1, DayOfWeek: "จันทร์",
			StartTime: parseTimeWithLoc(layout, "15:00", loc),
			EndTime:   parseTimeWithLoc(layout, "17:00", loc),
			RoomFix:   "Lecture D", Section: 1, Capacity: 10,
			AllCoursesID: 109, ScheduleID: 265,
		},
	}

	// for _, entry := range entries {
	// 	startTime, _ := time.Parse(layout, entry.StartTimeStr)
	// 	endTime, _ := time.Parse(layout, entry.EndTimeStr)

	// 	db.FirstOrCreate(&entity.TimeFixedCourses{}, &entity.TimeFixedCourses{
	// 		Year:         entry.Year,
	// 		Term:         entry.Term,
	// 		DayOfWeek:    entry.DayOfWeek,
	// 		StartTime:    startTime,
	// 		EndTime:      endTime,
	// 		RoomFix:      entry.RoomFix,
	// 		Section:      entry.Section,
	// 		Capacity:     entry.Capacity,
	// 		AllCoursesID: entry.AllCoursesID,
	// 		ScheduleID:   entry.ScheduleID,
	// 	})
	// }
	//////////////////////////////////////////////////////////
	// for _, entry := range entries {
	// 	// startTime, _ := time.ParseInLocation(layout, entry.StartTime, loc)
	// 	// endTime, _ := time.ParseInLocation(layout, entry.EndTime, loc)

	// 	// ✅ Insert ใหม่ทุกครั้ง ไม่เช็คซ้ำ
	// 	db.FirstOrCreate(&entity.TimeFixedCourses{}, &entity.TimeFixedCourses{
	// 		Year:         entry.Year,
	// 		Term:         entry.Term,
	// 		DayOfWeek:    entry.DayOfWeek,
	// 		StartTime:    entry.StartTime,
	// 		EndTime:      entry.EndTime,
	// 		RoomFix:      entry.RoomFix,
	// 		Section:      entry.Section,
	// 		Capacity:     entry.Capacity,
	// 		AllCoursesID: entry.AllCoursesID,
	// 		ScheduleID:   entry.ScheduleID,
	// 	})
	// }
	// for _, s := range entries {
	// 	err := db.FirstOrCreate(&entity.TimeFixedCourses{}, &s).Error
	// 	if err != nil {
	// 		fmt.Println("Insert error:", err)
	// 	} else {
	// 		fmt.Println("Inserted or found:", s)
	// 	}
	// }
		seedDB := db.Session(&gorm.Session{
		Logger: logger.Default.LogMode(logger.Silent), // เงียบ SQL/record not found
	})

	for i := range entries {
		e := entries[i] // กันปัญหา pointer กับ range variable
		_ = seedDB.Create(&e).Error // ใส่อย่างเดียว ไม่พิมพ์อะไรออก
	}
}

// //////////////////////////////////////////////////////////// ตารางสอน ///////////////////////////////////////////////////////
// // ยังไม่ครบ
func SeedSchedules() {
	layout := "15:04"
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		panic(err)
	}

	schedules := []entity.Schedule{
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "09:00", loc),
			EndTime:          parseTimeWithLoc(layout, "11:00", loc),
			OfferedCoursesID: 1,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "อังคาร",
			StartTime:        parseTimeWithLoc(layout, "09:00", loc),
			EndTime:          parseTimeWithLoc(layout, "11:00", loc),
			OfferedCoursesID: 2,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "13:00", loc),
			EndTime:          parseTimeWithLoc(layout, "16:00", loc),
			OfferedCoursesID: 3,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "14:00", loc),
			EndTime:          parseTimeWithLoc(layout, "17:00", loc),
			OfferedCoursesID: 4,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "17:00", loc),
			EndTime:          parseTimeWithLoc(layout, "20:00", loc),
			OfferedCoursesID: 5,
		},
				{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "17:00", loc),
			EndTime:          parseTimeWithLoc(layout, "20:00", loc),
			OfferedCoursesID: 5,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "09:00", loc),
			EndTime:          parseTimeWithLoc(layout, "12:00", loc),
			OfferedCoursesID: 6,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "13:00", loc),
			EndTime:          parseTimeWithLoc(layout, "16:00", loc),
			OfferedCoursesID: 7,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "15:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 8,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "15:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 8,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "อังคาร",
			StartTime:        parseTimeWithLoc(layout, "09:00", loc),
			EndTime:          parseTimeWithLoc(layout, "12:00", loc),
			OfferedCoursesID: 9,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "13:00", loc),
			EndTime:          parseTimeWithLoc(layout, "16:00", loc),
			OfferedCoursesID: 10,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "15:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 11,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "15:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 11,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "08:00", loc),
			EndTime:          parseTimeWithLoc(layout, "12:00", loc),
			OfferedCoursesID: 12,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "13:00", loc),
			EndTime:          parseTimeWithLoc(layout, "14:00", loc),
			OfferedCoursesID: 13,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "อังคาร",
			StartTime:        parseTimeWithLoc(layout, "14:00", loc),
			EndTime:          parseTimeWithLoc(layout, "15:00", loc),
			OfferedCoursesID: 14,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "15:00", loc),
			EndTime:          parseTimeWithLoc(layout, "16:00", loc),
			OfferedCoursesID: 15,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "17:00", loc),
			OfferedCoursesID: 16,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "17:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 17,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "18:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 18,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "19:00", loc),
			EndTime:          parseTimeWithLoc(layout, "20:00", loc),
			OfferedCoursesID: 19,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "19:00", loc),
			EndTime:          parseTimeWithLoc(layout, "20:00", loc),
			OfferedCoursesID: 19,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "09:00", loc),
			EndTime:          parseTimeWithLoc(layout, "10:00", loc),
			OfferedCoursesID: 20,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "10:00", loc),
			EndTime:          parseTimeWithLoc(layout, "11:00", loc),
			OfferedCoursesID: 21,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "11:00", loc),
			EndTime:          parseTimeWithLoc(layout, "12:00", loc),
			OfferedCoursesID: 22,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "17:30", loc),
			EndTime:          parseTimeWithLoc(layout, "18:30", loc),
			OfferedCoursesID: 23,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    2,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    3,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    4,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    5,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    6,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    7,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    8,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    9,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    10,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    11,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    12,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    13,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    14,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    15,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    16,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    17,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    18,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    19,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    20,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    21,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    22,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    23,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    24,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    25,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    26,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    27,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    28,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    29,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    30,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 24,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "09:00", loc),
			EndTime:          parseTimeWithLoc(layout, "11:00", loc),
			OfferedCoursesID: 31,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "10:00", loc),
			EndTime:          parseTimeWithLoc(layout, "13:00", loc),
			OfferedCoursesID: 32,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "13:00", loc),
			EndTime:          parseTimeWithLoc(layout, "15:00", loc),
			OfferedCoursesID: 33,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "อังคาร",
			StartTime:        parseTimeWithLoc(layout, "15:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 34,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "16:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 35,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "11:00", loc),
			EndTime:          parseTimeWithLoc(layout, "13:00", loc),
			OfferedCoursesID: 36,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "14:00", loc),
			EndTime:          parseTimeWithLoc(layout, "18:00", loc),
			OfferedCoursesID: 37,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "09:00", loc),
			EndTime:          parseTimeWithLoc(layout, "12:00", loc),
			OfferedCoursesID: 38,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "อังคาร",
			StartTime:        parseTimeWithLoc(layout, "12:00", loc),
			EndTime:          parseTimeWithLoc(layout, "14:00", loc),
			OfferedCoursesID: 39,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พฤหัสบดี",
			StartTime:        parseTimeWithLoc(layout, "17:00", loc),
			EndTime:          parseTimeWithLoc(layout, "19:00", loc),
			OfferedCoursesID: 40,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "พุธ",
			StartTime:        parseTimeWithLoc(layout, "10:00", loc),
			EndTime:          parseTimeWithLoc(layout, "14:00", loc),
			OfferedCoursesID: 41,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "ศุกร์",
			StartTime:        parseTimeWithLoc(layout, "13:00", loc),
			EndTime:          parseTimeWithLoc(layout, "16:00", loc),
			OfferedCoursesID: 42,
		},
		{
			NameTable:        "ปีการศึกษา 2567 เทอม 1",
			SectionNumber:    1,
			DayOfWeek:        "จันทร์",
			StartTime:        parseTimeWithLoc(layout, "15:00", loc),
			EndTime:          parseTimeWithLoc(layout, "17:00", loc),
			OfferedCoursesID: 43,
		},
	}

	// for _, s := range schedules {
	// 	db.FirstOrCreate(&entity.Schedule{}, &entity.Schedule{
	// 		NameTable:        s.NameTable,
	// 		SectionNumber:    s.SectionNumber,
	// 		DayOfWeek:        s.DayOfWeek,
	// 		StartTime:        s.StartTime,
	// 		EndTime:          s.EndTime,
	// 		OfferedCoursesID: s.OfferedCoursesID,
	// 	})
	// }
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
