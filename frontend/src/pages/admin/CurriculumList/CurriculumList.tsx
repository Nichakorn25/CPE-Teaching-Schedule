import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Dropdown, Menu, message } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getAllCurriculum } from "../../../services/https/GetService";

interface Department {
  ID: number;
  DepartmentName: string;
}

interface Major {
  ID: number;
  MajorName: string;
  Department: Department;
}

interface Curriculum {
  ID: number;
  CurriculumName: string;
  Year: number;
  Started: number;
  Major: Major;
}

interface CurriculumTableData extends Curriculum {
  key: string;
  order: number;
}

const CurriculumList: React.FC = () => {
  const navigate = useNavigate();
  const [curriculumData, setCurriculumData] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const isMobile = containerWidth < 768;

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Fetch data ──
  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const response = await getAllCurriculum();
      if (response.status === 200 && Array.isArray(response.data)) {
        setCurriculumData(response.data);
      } else {
        message.error("ไม่สามารถโหลดข้อมูลหลักสูตรได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลหลักสูตร");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  // ── Sort Dropdown ──
  const sortMenu = (
    <Menu
      onClick={(e) => {
        const key = e.key;
        let sortedData = [...curriculumData];
        if (key === "name")
          sortedData.sort((a, b) =>
            a.CurriculumName.localeCompare(b.CurriculumName)
          );
        if (key === "department")
          sortedData.sort((a, b) =>
            a.Major.Department.DepartmentName.localeCompare(
              b.Major.Department.DepartmentName
            )
          );
        if (key === "major")
          sortedData.sort((a, b) =>
            a.Major.MajorName.localeCompare(b.Major.MajorName)
          );
        setCurriculumData(sortedData);
      }}
      items={[
        { label: "ชื่อหลักสูตร", key: "name", icon: <SortAscendingOutlined /> },
        { label: "สำนัก", key: "department", icon: <SortAscendingOutlined /> },
        { label: "สาขา", key: "major", icon: <SortAscendingOutlined /> },
      ]}
    />
  );

  // ── Filter + Search ──
  const filteredCurriculums = curriculumData.filter((cur) =>
    cur.CurriculumName.toLowerCase().includes(searchName.toLowerCase())
  );

  const tableData: CurriculumTableData[] = filteredCurriculums.map(
    (cur, index) => ({
      ...cur,
      key: cur.ID.toString(),
      order: (currentPage - 1) * pageSize + index + 1,
    })
  );

  const totalPages = Math.ceil(tableData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = tableData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ── Columns ──
  const columns: ColumnsType<CurriculumTableData> = [
    {
      title: "ลำดับ",
      dataIndex: "order",
      key: "order",
      width: 60,
      align: "center",
    },
    {
      title: "ชื่อหลักสูตร",
      dataIndex: "CurriculumName",
      key: "CurriculumName",
      width: 300,
      sorter: (a, b) => a.CurriculumName.localeCompare(b.CurriculumName),
    },
    {
      title: "สำนักของหลักสูตร",
      key: "Department",
      dataIndex: ["Major", "Department", "DepartmentName"],
      width: 250,
      sorter: (a, b) =>
        a.Major.Department.DepartmentName.localeCompare(
          b.Major.Department.DepartmentName
        ),
    },
    {
      title: "สาขาของหลักสูตร",
      key: "Major",
      dataIndex: ["Major", "MajorName"],
      width: 250,
      sorter: (a, b) => a.Major.MajorName.localeCompare(b.Major.MajorName),
    },
    {
      title: "จัดการ",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          style={{
            backgroundColor: "#F26522",
            borderColor: "#F26522",
            color: "white",
          }}
          onClick={() => navigate(`/manage-curriculum/${record.ID}`)}
        >
          แก้ไข
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, fontFamily: "Sarabun, sans-serif" }}>
      {/* ── Top controls ── */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* ปุ่มเรียงลำดับ */}
        <Dropdown overlay={sortMenu} placement="bottomLeft">
          <Button size="small" icon={<SortAscendingOutlined />}>
            เรียงลำดับ
          </Button>
        </Dropdown>

        {/* ช่องค้นหา */}
        <div style={{ flexGrow: 1, margin: "0 12px" }}>
          <Input
            placeholder="ค้นหาชื่อหลักสูตร..."
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            size="small"
          />
        </div>

        {/* ปุ่มเพิ่ม */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/manage-curriculum")}
          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          size="small"
        >
          เพิ่มหลักสูตร
        </Button>
      </div>

      {/* ── Table ── */}
      <Table
        columns={columns}
        dataSource={currentData}
        pagination={false}
        loading={loading}
        scroll={{ x: 900, y: isMobile ? 400 : 600 }}
      />

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Button
            size="small"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ←
          </Button>
          <span>
            {currentPage}/{totalPages}
          </span>
          <Button
            size="small"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            →
          </Button>
          <Input
            type="number"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            style={{ width: 60 }}
            size="small"
          />
        </div>
      )}
    </div>
  );
};

export default CurriculumList;
