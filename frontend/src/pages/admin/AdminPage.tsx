import React, { useEffect, useState } from "react";
import { GetAllChangePassword, NewPass } from "../../services/https/index";
import { NewPassInterface, ChangePassInterface } from "../../interfaces/ChangePass";

function ChangePasswordApproval() {
  const [changeRequests, setChangeRequests] = useState<ChangePassInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedIds, setApprovedIds] = useState<string[]>([]); // 🆕 เก็บรายการที่อนุมัติแล้ว

  const fetchChangeRequests = async () => {
    setLoading(true);
    try {
      const res = await GetAllChangePassword();
      if (res.status === 200 && Array.isArray(res.data)) {
        setChangeRequests(res.data);
      } else {
        setChangeRequests([]);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
      setChangeRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChangeRequests();
  }, []);

  const handleApprove = async (usernameID?: string) => {
    if (!usernameID) {
      alert("ไม่พบ UsernameID");
      return;
    }

    const res = await NewPass(usernameID);
    if (res.status === 200) {
      alert("อัปเดตรหัสผ่านสำเร็จ");
      setApprovedIds((prev) => [...prev, usernameID]);
      fetchChangeRequests();
    } else {
      alert("เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
      console.error(res.data);
    }
  };

  if (loading) return <div className="text-center mt-10">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">คำขอเปลี่ยนรหัสผ่าน</h1>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">รหัสพนักงาน</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">ชื่อ - นามสกุล</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">อีเมล</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">สถานะ</th>
              <th className="px-4 py-2 text-left text-sm font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {changeRequests.length > 0 ? (
              changeRequests.map((item, index) => {
                const isApproved = approvedIds.includes(item.UsernameID ?? "");
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.UsernameID}</td>
                    <td className="px-4 py-2 text-sm">{`${item.FirstName} ${item.LastName}`}</td>
                    <td className="px-4 py-2 text-sm">{item.Email}</td>
                    <td className="px-4 py-2 text-sm">{item.StatusName}</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => handleApprove(item.UsernameID)}
                        disabled={isApproved}
                        className={`px-4 py-1 rounded-md transition text-white ${isApproved ? "bg-[#AAAAAA] cursor-not-allowed" : "bg-[#FF6314] hover:bg-green-600"
                          }`}
                      >
                        อนุญาต
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500 text-sm">
                  ไม่มีคำขอเปลี่ยนรหัสผ่าน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ChangePasswordApproval;

