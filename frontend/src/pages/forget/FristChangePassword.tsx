
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChangePassword } from "../../services/https/LoginServices";
import { ChangePasswordInterface } from "../../interfaces/SignIn";
import './Toast.css'

const FristChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
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

  ///////////////////////////// Notification-Password /////////////////////////////////
  const InvalidForPassword = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;

    switch (target.name) {
      case "NewPassword":
        if (target.value.trim() === "") {
          target.setCustomValidity("กรุณากรอกรหัสผ่านใหม่");
        } else if (target.value.length < 8) {
          target.setCustomValidity("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
        } else {
          target.setCustomValidity("");
        }
        break;

      case "ConfirmPassword":
        const newPassword = document.querySelector<HTMLInputElement>('input[name="NewPassword"]');
        if (target.value.trim() === "") {
          target.setCustomValidity("กรุณากรอกยืนยันรหัสผ่าน");
        } else if (newPassword && target.value !== newPassword.value) {
          target.setCustomValidity("รหัสผ่านไม่ตรงกัน");
        } else {
          target.setCustomValidity("");
        }
        break;

      default:
        target.setCustomValidity("");
        break;
    }
  };

  //////////////////// forget password /////////////////////////////////
  const handleReset = async (values: ChangePasswordInterface) => {
    setLoading(true);
    try {
      const res = await ChangePassword(values);
      if (res?.status === 200) {
        toast.success("รีเซ็ตรหัสผ่านสำเร็จ", {
          icon: <FaCheckCircle />,
        });
        setTimeout(() => {
          localStorage.setItem("first_password", "true");
          navigate("/");
        }, 1000);
      } else if (res?.status === 404) {
        toast.error("ไม่พบผู้ใช้งานด้วยอีเมลนี้", {
          icon: <FaExclamationTriangle />,
        });
      } else {
        toast.error(res?.data?.error || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน", {
          icon: <FaTimesCircle />,
        });
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", {
        icon: <FaTimesCircle />,
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
            <h2 className="text-xl font-semibold text-white tracking-wide mt-4">กรุณาเปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัย</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const values: ChangePasswordInterface = {
                Email: localStorage.getItem("email") || "",
                NewPassword: formData.get("NewPassword") as string,
                ConfirmPassword: formData.get("ConfirmPassword") as string,
              };

              if (values.NewPassword !== values.ConfirmPassword) {
                toast.warning("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน", {
                  position: "top-center",
                  className: "custom-toast Toastify__toast--warning",
                  progressClassName: "Toastify__progress-bar--warning",
                  icon: false,
                });
                return;
              }

              handleReset(values);
            }}
            className="space-y-5"
          >
            <div>
              <label htmlFor="NewPassword" className="block text-white font-medium pl-4">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                id="NewPassword"
                name="NewPassword"
                required
                onInvalid={InvalidForPassword}
                onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity("")}
                placeholder="🔐 รหัสผ่านใหม่"
                className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
              />
            </div>

            <div>
              <label htmlFor="ConfirmPassword" className="block text-white font-medium pl-4">
                ยืนยันรหัสผ่าน
              </label>
              <input
                type="password"
                id="ConfirmPassword"
                name="ConfirmPassword"
                required
                onInvalid={InvalidForPassword}
                onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity("")}
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
            <ToastContainer
              position="top-center"
              autoClose={1000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick={false}
              closeButton={false}
              rtl={false}
              pauseOnFocusLoss={false}
              draggable={false}
              pauseOnHover={false}
              theme="colored"
              toastClassName="custom-toast"
            />
          </form>

          {message && (
            <div
              className={`mt-4 p-3 text-center text-sm font-semibold rounded-md ${messageType === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );

};

export default FristChangePassword;
