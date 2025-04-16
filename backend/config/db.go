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
}
