import React, { useEffect, useState } from "react";
function ChangePasswordApproval() {
  const [changeRequests, setChangeRequests] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvedIds, setApprovedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchChangeRequests = async () => {
    setLoading(true);
    try {
      const res = await GetAllChangePassword();
      if (res.status === 200 && Array.isArray(res.data)) {
        setChangeRequests(res.data);
        console.log(res.data)
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

  const handleChangePassword = async (id: number) => {
    console.log(id)
    if (!id) {
      alert("ไม่พบ ID");
      return;
    }

    const res = await NewPass(id);
    if (res.status === 200) {
      alert("อัปเดตรหัสผ่านสำเร็จ");
      setApprovedIds((prev) => [...prev, id]);
      fetchChangeRequests();
    } else {
      alert("เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
      console.error(res.data);
    }
  };

  const filteredRequests = changeRequests.filter((item) =>
    (item.UsernameID ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );  

  const totalRequests = changeRequests.length;
  const approvedRequests = changeRequests.filter(item => item.StatusName === "ได้รับการอนุญาตแล้ว").length;
  const pendingRequests = totalRequests - approvedRequests;

  if (loading) return <div className="text-center mt-10">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">อนุมัติคำขอเปลี่ยนรหัสผ่าน</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-2">คำขอทั้งหมด</p>
          <h2 className="text-3xl font-bold text-blue-600">{totalRequests}</h2>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-2">ได้รับการอนุมัติแล้ว</p>
          <h2 className="text-3xl font-bold text-green-600">{approvedRequests}</h2>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-2">รอการอนุมัติ</p>
          <h2 className="text-3xl font-bold text-yellow-600">{pendingRequests}</h2>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 ค้นหาโดยรหัสพนักงาน"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={(e) => e.target.placeholder = ""}
          onBlur={(e) => {
            if (searchQuery.trim() === "") {
              e.target.placeholder = "🔍 ค้นหาโดยรหัสพนักงาน";
            }
          }}
          className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

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
            {filteredRequests.length > 0 ? (
              filteredRequests.map((item, index) => {
                const isApproved = approvedIds.includes(item.ID ?? 0) || item.StatusName === "ได้รับการอนุญาตแล้ว";
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.UsernameID}</td>
                    <td className="px-4 py-2 text-sm">{`${item.FirstName} ${item.LastName}`}</td>
                    <td className="px-4 py-2 text-sm">{item.Email}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.StatusName === "ได้รับการอนุญาตแล้ว"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.StatusName}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => handleChangePassword(item.ID ?? 0)}
                        disabled={isApproved}
                        className={`px-4 py-1 rounded-md transition text-white ${
                          isApproved ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-green-600"
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
