package controllers

import (
	"net/http"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// {
//   "TeachingAssistantID": 1,
//   "ScheduleID": 1
// }

// POST /ScheduleTeachingAssistants
func CreateScheduleTeachingAssistant(c *gin.Context) {
	var input entity.ScheduleTeachingAssistant

	// รับข้อมูล JSON จาก client
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// สร้าง ScheduleTeachingAssistant object
	scheduleTA := entity.ScheduleTeachingAssistant{
		TeachingAssistantID: input.TeachingAssistantID,
		ScheduleID:          input.ScheduleID,
	}

	// บันทึกลงฐานข้อมูล
	if err := db.Create(&scheduleTA).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตอบกลับ
	c.JSON(http.StatusCreated, gin.H{
		"message": "ScheduleTeachingAssistant created successfully",
		"data":    scheduleTA,
	})
}

// ///////////////////////////////// สร้างโดยเลือกจากวิชาที่เปิดสอนคู่กับตารางสอนวิชานั้น
type AssignTA struct {
  OfferedCoursesID     uint   `json:"offered_courses_id" binding:"required"`
  NameTable            string `json:"name_table" binding:"required"`
  TeachingAssistantIDs []uint `json:"teaching_assistant_ids" binding:"required,min=1,dive,gt=0"`
}

// func AssignTAToSchedule(c *gin.Context) {
//     var req AssignTA
//     if err := c.ShouldBindJSON(&req); err != nil {
//         c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
//         return
//     }

//     db := c.MustGet("db").(*gorm.DB)

//     var schedules []entity.Schedule
//     if err := db.Where("offered_courses_id = ? AND name_table = ?", req.OfferedCoursesID, req.NameTable).
//         Find(&schedules).Error; err != nil {
//         c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find schedules"})
//         return
//     }

//     if len(schedules) == 0 {
//         c.JSON(http.StatusNotFound, gin.H{"error": "No schedules found for this course and nameTable"})
//         return
//     }

//     // เตรียมข้อมูลสำหรับ insert
//     var assignments []entity.ScheduleTeachingAssistant
//     for _, schedule := range schedules {
//         for _, taID := range req.TeachingAssistantIDs {
//             assignments = append(assignments, entity.ScheduleTeachingAssistant{
//                 TeachingAssistantID: taID,
//                 ScheduleID:          schedule.ID,
//             })
//         }
//     }

//     if err := db.Create(&assignments).Error; err != nil {
//         c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกผู้ช่วยสอนได้"})
//         return
//     }

//     c.JSON(http.StatusOK, gin.H{
//         "message": "บันทึกผู้ช่วยสอนสำเร็จ",
//     })
// }

func AssignTAToSchedule(c *gin.Context) {
    var req AssignTA
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body", "details": err.Error()})
        return
    }

    // ---- ดึง *gorm.DB โดยพยายามจาก context ก่อน ถ้าไม่มีค่อย fallback เป็น config.DB ----
    var db *gorm.DB
    if v, ok := c.Get("db"); ok && v != nil {
        if d, ok2 := v.(*gorm.DB); ok2 && d != nil {
            db = d
        }
    }
    if db == nil {
        db = config.DB()
    }
    if db == nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "db not found"})
        return
    }
    // เปิดโหมด debug จาก query ได้ เช่น ?debug=1
    if c.Query("debug") == "1" {
        db = db.Debug()
    }

    // 1) ดึง schedules ของคอร์ส + name_table
    var schedules []entity.Schedule
    if err := db.
        Where("offered_courses_id = ? AND name_table = ?", req.OfferedCoursesID, req.NameTable).
        Find(&schedules).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find schedules", "details": err.Error()})
        return
    }
    if len(schedules) == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "no schedules found for this course and nameTable"})
        return
    }

    // 2) ตรวจ TA IDs มีจริงทั้งหมด (กัน FK ล้ม)
    var tas []entity.TeachingAssistant
    if err := db.Where("id IN ?", req.TeachingAssistantIDs).Find(&tas).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load teaching assistants", "details": err.Error()})
        return
    }
    if len(tas) != len(req.TeachingAssistantIDs) {
        exist := map[uint]struct{}{}
        for _, ta := range tas { exist[ta.ID] = struct{}{} }
        missing := make([]uint, 0)
        for _, id := range req.TeachingAssistantIDs {
            if _, ok := exist[id]; !ok { missing = append(missing, id) }
        }
        c.JSON(http.StatusBadRequest, gin.H{"error": "some teaching_assistant_ids do not exist", "missing": missing})
        return
    }

    // 3) เตรียมชุด pair และตัดซ้ำในคำขอเอง
    scheduleIDs := make([]uint, 0, len(schedules))
    for _, sc := range schedules { scheduleIDs = append(scheduleIDs, sc.ID) }

    uniqTA := map[uint]struct{}{}
    taIDs := make([]uint, 0, len(req.TeachingAssistantIDs))
    for _, id := range req.TeachingAssistantIDs {
        if _, ok := uniqTA[id]; !ok {
            uniqTA[id] = struct{}{}
            taIDs = append(taIDs, id)
        }
    }

    // 4) เช็คคู่ที่มีอยู่แล้ว เพื่อตัดซ้ำ (ไม่ใช้ clause)
    type pair struct{ ScheduleID, TeachingAssistantID uint }
    var existing []pair
    if err := db.
        Model(&entity.ScheduleTeachingAssistant{}).
        Select("schedule_id, teaching_assistant_id").
        Where("schedule_id IN ? AND teaching_assistant_id IN ?", scheduleIDs, taIDs).
        Find(&existing).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check duplicates", "details": err.Error()})
        return
    }
    has := map[uint]map[uint]struct{}{} // has[scheduleID][taID]
    for _, e := range existing {
        if has[e.ScheduleID] == nil { has[e.ScheduleID] = map[uint]struct{}{} }
        has[e.ScheduleID][e.TeachingAssistantID] = struct{}{}
    }

    // 5) เตรียม insert เฉพาะที่ยังไม่มี
    toInsert := make([]entity.ScheduleTeachingAssistant, 0, len(scheduleIDs)*len(taIDs))
    for _, sid := range scheduleIDs {
        for _, tid := range taIDs {
            if _, ok := has[sid][tid]; !ok {
                toInsert = append(toInsert, entity.ScheduleTeachingAssistant{
                    ScheduleID:          sid,
                    TeachingAssistantID: tid,
                })
            }
        }
    }

    if len(toInsert) == 0 {
        c.JSON(http.StatusOK, gin.H{"message": "no new rows to insert", "inserted_rows": 0})
        return
    }

    // 6) บันทึก
    if err := db.Create(&toInsert).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกผู้ช่วยสอนได้", "details": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":       "บันทึกผู้ช่วยสอนสำเร็จ",
        "inserted_rows": len(toInsert),
    })
}
