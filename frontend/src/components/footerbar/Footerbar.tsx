import React from "react";

const Footerbar: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-screen-xl mx-auto px-4 flex justify-between">

        <div className="w-1/3">
          <h4 className="text-lg font-semibold mb-4">รายละเอียด</h4>
          <p className="text-sm">
            เกี่ยวกับบริษัทหรือข้อมูลเพิ่มเติมที่นี่
          </p>
          <p className="text-sm">
            สามารถเพิ่มลิงก์หรือเนื้อหาที่เกี่ยวข้องกับบริษัทได้ที่นี่
          </p>
        </div>

        <div className="w-1/3">
          <h4 className="text-lg font-semibold mb-4">ข้อมูลติดต่อ</h4>
          <p className="text-sm">Email: contact@example.com</p>
          <p className="text-sm">Phone: +66 123 456 789</p>
        </div>

        <div className="w-1/3">
          <h4 className="text-lg font-semibold mb-4">ที่อยู่</h4>
          <p className="text-sm">123 ถนนตัวอย่าง, เขตกรุงเทพฯ, ประเทศไทย</p>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          className="bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 focus:outline-none transition duration-300"
          onClick={scrollToTop}
        >
          ↑ ขึ้นไปข้างบน
        </button>
      </div>
    </footer>
  );
};

export default Footerbar;
