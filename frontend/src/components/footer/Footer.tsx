import React from "react";

function Footer() {
  return (
    <footer className="w-full bg-[#5d7285] text-gray-700 py-10 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-6 text-sm md:text-base">
        {/* ส่วนที่ 1 - ใหญ่กว่าส่วนอื่น */}
        <div className="space-y-2 leading-relaxed">
          <h2 className="text-orange-600 text-lg font-semibold">สำนักวิชาวิศวกรรมศาสตร์</h2>
          <p>อาคารปฏิบัติการ ชั้น 3 ห้องปฏิบัติการปัญญาประดิษฐ์</p>
          <p>มหาวิทยาลัยเทคโนโลยีสุรนารี</p>
          <p>อ.เมือง จ.นครราชสีมา 30000</p>
        </div>
  
        {/* ส่วนที่ 2 */}
        <div className="space-y-2 leading-relaxed">
          <h2 className="text-orange-600 text-lg font-semibold">ข้อมูลติดต่อ</h2>
          <p className="underline cursor-pointer hover:text-orange-600">เฟซบุ๊กสำนักวิชา</p>
          <p className="underline cursor-pointer hover:text-orange-600">โทรศัพท์ สำนักวิชา</p>
          <p className="underline cursor-pointer hover:text-orange-600">โทรศัพท์ เลขาสำนักวิชา</p>
        </div>
  
        {/* ส่วนที่ 3 */}
        <div className="space-y-2 leading-relaxed">
          <h2 className="text-orange-600 text-lg font-semibold">โทรศัพท์ติดต่อ</h2>
          <p>โทรศัพท์: 044-223000</p>
        </div>
      </div>
    </footer>
  );  
}
export default Footer;