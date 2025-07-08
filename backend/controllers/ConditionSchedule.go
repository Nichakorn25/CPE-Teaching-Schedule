package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type (
	ConditionInput struct {
		DayOfWeek string
		StartTime string
		EndTime   string
	}

	ConditionsRequest struct {
		UserID     uint
		Conditions []ConditionInput
	}

	ConditionItem struct {
		DayOfWeek string
		Start     string
		End       string
	}

	ConditionResponse struct {
		UserID        uint
		Code          string
		Fullname      string
		Major         string
		Email         string
		Phone         string
		ItemCount     int
		Conditions    []ConditionItem
		CreatedAt     string
		LastUpdatedAt string
	}
)

func CreateConditions(c *gin.Context) {
	var req ConditionsRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลที่รับมาไม่ถูกต้อง"})
		return
	}

	for _, input := range req.Conditions {
		startTime, err1 := time.Parse("15:04", input.StartTime)
		endTime, err2 := time.Parse("15:04", input.EndTime)

		if err1 != nil || err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบเวลาไม่ถูกต้อง"})
			return
		}

		condition := entity.Condition{
			DayOfWeek: input.DayOfWeek,
			StartTime: startTime,
			EndTime:   endTime,
			UserID:    req.UserID,
		}

		if err := config.DB().Create(&condition).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกเงื่อนไขเวลาที่ไม่ว่างได้"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "บันทึกเงื่อนไขเวลาที่ไม่ว่างสำเร็จ"})
}

func UpdateConditions(c *gin.Context) {  // แก้ไขข้อมูลเฉพาะของคนๆ นั้น
	var req ConditionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	if err := config.DB().Transaction(func(tx *gorm.DB) error {
		// 1) ลบ Condition เดิมทั้งหมดของ User
		if err := tx.Where("user_id = ?", req.UserID).
			Delete(&entity.Condition{}).Error; err != nil {
			return err
		}

		// 2) เพิ่ม Condition ใหม่ตามที่รับมา
		for _, input := range req.Conditions {
			start, err1 := time.Parse("15:04", input.StartTime)
			end, err2 := time.Parse("15:04", input.EndTime)
			if err1 != nil || err2 != nil {
				return fmt.Errorf("รูปแบบเวลาไม่ถูกต้อง")
			}

			cond := entity.Condition{
				DayOfWeek: input.DayOfWeek,
				StartTime: start,
				EndTime:   end,
				UserID:    req.UserID,
			}
			if err := tx.Create(&cond).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตเงื่อนไขเวลาที่ไม่ว่างสำเร็จ"})
}

func GetAllCondition(c *gin.Context) {
	var users []entity.User

	err := config.DB().Preload("Title").Preload("Major").Preload("Conditions").Find(&users).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการดึงข้อมูล"})
		return
	}

	var responses []ConditionResponse

	for _, user := range users {
		if len(user.Conditions) == 0 {
			continue
		}

		items := make([]ConditionItem, 0, len(user.Conditions))
		var created, updated time.Time

		for i, cnd := range user.Conditions {
			if i == 0 || cnd.CreatedAt.Before(created) {
				created = cnd.CreatedAt
			}
			if cnd.UpdatedAt.After(updated) {
				updated = cnd.UpdatedAt
			}

			items = append(items, ConditionItem{
				DayOfWeek: cnd.DayOfWeek,
				Start:     cnd.StartTime.Format("15:04"),
				End:       cnd.EndTime.Format("15:04"),
			})
		}

		resp := ConditionResponse{
			UserID:        user.ID,
			Code:          user.Username,
			Fullname:      fmt.Sprintf("%s%s %s", user.Title.Title, user.Firstname, user.Lastname),
			Major:         user.Major.MajorName,
			Email:         user.Email,
			Phone:         user.PhoneNumber,
			ItemCount:     len(items),
			Conditions:    items,
			CreatedAt:     created.Format("2/1/2006"),
			LastUpdatedAt: updated.Format("2/1/2006"),
		}

		responses = append(responses, resp)
	}

	c.JSON(http.StatusOK, responses)
}

func GetConditionByuserID(c *gin.Context) {
	uid, err := strconv.Atoi(c.Param("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userID ไม่ถูกต้อง"})
		return
	}

	var user entity.User
	err = config.DB().
		Preload("Title").
		Preload("Major").
		Preload("Conditions").
		First(&user, uid).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้"})
		return
	}

	conds := user.Conditions
	items := make([]ConditionItem, 0, len(conds))
	var created, updated time.Time

	for i, cnd := range conds {
		if i == 0 || cnd.CreatedAt.Before(created) {
			created = cnd.CreatedAt
		}
		if cnd.UpdatedAt.After(updated) {
			updated = cnd.UpdatedAt
		}

		items = append(items, ConditionItem{
			DayOfWeek: cnd.DayOfWeek,
			Start:     cnd.StartTime.Format("15:04"),
			End:       cnd.EndTime.Format("15:04"),
		})
	}

	resp := ConditionResponse{
		UserID:        user.ID,
		Code:          user.Username,
		Fullname:      fmt.Sprintf("%s%s %s", user.Title.Title, user.Firstname, user.Lastname),
		Major:         user.Major.MajorName,
		Email:         user.Email,
		Phone:         user.PhoneNumber,
		ItemCount:     len(items),
		Conditions:    items,
		CreatedAt:     created.Format("2/1/2006"),
		LastUpdatedAt: updated.Format("2/1/2006"),
	}

	c.JSON(http.StatusOK, resp)
}

func DeleteConditionsByUser(c *gin.Context) {
	uid, err := strconv.Atoi(c.Param("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userID ไม่ถูกต้อง"})
		return
	}

	if err := config.DB().
		Where("user_id = ?", uid).
		Delete(&entity.Condition{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบเงื่อนไขเวลาที่ไม่ว่างทั้งหมดเรียบร้อย"})
}
