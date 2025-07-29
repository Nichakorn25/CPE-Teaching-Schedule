package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Nichakorn25/CPE-Teaching-Schedule/config"	
	"github.com/Nichakorn25/CPE-Teaching-Schedule/entity"
)

func GetAllDepartment(c *gin.Context) {
	var departments []entity.Department

	err := config.DB().Preload("Majors").Find(&departments).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลแผนกได้"})
		return
	}

	type DepartmentResp struct {
		ID             uint
		DepartmentName string
		Majors         []string
	}

	resp := make([]DepartmentResp, 0, len(departments))
	for _, d := range departments {
		majors := make([]string, len(d.Majors))
		for i, m := range d.Majors {
			majors[i] = m.MajorName
		}

		resp = append(resp, DepartmentResp{
			ID:             d.ID,
			DepartmentName: d.DepartmentName,
			Majors:         majors,
		})
	}

	c.JSON(http.StatusOK, resp)
}
