package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

type TermController struct {
	DB *gorm.DB
}

// GetTerms - ดึง Term ทั้งหมด
func (ctl *TermController) GetTerms(c *gin.Context) {
	var terms []entity.Term
	if err := ctl.DB.Preload("YearTerm").Find(&terms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, terms)
}

// GetTermByID - ดึง Term จาก ID
func (ctl *TermController) GetTermByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var term entity.Term
	if err := ctl.DB.Preload("YearTerm").First(&term, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Term not found"})
		return
	}
	c.JSON(http.StatusOK, term)
}

// CreateTerm - สร้าง Term ใหม่
func (ctl *TermController) CreateTerm(c *gin.Context) {
	var input entity.Term
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := ctl.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, input)
}

// UpdateTerm - แก้ไข Term
func (ctl *TermController) UpdateTerm(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var term entity.Term
	if err := ctl.DB.First(&term, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Term not found"})
		return
	}

	var input entity.Term
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	term.Term = input.Term

	if err := ctl.DB.Save(&term).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, term)
}

// DeleteTerm - ลบ Term
func (ctl *TermController) DeleteTerm(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := ctl.DB.Delete(&entity.Term{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
