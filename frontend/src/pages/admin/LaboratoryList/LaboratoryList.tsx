import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Dropdown, Menu, message, Select } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getLaboratory } from "../../../services/https/GetService";
import { deleteLaboratory } from "../../../services/https/AdminPageServices";

const { Option } = Select;

interface Laboratory {
  ID: number;
  Room: string;
  Building: string;
  Capacity: string;
  Code?: string;
  Name?: string;
  Category?: string;
}

interface LabTableData extends Laboratory {
  key: string;
  order: number;
}

const LaboratoryList: React.FC = () => {
  const navigate = useNavigate();
  const [labData, setLabData] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchRoom, setSearchRoom] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const isMobile = containerWidth < 768;
  const isSmallScreen = containerWidth < 1400;

  // Handle resize
  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch data
  const fetchLaboratory = async () => {
    try {
      setLoading(true);
      const response = await getLaboratory();
      if (response.status === 200 && Array.isArray(response.data)) {
        setLabData(response.data);
      } else {
        message.error("ไม่สามารถโหลดข้อมูลห้องปฏิบัติการได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลห้องปฏิบัติการ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaboratory();
  }, []);

  const handleDeleteLab = async (labId: number, room: string) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: `คุณต้องการลบห้องปฏิบัติการ ${room} หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f26522",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const loadingMsg = message.loading("กำลังลบข้อมูล...", 0);

        const response = await deleteLaboratory(String(labId));

        loadingMsg();

        if (response.status === 200 || response.status === 204) {
          await Swal.fire({
            icon: "success",
            title: "ลบสำเร็จ",
            text: `ลบห้องปฏิบัติการ ${room} เรียบร้อยแล้ว`,
            confirmButtonText: "ตกลง",
          });

          setLabData((prev) => prev.filter((l) => l.ID !== labId));
          if (currentPage > 1 && labData.length === 1)
            setCurrentPage(currentPage - 1);
        } else {
          await Swal.fire({
            icon: "error",
            title: "ลบไม่สำเร็จ",
            text: "ไม่สามารถลบห้องปฏิบัติการได้",
            confirmButtonText: "ตกลง",
          });
        }
      } catch (error) {
        console.error("Delete error:", error);
        await Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่",
          confirmButtonText: "ตกลง",
        });
      }
    }
  };

  // Sort Dropdown
  const sortMenu = (
    <Menu
      onClick={(e) => {
        const key = e.key;
        let sortedData = [...labData];
        if (key === "building")
          sortedData.sort((a, b) => a.Building.localeCompare(b.Building));
        if (key === "room")
          sortedData.sort((a, b) => a.Room.localeCompare(b.Room));
        setLabData(sortedData);
      }}
      items={[
        { label: "อาคาร", key: "building", icon: <SortAscendingOutlined /> },
        { label: "ชื่อห้อง", key: "room", icon: <SortAscendingOutlined /> },
      ]}
    />
  );

  // Filter + Search
  const filteredLabs = labData.filter((lab) =>
    lab.Room.toLowerCase().includes(searchRoom.toLowerCase())
  );

  const tableData: LabTableData[] = filteredLabs.map((lab, index) => ({
    ...lab,
    key: lab.ID.toString(),
    order: (currentPage - 1) * pageSize + index + 1,
  }));

  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = tableData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Columns
  const getColumns = (): ColumnsType<LabTableData> => {
    if (isMobile) {
      return [
        {
          title: "ลำดับ",
          dataIndex: "order",
          key: "order",
          width: 40,
          align: "center",
          render: (v: number) => (
            <span style={{ fontWeight: "bold", fontSize: "10px" }}>{v}</span>
          ),
        },
        {
          title: "ห้องปฏิบัติการ",
          key: "laboratory",
          width: 160,
          render: (_, record) => (
            <div style={{ fontSize: "11px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1890ff",
                  marginBottom: "2px",
                }}
              >
                {record.Room}
              </div>
              <div style={{ fontWeight: 500, color: "#666" }}>
                {record.Building}
              </div>
              <div style={{ color: "#999", fontSize: "9px" }}>
                ความจุ: {record.Capacity} คน
              </div>
            </div>
          ),
        },
        {
          title: "จัดการ",
          key: "action",
          width: 70,
          align: "center",
          render: (_, record) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                size="small"
                style={{
                  backgroundColor: "#F26522",
                  borderColor: "#F26522",
                  color: "white",
                  fontSize: 9,
                  padding: "1px 4px",
                  height: 20,
                  lineHeight: "18px",
                }}
                onClick={() => navigate(`/manage-lab/${record.ID}`)}
              >
                แก้ไข
              </Button>
              <Button
                size="small"
                style={{
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                  color: "white",
                  fontSize: 9,
                  padding: "1px 4px",
                  height: 20,
                  lineHeight: "18px",
                }}
                onClick={() => handleDeleteLab(record.ID, record.Room)}
              >
                ลบ
              </Button>
            </div>
          ),
        },
      ];
    }

    // Desktop / Tablet
    const columns: ColumnsType<LabTableData> = [
      {
        title: "ลำดับ",
        dataIndex: "order",
        key: "order",
        width: 60,
        align: "center",
        render: (v: number) => <span style={{ fontWeight: "bold" }}>{v}</span>,
      },
      {
        title: "อาคาร",
        dataIndex: "Building",
        key: "Building",
        width: isSmallScreen ? 150 : 200,
        sorter: (a, b) => a.Building.localeCompare(b.Building),
        render: (value: string) => (
          <span style={{ fontWeight: "bold", color: "#1890ff" }}>{value}</span>
        ),
      },
      {
        title: "ชื่อห้อง",
        dataIndex: "Room",
        key: "Room",
        width: isSmallScreen ? 120 : 150,
        sorter: (a, b) => a.Room.localeCompare(b.Room),
        render: (value: string) => (
          <span style={{ fontWeight: 500 }}>{value}</span>
        ),
      },
      {
        title: "ความจุ",
        dataIndex: "Capacity",
        key: "Capacity",
        width: 100,
        sorter: (a, b) => parseInt(a.Capacity) - parseInt(b.Capacity),
        align: "center",
        render: (value: string) => `${value} คน`,
      },
      {
        title: "จัดการ",
        key: "action",
        width: 120,
        align: "center",
        render: (_, record) => (
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <Button
              size="small"
              icon={<EditOutlined />}
              style={{
                backgroundColor: "#F26522",
                borderColor: "#F26522",
                color: "white",
                fontSize: 11,
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={() => navigate(`/manage-lab/${record.ID}`)}
            >
              แก้ไข
            </Button>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: "#ff4d4f",
                borderColor: "#ff4d4f",
                color: "white",
                fontSize: 11,
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={() => handleDeleteLab(record.ID, record.Room)}
            >
              ลบ
            </Button>
          </div>
        ),
      },
    ];

    return columns;
  };

  // Pagination function similar to TeacherList
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPaginationRange = () => {
      const delta = 2;
      const rangeWithDots = [];

      const start = Math.max(1, currentPage - delta);
      const end = Math.min(totalPages, currentPage + delta);

      if (start > 1) {
        rangeWithDots.push(1);
        if (start > 2) {
          rangeWithDots.push('...');
        }
      }

      for (let i = start; i <= end; i++) {
        rangeWithDots.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const paginationRange = getPaginationRange();

    return (
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <span
          style={{
            backgroundColor: currentPage === 1 ? "#f5f5f5" : "#F26522",
            color: currentPage === 1 ? "#ccc" : "white",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "11px",
            fontWeight: "bold",
            minWidth: "18px",
            textAlign: "center",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            display: "inline-block",
            fontFamily: "Sarabun, sans-serif",
          }}
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        >
          ‹
        </span>

        {paginationRange.map((page, index) => {
          if (page === '...') {
            return (
              <span 
                key={`dots-${index}`} 
                style={{ 
                  color: "#666", 
                  fontSize: "11px", 
                  padding: "2px 6px",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                ...
              </span>
            );
          }

          return (
            <span
              key={page}
              style={{
                backgroundColor: currentPage === page ? "#F26522" : "transparent",
                color: currentPage === page ? "white" : "#666",
                padding: "2px 6px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: currentPage === page ? "bold" : "normal",
                minWidth: "18px",
                textAlign: "center",
                cursor: "pointer",
                display: "inline-block",
                fontFamily: "Sarabun, sans-serif",
              }}
              onClick={() => handlePageChange(page as number)}
            >
              {page}
            </span>
          );
        })}

        <span
          style={{
            backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#F26522",
            color: currentPage === totalPages ? "#ccc" : "white",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "11px",
            fontWeight: "bold",
            minWidth: "18px",
            textAlign: "center",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            display: "inline-block",
            fontFamily: "Sarabun, sans-serif",
          }}
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        >
          ›
        </span>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Sarabun, sans-serif", padding: 0, margin: 0 }}>
      {/* Page Title */}
      <div
        style={{
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: "2px solid #F26522",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            color: "#333",
            fontSize: isMobile ? 18 : 20,
            fontWeight: "bold",
          }}
        >
          รายการห้องปฏิบัติการ
        </h2>
        <p style={{ margin: 0, color: "#666", fontSize: isMobile ? 12 : 13 }}>
          จัดการข้อมูลห้องปฏิบัติการทั้งหมด สำหรับการบริหารจัดการระบบตารางเรียน
        </p>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            padding: isMobile ? "8px 12px" : "12px 16px",
            borderRadius: 8,
            border: "1px solid #e9ecef",
            minHeight: 48,
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? 8 : 12,
          }}
        >
          <Dropdown overlay={sortMenu} placement="bottomLeft">
            <Button size="small" icon={<SortAscendingOutlined />}>
              เรียงลำดับ
            </Button>
          </Dropdown>

          <Input
            placeholder="ค้นหาชื่อห้อง..."
            prefix={<SearchOutlined />}
            value={searchRoom}
            onChange={(e) => setSearchRoom(e.target.value)}
            style={{ width: isMobile ? "100%" : 200 }}
            size="small"
          />

          {!isMobile && (
            <>
              <span
                style={{ whiteSpace: "nowrap", fontSize: 12, color: "#666" }}
              >
                รายการที่แสดง
              </span>
              <Select
                value={pageSize.toString()}
                style={{ width: 50 }}
                size="small"
                onChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <Option value="5">5</Option>
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
              </Select>

              {renderPagination()}

              <div style={{ flex: 1 }} />
            </>
          )}

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/manage-lab")}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              fontSize: 12,
            }}
            size="small"
          >
            เพิ่มห้องปฏิบัติการ
          </Button>
        </div>

        {/* Mobile pagination */}
        {isMobile && totalPages > 1 && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              backgroundColor: "#f8f9fa",
              borderRadius: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Select
              value={pageSize.toString()}
              style={{ width: 70 }}
              size="small"
              onChange={(value) => handlePageSizeChange(parseInt(value))}
            >
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="20">20</Option>
            </Select>

            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Button
                size="small"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ←
              </Button>
              <span style={{ fontSize: 12, padding: "0 8px" }}>
                {currentPage}/{totalPages}
              </span>
              <Button
                size="small"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <Table
          columns={getColumns()}
          dataSource={currentData}
          pagination={false}
          size="small"
          bordered
          scroll={{
            x: isMobile ? 350 : isSmallScreen ? 800 : 1200,
            y: isMobile ? 400 : 600,
          }}
          loading={loading}
          style={{ fontSize: isMobile ? 11 : 12 }}
          locale={{
            emptyText: (
              <div
                style={{
                  padding: isMobile ? 20 : 40,
                  textAlign: "center",
                  color: "#999",
                }}
              >
                <div style={{ fontSize: isMobile ? 32 : 48, marginBottom: 16 }}>
                  🏫
                </div>
                <div style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>
                  ไม่พบข้อมูลห้องปฏิบัติการ
                </div>
                <div style={{ fontSize: isMobile ? 12 : 14, color: "#ccc" }}>
                  ยังไม่มีข้อมูลห้องปฏิบัติการในระบบ
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 16,
          padding: isMobile ? "8px 12px" : "12px 16px",
          backgroundColor: "#f8f9fa",
          borderRadius: 6,
          border: "1px solid #e9ecef",
          fontSize: isMobile ? 11 : 12,
          color: "#666",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 8 : 0,
          }}
        >
          <div>
            💡 <strong>หมายเหตุ:</strong>{" "}
            ข้อมูลห้องปฏิบัติการเหล่านี้ใช้สำหรับการบริหารจัดการระบบตารางเรียน
          </div>
          <div>
            ข้อมูลล่าสุด: {new Date().toLocaleString("th-TH")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryList;