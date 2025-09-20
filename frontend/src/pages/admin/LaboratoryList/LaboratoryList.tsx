import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Dropdown, Menu, message } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getLaboratory } from "../../../services/https/GetService";
import axios from "axios";

interface Laboratory {
  ID: number;
  Room: string;
  Building: string;
  Capacity: string;
  Code?: string; // สำหรับ sort ตัวอย่าง
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

  // ── Handle resize ──
  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Fetch data ──
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

  // ── Delete ──
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
        const response = await axios.delete(`/api/laboratory/${labId}`);
        loadingMsg();

        if (response.status === 200) {
          message.success(`ลบห้องปฏิบัติการ ${room} สำเร็จ`);
          setLabData((prev) => prev.filter((l) => l.ID !== labId));
          if (currentPage > 1 && labData.length === 1)
            setCurrentPage(currentPage - 1);
        } else {
          message.error("ไม่สามารถลบห้องปฏิบัติการได้");
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่");
      }
    }
  };

  // ── Sort Dropdown ──
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

  // ── Filter + Search ──
  const filteredLabs = labData.filter((lab) =>
    lab.Room.toLowerCase().includes(searchRoom.toLowerCase())
  );

  const tableData: LabTableData[] = filteredLabs.map((lab, index) => ({
    ...lab,
    key: lab.ID.toString(),
    order: (currentPage - 1) * pageSize + index + 1,
  }));

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
  const columns: ColumnsType<LabTableData> = [
    {
      title: "ลำดับ",
      dataIndex: "order",
      key: "order",
      width: 60,
      align: "center",
    },
    {
      title: "อาคาร",
      dataIndex: "Building",
      key: "Building",
      width: 200,
      sorter: (a, b) => a.Building.localeCompare(b.Building),
    },
    {
      title: "ชื่อห้อง",
      dataIndex: "Room",
      key: "Room",
      width: 150,
      sorter: (a, b) => a.Room.localeCompare(b.Room),
    },
    {
      title: "ความจุ",
      dataIndex: "Capacity",
      key: "Capacity",
      width: 100,
      sorter: (a, b) => parseInt(a.Capacity) - parseInt(b.Capacity),
      align: "center",
    },
    {
      title: "จัดการ",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: "#F26522",
              borderColor: "#F26522",
              color: "white",
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
            }}
            onClick={() => handleDeleteLab(record.ID, record.Room)}
          >
            ลบ
          </Button>
        </div>
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
            placeholder="ค้นหาชื่อห้อง..."
            prefix={<SearchOutlined />}
            value={searchRoom}
            onChange={(e) => setSearchRoom(e.target.value)}
            size="small"
          />
        </div>

        {/* ปุ่มเพิ่ม */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/manage-lab")}
          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          size="small"
        >
          เพิ่มห้องปฏิบัติการ
        </Button>
      </div>

      {/* ── Table ── */}
      <Table
        columns={columns}
        dataSource={currentData}
        pagination={false}
        loading={loading}
        scroll={{ x: 700, y: isMobile ? 400 : 600 }}
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

export default LaboratoryList;
