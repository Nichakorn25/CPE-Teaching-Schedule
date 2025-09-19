import React, { useState, useEffect } from "react";
import {
  getAllTeachingAssistants,
  deleteTeachingAssistant,
} from "../../../services/https/AdminPageServices";
import { TeachingAssistantInterface } from "../../../interfaces/TeachingAssistant";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Button, Table, Input, Select, message } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

interface AssistanceTableData extends TeachingAssistantInterface {
  key: string;
  order: number;
}

const AssistanceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assistanceData, setAssistanceData] = useState<
    TeachingAssistantInterface[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  // Monitor container width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine responsive breakpoints
  const isSmallScreen = containerWidth < 1400;
  const isMobile = containerWidth < 768;

  const fetchAllAssistants = async () => {
    try {
      setLoading(true);
      const response = await getAllTeachingAssistants();

      if (response.status === 200 && Array.isArray(response.data)) {
        const mappedData: TeachingAssistantInterface[] = response.data
          .filter((item: any) => item.Firstname && item.Lastname)
          .map((item: any, index: number) => ({
            ID: item.ID,
            TitleID: item.TitleID,
            Title: item.Title,
            Firstname: item.Firstname,
            Lastname: item.Lastname,
            Email: item.Email,
            PhoneNumber: item.PhoneNumber,
            ScheduleTeachingAssistant: [],
          }));
        setAssistanceData(mappedData);
      } else {
        console.error("โหลดข้อมูลรายชื่อผู้ช่วยสอนไม่สำเร็จ", response);
        message.error("ไม่สามารถโหลดข้อมูลผู้ช่วยสอนได้");
      }
    } catch (error) {
      console.error("Error fetching teaching assistants:", error);
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAssistants();
  }, []);

  // Filter data based on search text
  const filteredAssistants = assistanceData.filter((assistant) => {
    const matchesSearch =
      assistant.Firstname?.toLowerCase().includes(searchText.toLowerCase()) ||
      assistant.Lastname?.toLowerCase().includes(searchText.toLowerCase()) ||
      assistant.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
      assistant.PhoneNumber?.toLowerCase().includes(searchText.toLowerCase());

    return matchesSearch;
  });

  const tableData: AssistanceTableData[] = filteredAssistants.map(
    (assistant, index) => ({
      ...assistant,
      key: assistant.ID?.toString() || `${index}`,
      order: 0, // placeholder, real order in currentData
    })
  );

  // Calculate pagination
  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const currentData: AssistanceTableData[] = tableData
    .slice(startIndex, endIndex)
    .map((assistant, index) => ({
      ...assistant,
      order: startIndex + index + 1, // actual order
    }));

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDeleteAssistance = async (
    deleteID: number,
    fullName: string,
    title: string
  ) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: `คุณต้องการลบ ${title} ${fullName} หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f26522",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const loadingMessage = message.loading("กำลังลบข้อมูล...", 0);
        const response = await deleteTeachingAssistant(deleteID);
        loadingMessage();

        if (response.status === 200) {
          message.success(`ลบ ${title} ${fullName} สำเร็จ`);
          setAssistanceData((prev) =>
            prev.filter((assistant) => assistant.ID !== deleteID)
          );

          if (currentData.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          const errorMsg = response.data?.error || "ไม่สามารถลบผู้ช่วยสอนได้";
          message.error(`เกิดข้อผิดพลาด: ${errorMsg}`);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  // Responsive columns configuration
  const getColumns = (): ColumnsType<AssistanceTableData> => {
    if (isMobile) {
      // Mobile layout - Show only essential columns
      return [
        {
          title: "#",
          dataIndex: "order",
          key: "order",
          width: 40,
          align: "center",
          render: (value: number) => (
            <span style={{ fontWeight: "bold", fontSize: "10px" }}>
              {value}
            </span>
          ),
        },
        {
          title: "ผู้ช่วยสอน",
          key: "assistant",
          width: 140,
          render: (_, record: AssistanceTableData) => (
            <div style={{ fontSize: "11px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1890ff",
                  marginBottom: "2px",
                }}
              >
                {record.Title?.Title || "-"}
              </div>
              <div style={{ fontWeight: "500" }}>
                {record.Firstname} {record.Lastname}
              </div>
              <div style={{ color: "#666", fontSize: "9px" }}>
                {record.PhoneNumber}
              </div>
            </div>
          ),
        },
        {
          title: "ติดต่อ",
          key: "contact",
          width: 100,
          render: (_, record: AssistanceTableData) => (
            <div style={{ fontSize: "10px" }}>
              <div style={{ marginBottom: "2px" }}>
                <a href={`mailto:${record.Email}`} style={{ color: "#1890ff" }}>
                  📧
                </a>
              </div>
              <div>
                <a
                  href={`tel:${record.PhoneNumber}`}
                  style={{ color: "#1890ff" }}
                >
                  📞
                </a>
              </div>
            </div>
          ),
        },
        {
          title: "จัดการ",
          key: "action",
          width: 70,
          align: "center",
          render: (_, record: AssistanceTableData) => (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <Button
                size="small"
                style={{
                  backgroundColor: "#F26522",
                  borderColor: "#F26522",
                  color: "white",
                  fontSize: "9px",
                  padding: "1px 4px",
                  height: "20px",
                  lineHeight: "18px",
                }}
                onClick={() => navigate(`/manage-assistance/${record.ID}`)}
                title="แก้ไขข้อมูล"
              >
                แก้ไข
              </Button>
              <Button
                size="small"
                style={{
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                  color: "white",
                  fontSize: "9px",
                  padding: "1px 4px",
                  height: "20px",
                  lineHeight: "18px",
                }}
                onClick={() =>
                  handleDeleteAssistance(
                    record.ID,
                    `${record.Firstname} ${record.Lastname}`,
                    record.Title?.Title || ""
                  )
                }
                title="ลบข้อมูล"
              >
                ลบ
              </Button>
            </div>
          ),
        },
      ];
    }

    // Desktop/Tablet layout
    const columns: ColumnsType<AssistanceTableData> = [
      {
        title: "ลำดับ",
        dataIndex: "order",
        key: "order",
        width: 60,
        align: "center",
        render: (value: number) => (
          <span style={{ fontWeight: "bold" }}>{value}</span>
        ),
      },
      {
        title: "คำนำหน้า",
        dataIndex: "Title",
        key: "Title",
        width: 120,
        render: (value: any) => (
          <span style={{ fontWeight: "bold", color: "#1890ff" }}>
            {value?.Title || "-"}
          </span>
        ),
      },
      {
        title: "ชื่อ-นามสกุล",
        key: "fullname",
        width: 200,
        render: (_, record: AssistanceTableData) => (
          <span style={{ fontWeight: "500" }}>
            {record.Firstname} {record.Lastname}
          </span>
        ),
      },
    ];

    // Add email column
    columns.push({
      title: "อีเมล",
      dataIndex: "Email",
      key: "Email",
      width: isSmallScreen ? 180 : 220,
      render: (value: string) => (
        <a
          href={`mailto:${value}`}
          style={{ color: "#1890ff", fontSize: "12px" }}
        >
          {value}
        </a>
      ),
    });

    // Add phone number column
    columns.push({
      title: "หมายเลขโทรศัพท์",
      dataIndex: "PhoneNumber",
      key: "PhoneNumber",
      width: isSmallScreen ? 140 : 160,
      align: "center",
      render: (value: string) => (
        <a href={`tel:${value}`} style={{ color: "#1890ff", fontSize: "12px" }}>
          {value}
        </a>
      ),
    });

    // Add action column
    columns.push({
      title: "จัดการ",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record: AssistanceTableData) => (
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: "#F26522",
              borderColor: "#F26522",
              color: "white",
              fontSize: "11px",
              padding: "2px 8px",
              height: "auto",
            }}
            onClick={() => navigate(`/manage-assistance/${record.ID}`)}
            title="แก้ไขข้อมูล"
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
              fontSize: "11px",
              padding: "2px 8px",
              height: "auto",
            }}
            onClick={() =>
              handleDeleteAssistance(
                record.ID,
                `${record.Firstname} ${record.Lastname}`,
                record.Title?.Title || ""
              )
            }
            title="ลบข้อมูล"
          >
            ลบ
          </Button>
        </div>
      ),
    });

    return columns;
  };

  return (
    <div
      style={{
        fontFamily: "Sarabun, sans-serif",
        padding: 0,
        margin: 0,
      }}
    >
      {/* Page Title */}
      <div
        style={{
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "2px solid #F26522",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            color: "#333",
            fontSize: isMobile ? "18px" : "20px",
            fontWeight: "bold",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          รายชื่อผู้ช่วยสอน
        </h2>
        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: isMobile ? "12px" : "13px",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          จัดการข้อมูลผู้ช่วยสอนทุกคน สำหรับการบริหารจัดการระบบ
        </p>
      </div>

      {/* Controls Section */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            padding: isMobile ? "8px 12px" : "12px 16px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            minHeight: "48px",
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? "8px" : "12px",
          }}
        >
          {/* Search controls */}
          <Input
            placeholder="ค้นหาผู้ช่วยสอน..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: isMobile ? "100%" : 200,
              fontFamily: "Sarabun, sans-serif",
            }}
            size="small"
          />

          {/* Pagination controls for desktop */}
          {!isMobile && (
            <>
              <span
                style={{
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  color: "#666",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                รายการที่แสดง
              </span>
              <Select
                value={pageSize.toString()}
                style={{
                  width: 50,
                  fontFamily: "Sarabun, sans-serif",
                }}
                size="small"
                onChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <Option value="5">5</Option>
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
              </Select>

              {/* Page numbers */}
              {totalPages > 1 && (
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  {[1, 2, 3, 4, 5].map(
                    (page) =>
                      page <= totalPages && (
                        <span
                          key={page}
                          style={{
                            backgroundColor:
                              currentPage === page ? "#F26522" : "transparent",
                            color: currentPage === page ? "white" : "#666",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            fontSize: "11px",
                            fontWeight:
                              currentPage === page ? "bold" : "normal",
                            minWidth: "18px",
                            textAlign: "center",
                            cursor: "pointer",
                            display: "inline-block",
                            fontFamily: "Sarabun, sans-serif",
                          }}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </span>
                      )
                  )}
                  {totalPages > 5 && (
                    <span
                      style={{
                        color: "#666",
                        fontSize: "11px",
                        fontFamily: "Sarabun, sans-serif",
                      }}
                    >
                      ... {totalPages}
                    </span>
                  )}
                </div>
              )}

              <div style={{ flex: 1 }}></div>
            </>
          )}

          {/* Add Assistant Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/manage-assistance")}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              fontSize: "12px",
              width: isMobile ? "100%" : "auto",
              fontFamily: "Sarabun, sans-serif",
            }}
            size="small"
          >
            เพิ่มผู้ช่วยสอน
          </Button>
        </div>

        {/* Mobile pagination */}
        {isMobile && totalPages > 1 && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Select
              value={pageSize.toString()}
              style={{
                width: 70,
                fontFamily: "Sarabun, sans-serif",
              }}
              size="small"
              onChange={(value) => handlePageSizeChange(parseInt(value))}
            >
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="20">20</Option>
            </Select>

            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <Button
                size="small"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ fontFamily: "Sarabun, sans-serif" }}
              >
                ←
              </Button>
              <span
                style={{
                  fontSize: "12px",
                  padding: "0 8px",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                {currentPage}/{totalPages}
              </span>
              <Button
                size="small"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ fontFamily: "Sarabun, sans-serif" }}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
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
          style={{
            fontSize: isMobile ? "11px" : "12px",
            fontFamily: "Sarabun, sans-serif",
          }}
          locale={{
            emptyText: (
              <div
                style={{
                  padding: isMobile ? "20px" : "40px",
                  textAlign: "center",
                  color: "#999",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? "32px" : "48px",
                    marginBottom: "16px",
                  }}
                >
                  👨‍🎓
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "14px" : "16px",
                    marginBottom: "8px",
                  }}
                >
                  ไม่พบข้อมูลผู้ช่วยสอน
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "12px" : "14px",
                    color: "#ccc",
                  }}
                >
                  ยังไม่มีข้อมูลผู้ช่วยสอนในระบบ
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "16px",
          padding: isMobile ? "8px 12px" : "12px 16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          border: "1px solid #e9ecef",
          fontSize: isMobile ? "11px" : "12px",
          color: "#666",
          fontFamily: "Sarabun, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "8px" : "0",
          }}
        >
          <div>
            💡 <strong>หมายเหตุ:</strong>{" "}
            ข้อมูลผู้ช่วยสอนเหล่านี้ใช้สำหรับการจัดการระบบตารางเรียน
          </div>
          <div>
            ข้อมูลล่าสุด: {new Date().toLocaleString("th-TH")} |
            <span
              style={{
                marginLeft: "8px",
                cursor: "pointer",
                color: "#F26522",
                fontWeight: "500",
              }}
              onClick={fetchAllAssistants}
              title="รีเฟรชข้อมูล"
            >
              🔄 รีเฟรช
            </span>
          </div>
        </div>
      </div>

      {/* Additional Info for Mobile */}
      {isMobile && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            backgroundColor: "#fff3cd",
            borderRadius: "6px",
            border: "1px solid #ffeaa7",
            fontSize: "11px",
            color: "#856404",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            💡 เคล็ดลับการใช้งาน:
          </div>
          <div>• คลิกที่ชื่อผู้ช่วยสอนเพื่อดูรายละเอียดเพิ่มเติม</div>
          <div>• หมุนหน้าจอเป็นแนวนอนเพื่อดูข้อมูลเพิ่มเติม</div>
          <div>• ใช้การค้นหาเพื่อหาผู้ช่วยสอนที่ต้องการได้เร็วขึ้น</div>
          <div>• กดปุ่ม "เพิ่มผู้ช่วยสอน" เพื่อเพิ่มข้อมูลใหม่</div>
          <div>• คลิกที่อีเมลหรือเบอร์โทรเพื่อติดต่อโดยตรง</div>
        </div>
      )}
    </div>
  );
};

export default AssistanceList;