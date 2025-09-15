package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetLaboratory(c *gin.Context) {

    var lab []entity.Laboratory
    config.DB().Find(&lab)

    c.JSON(http.StatusOK, lab)
}

type createLaboratoryInput struct {
	Room     string `json:"room"     binding:"required"`
	Building string `json:"building" binding:"required"`
	Capacity string `json:"capacity" binding:"required"` // เก็บเป็น string ตาม entity
}

func CreateLaboratory(c *gin.Context) {
	var in createLaboratoryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// ตรวจว่า capacity เป็นตัวเลขได้ (แม้เก็บเป็น string)
	if _, err := strconv.Atoi(in.Capacity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "capacity ต้องเป็นตัวเลข"})
		return
	}

	// กันข้อมูลซ้ำ: ห้อง + อาคาร เดิม
	var dupe int64
	config.DB().
		Model(&entity.Laboratory{}).
		Where("room = ? AND building = ?", in.Room, in.Building).
		Count(&dupe)
	if dupe > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ห้องนี้ในอาคารนี้มีอยู่แล้ว"})
		return
	}

	lab := entity.Laboratory{
		Room:     in.Room,
		Building: in.Building,
		Capacity: in.Capacity,
	}

	if err := config.DB().Create(&lab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างห้องปฏิบัติการได้"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "สร้างห้องปฏิบัติการสำเร็จ",
		"data": gin.H{
			"id":       lab.ID,
			"room":     lab.Room,
			"building": lab.Building,
			"capacity": lab.Capacity,
			"createdAt": lab.CreatedAt,
		},
	})
}
