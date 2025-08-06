import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { ChangePassword } from "../../../services/https/LoginServices";
import { ChangePasswordInterface } from "../../../interfaces/SignIn";
import Swal from "sweetalert2";

const FristChangePassword: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    document.body.classList.add("bg-gray-100");
    const first_password = localStorage.getItem("first_password");
    if (first_password === "true") {
      navigate("/");
    }

    return () => {
      document.body.classList.remove("bg-gray-100");
    };
  }, [navigate]);

  //////////////////// forget password /////////////////////////////////
  const handleReset = async (values: ChangePasswordInterface) => {
    setLoading(true);

    if (!values.NewPassword) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสผ่านใหม่",
        text: "โปรดใส่รหัสผ่านใหม่ก่อนดำเนินการ",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (!values.ConfirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกยืนยันรหัสผ่าน",
        text: "โปรดยืนยันรหัสผ่านก่อนดำเนินการ",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (values.NewPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านสั้นเกินไป",
        text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (values.NewPassword !== values.ConfirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "รหัสผ่านใหม่และยืนยันรหัสผ่านต้องตรงกัน",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (values.ConfirmPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "ยืนยันรหัสผ่านสั้นเกินไป",
        text: "ยืนยันรหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await ChangePassword(values);
      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: "รีเซ็ตรหัสผ่านสำเร็จ",
          confirmButtonColor: "#F26522",
        });
        localStorage.setItem("first_password", "true");
        navigate("/");
      } else if (res?.status === 404) {
        await Swal.fire({
          icon: "error",
          title: "ไม่พบผู้ใช้งาน",
          text: "ไม่พบผู้ใช้งานด้วยอีเมลนี้",
          confirmButtonColor: "#F26522",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "ผิดพลาด",
          text: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
          confirmButtonColor: "#F26522",
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เชื่อมต่อไม่สำเร็จ",
        text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์",
        confirmButtonColor: "#F26522",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
        src="/login.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#5D7285]/70 backdrop-blur-lg border border-[#E7E7E7] rounded-[3rem] p-10 shadow-lg">
          <div className="text-center mb-6 leading-tight">
            <div className="flex justify-center">
              <img src="./key.png" alt="CPE Logo" className="h-14 w-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white tracking-wide mt-4">
              กรุณาเปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัย
            </h2>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const values: ChangePasswordInterface = {
                Email: localStorage.getItem("email") || "",
                NewPassword: formData.get("NewPassword") as string,
                ConfirmPassword: formData.get("ConfirmPassword") as string,
              };

              handleReset(values);
            }}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="NewPassword"
                className="block text-white font-medium pl-4"
              >
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                id="NewPassword"
                name="NewPassword"
                placeholder="🔐 รหัสผ่านใหม่"
                className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
              />
            </div>

            <div>
              <label
                htmlFor="ConfirmPassword"
                className="block text-white font-medium pl-4"
              >
                ยืนยันรหัสผ่าน
              </label>
              <input
                type="password"
                id="ConfirmPassword"
                name="ConfirmPassword"
                placeholder="🔐 ยืนยันรหัสผ่าน"
                className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
              />
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#F26522] text-white font-semibold rounded-full transition-transform hover:scale-105"
              >
                {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FristChangePassword;
