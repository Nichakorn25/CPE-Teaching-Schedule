package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllCurriculum(c *gin.Context) {

    var cur []entity.Curriculum
    config.DB().Preload("Major").Preload("Major.Department").Find(&cur)

    c.JSON(http.StatusOK, cur)
}

func GetCurriculumById(c *gin.Context) {
	id := c.Param("id")

	var cur entity.Curriculum
	// ดึงข้อมูลหลักสูตร พร้อม Major และ Department ของ Major
	if err := config.DB().
		Preload("Major").
		Preload("Major.Department").
		First(&cur, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบหลักสูตรที่ต้องการ"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถโหลดข้อมูลหลักสูตรได้"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "โหลดข้อมูลหลักสูตรสำเร็จ",
		"data": gin.H{
			"id":             cur.ID,
			"curriculumName": cur.CurriculumName,
			"year":           cur.Year,
			"started":        cur.Started,
			"majorId":        cur.MajorID,
			"majorName":      cur.Major.MajorName,
			"departmentId":   cur.Major.Department.ID,
			"departmentName": cur.Major.Department.DepartmentName,
			"createdAt":      cur.CreatedAt,
			"updatedAt":      cur.UpdatedAt,
		},
	})
}



// DTO
type createCurriculumInput struct {
    CurriculumName string `json:"curriculumName" binding:"required"`
    Year           uint   `json:"year"           binding:"required"`
    Started        uint   `json:"started"        binding:"required"`
    MajorID        uint   `json:"majorId"        binding:"required"`
}

func CreateCurriculum(c *gin.Context) {
    var in createCurriculumInput
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
        return
    }

    var major entity.Major
    if err := config.DB().First(&major, in.MajorID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบสาขา (Major) ที่ระบุ"})
        return
    }

    cur := entity.Curriculum{
        CurriculumName: in.CurriculumName,
        Year:           in.Year,
        Started:        in.Started,
        MajorID:        in.MajorID,
    }

    if err := config.DB().Create(&cur).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างหลักสูตรได้"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "message": "สร้างหลักสูตรสำเร็จ",
        "data": gin.H{
            "id":             cur.ID,
            "curriculumName": cur.CurriculumName,
            "year":           cur.Year,
            "started":        cur.Started,
            "majorId":        cur.MajorID,
            "createdAt":      cur.CreatedAt,
        },
    })
}



type updateCurriculumInput struct {
	CurriculumName *string `json:"curriculumName"`
	Year           *uint   `json:"year"`
	Started        *uint   `json:"started"`
	MajorID        *uint   `json:"majorId"`
}

func UpdateCurriculum(c *gin.Context) {
	id := c.Param("id")

	var cur entity.Curriculum
	if err := config.DB().First(&cur, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบหลักสูตรที่ต้องการแก้ไข"})
		return
	}

	var in updateCurriculumInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	if in.MajorID != nil {
		var major entity.Major
		if err := config.DB().First(&major, *in.MajorID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบสาขา (Major) ที่ระบุ"})
			return
		}
	}

	if in.CurriculumName != nil {
		cur.CurriculumName = *in.CurriculumName
	}
	if in.Year != nil {
		cur.Year = *in.Year
	}
	if in.Started != nil {
		cur.Started = *in.Started
	}
	if in.MajorID != nil {
		cur.MajorID = *in.MajorID
	}

	if err := config.DB().Save(&cur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถแก้ไขหลักสูตรได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "แก้ไขหลักสูตรสำเร็จ",
		"data": gin.H{
			"id":             cur.ID,
			"curriculumName": cur.CurriculumName,
			"year":           cur.Year,
			"started":        cur.Started,
			"majorId":        cur.MajorID,
			"updatedAt":      cur.UpdatedAt,
		},
	})
}


func DuplicateAllCoursesIntoCurriculum(c *gin.Context) {
	targetCurID := c.Param("id")

	var targetCur entity.Curriculum
	if err := config.DB().First(&targetCur, targetCurID).Error; err != nil {
    	c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบหลักสูตรปลายทาง"})
    	return
	}

	// ดึงวิชาต้นทางทั้งหมด (ยกเว้นของหลักสูตรปลายทาง)
	var sourceCourses []entity.AllCourses
	if err := config.DB().
		Where("curriculum_id <> ?", targetCurID).
		Find(&sourceCourses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงรายวิชาต้นทางได้"})
		return
	}

	// ดึงวิชาของหลักสูตรปลายทางมาสร้างดัชนีป้องกันซ้ำแบบ normalize(Code)
	var targetCourses []entity.AllCourses
	if err := config.DB().
		Where("curriculum_id = ?", targetCurID).
		Find(&targetCourses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงรายวิชาปลายทางได้"})
		return
	}

	// เซ็ตเก็บ normalize(code) ที่มีอยู่แล้วในหลักสูตรเป้าหมาย
	existsNormalized := map[string]bool{}
	for _, ac := range targetCourses {
		existsNormalized[normalizeCode(ac.Code)] = true
	}

	created := make([]entity.AllCourses, 0, len(sourceCourses))

	err := config.DB().Transaction(func(tx *gorm.DB) error {
		for _, src := range sourceCourses {
			norm := normalizeCode(src.Code)

			// ถ้าเจอ (normalize(Code), target curriculum) อยู่แล้ว ให้ข้าม
			if existsNormalized[norm] {
				continue
			}

			// สร้าง code ใหม่ให้ไม่ชน unique ของคอลัมน์ code (ทั้งตาราง)
			base := norm
			candidate := base
			var cnt int64
			tx.Model(&entity.AllCourses{}).Where("code = ?", candidate).Count(&cnt)
			i := 0
			for cnt > 0 {
				i++
				candidate = base + strings.Repeat("*", i)
				tx.Model(&entity.AllCourses{}).Where("code = ?", candidate).Count(&cnt)
			}

			dup := entity.AllCourses{
				Code:            candidate,
				EnglishName:     src.EnglishName,
				ThaiName:        src.ThaiName,
				Ismain:          src.Ismain,
				CurriculumID:    targetCur.ID,
				AcademicYearID:  src.AcademicYearID,
				TypeOfCoursesID: src.TypeOfCoursesID,
				CreditID:        src.CreditID,
			}

			if err := tx.Create(&dup).Error; err != nil {
				return err
			}

			// อัปเดตดัชนีว่า normalize(code) นี้ถูกใช้ในหลักสูตรเป้าหมายแล้ว
			existsNormalized[norm] = true
			created = append(created, dup)
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "คัดลอกรายวิชาไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("คัดลอกรายวิชาสำเร็จ %d ตัว", len(created)),
		"data":    created,
	})
}

// normalizeCode ลบ "*" ทั้งหมดออกจาก code
func normalizeCode(s string) string {
	return strings.ReplaceAll(s, "*", "")
}

