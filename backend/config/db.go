package config

import (
	entity "github.com/Nichakorn25/CPE-Teaching-Schedule/backend/entity"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	// แก้ตรงนี้ให้เป็นค่าจริงของคุณ
	dsn := "host=localhost user=postgres password=1234 dbname=mydb port=5432 sslmode=disable TimeZone=Asia/Bangkok"
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect to database")
	}
	fmt.Println("connected to database")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Admin{},
		&entity.Condition{},
		&entity.Curriculum{},
		&entity.Day{},
		&entity.GC{},
		&entity.Grade{},
		&entity.Instructor{},
		&entity.Lab{},
		&entity.Major{},
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
		&entity.TA{},
		&entity.Term{},
		&entity.Unit{},
		&entity.User{},
		&entity.Year{},
		&entity.YT{},
	)
}
