package controllers

import (
	"net/http"
	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllCurriculum(c *gin.Context) {

    var cur []entity.Curriculum
    config.DB().Preload("Major").Preload("Major.Department").Find(&cur)

    c.JSON(http.StatusOK, cur)
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

    // เช็คว่า Major ที่อ้างถึงมีอยู่จริง
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
