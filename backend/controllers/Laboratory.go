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

// GET /laboratories/:id
func GetLaboratoryByID(c *gin.Context) {
	// รับ id จาก path param
	idParam := c.Param("id")
	idUint64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสไม่ถูกต้อง"})
		return
	}
	id := uint(idUint64)

	// ค้นหา record
	var lab entity.Laboratory
	if err := config.DB().First(&lab, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้องปฏิบัติการ"})
		return
	}

	// ส่ง response กลับ
	c.JSON(http.StatusOK, gin.H{
		"message": "ดึงข้อมูลห้องปฏิบัติการสำเร็จ",
		"data": gin.H{
			"id":        lab.ID,
			"room":      lab.Room,
			"building":  lab.Building,
			"capacity":  lab.Capacity,
			"createdAt": lab.CreatedAt,
			"updatedAt": lab.UpdatedAt,
		},
	})
}


type updateLaboratoryInput struct {
	Room     string `json:"room" binding:"required"`
	Building string `json:"building" binding:"required"`
	Capacity string `json:"capacity" binding:"required"`
}

func UpdateLaboratory(c *gin.Context) {
	// รับ id จาก path param
	idParam := c.Param("id")
	idUint64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสไม่ถูกต้อง"})
		return
	}
	id := uint(idUint64)

	// หา record เดิม
	var lab entity.Laboratory
	if err := config.DB().First(&lab, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้องปฏิบัติการ"})
		return
	}

	// bind body
	var in updateLaboratoryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// ตรวจว่า capacity เป็นตัวเลขได้ (แม้เก็บเป็น string)
	if _, err := strconv.Atoi(in.Capacity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "capacity ต้องเป็นตัวเลข"})
		return
	}

	// กันข้อมูลซ้ำ: ห้อง + อาคาร เดิม โดยไม่รวม record ปัจจุบัน
	var dupe int64
	if err := config.DB().
		Model(&entity.Laboratory{}).
		Where("room = ? AND building = ? AND id <> ?", in.Room, in.Building, id).
		Count(&dupe).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถตรวจสอบข้อมูลซ้ำได้"})
		return
	}
	if dupe > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ห้องนี้ในอาคารนี้มีอยู่แล้ว"})
		return
	}

	// อัปเดตค่า
	lab.Room = in.Room
	lab.Building = in.Building
	lab.Capacity = in.Capacity

	if err := config.DB().Save(&lab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตห้องปฏิบัติการได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปเดตห้องปฏิบัติการสำเร็จ",
		"data": gin.H{
			"id":        lab.ID,
			"room":      lab.Room,
			"building":  lab.Building,
			"capacity":  lab.Capacity,
			"updatedAt": lab.UpdatedAt,
		},
	})
}

// DELETE /laboratories/:id
func DeleteLaboratory(c *gin.Context) {
	// รับ id จาก path param
	idParam := c.Param("id")
	idUint64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสไม่ถูกต้อง"})
		return
	}
	id := uint(idUint64)

	// ตรวจว่ามีอยู่จริง
	var lab entity.Laboratory
	if err := config.DB().First(&lab, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้องปฏิบัติการ"})
		return
	}

	// ลบ
	if err := config.DB().Delete(&lab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบห้องปฏิบัติการได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ลบห้องปฏิบัติการสำเร็จ",
		"data": gin.H{
			"id": lab.ID,
		},
	})
}