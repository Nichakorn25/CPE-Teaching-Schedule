
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaLock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SignIn, ChangePassword } from "../../services/https/LoginServices";
import { SignInInterface, ChangePasswordInterface } from "../../interfaces/SignIn";
import './Toast.css'

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loginFormRef = useRef<HTMLFormElement>(null);
  const resetFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    document.body.classList.add("bg-gray-100");
    return () => {
      document.body.classList.remove("bg-gray-100");
    };
  }, []);

  ///////////////////////////// Notification-Password /////////////////////////////////
  const InvalidForPassword = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;

    switch (target.name) {
      case "Email":
        if (target.value.trim() === "") {
          target.setCustomValidity("กรุณากรอกอีเมล");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.value)) {
          target.setCustomValidity("รูปแบบอีเมลไม่ถูกต้อง");
        } else {
          target.setCustomValidity("");
        }
        break;

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

  ///////////////////////////// Notification-Login /////////////////////////////////
  
  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;

    if (target.name === "Username" && target.value === "") {
      target.setCustomValidity("กรุณากรอกรหัสพนักงาน");
    } else if (target.name === "Password" && target.value === "") {
      target.setCustomValidity("กรุณากรอกรหัสผ่าน");
    } else if (target.name === "Email") {
      if (target.value === "") {
        target.setCustomValidity("กรุณากรอกอีเมล");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.value)) {
        target.setCustomValidity("รูปแบบอีเมลไม่ถูกต้อง");
      } else {
        target.setCustomValidity("");
      }
    } else if (target.name === "NewPassword" && target.value === "") {
      target.setCustomValidity("กรุณากรอกรหัสผ่านใหม่");
    } else if (target.name === "ConfirmPassword") {
      const newPassword = document.querySelector<HTMLInputElement>('input[name="NewPassword"]');
      if (target.value === "") {
        target.setCustomValidity("กรุณากรอกยืนยันรหัสผ่าน");
      } else if (newPassword && target.value !== newPassword.value) {
        target.setCustomValidity("รหัสผ่านไม่ตรงกัน");
      } else {
        target.setCustomValidity("");
      }
    } else {
      target.setCustomValidity("");
    }
  };

  ///////////////////////////// Login /////////////////////////////////
  const onFinish = async (values: SignInInterface) => {
    setLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const res = await SignIn(values);

      if (res.status === 200) {
        setMessage("เข้าสู่ระบบสำเร็จ");
        setMessageType("success");
        const { token, token_type, role, user_id, first_name, last_name, image, first_password, major_name, position, title, username } = res.data;

        localStorage.setItem("isLogin", "true");
        localStorage.setItem("token", token);
        localStorage.setItem("token_type", token_type);
        localStorage.setItem("role", role);
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("first_name", first_name);
        localStorage.setItem("last_name", last_name);
        localStorage.setItem("username", username);
        localStorage.setItem("title", title);
        localStorage.setItem("position", position);
        localStorage.setItem("major_name", major_name);
        localStorage.setItem("first_password", first_password);
        localStorage.setItem("image", image);

        setTimeout(() => {
          if (role === "Admin") {
            navigate("/home-admin");
          } else if (role === "Scheduler" || role === "Instructor") {
            navigate("/home-instructor");
          } else {
            setMessage("ไม่สามารถระบุสิทธิ์ผู้ใช้งานได้");
            setMessageType("error");
          }
        }, 1000);
      } else {
        if (res.data?.error) {
          if (res.data.error.toLowerCase() === "incorrect password") {
            setMessage("รหัสผ่านไม่ถูกต้อง");
            setMessageType("error");
          } else if (res.data.error.toLowerCase() === "invalid user id") {
            setMessage("ไม่พบรหัสพนักงาน");
            setMessageType("error");
          } else {
            setMessage(res.data.error || "เข้าสู่ระบบล้มเหลว");
            setMessageType("error");
          }
        } else {
          setMessage("เกิดข้อผิดพลาดบางประการ");
          setMessageType("error");
        }
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setMessageType("error");
    } finally {
      setLoading(false);
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
        resetFormRef.current?.reset();
        setTimeout(() => {
          setShowReset(false);
          loginFormRef.current?.reset();
        }, 1500);
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
            <h1 className="text-4xl font-bold text-white">CPE</h1>
            <h2 className="text-xl font-semibold text-white tracking-wide">Teaching Schedule</h2>
          </div>
          {!showReset ? (
            <form
              ref={loginFormRef}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const values: SignInInterface = {
                  Username: formData.get("Username") as string,
                  Password: formData.get("Password") as string,
                };
                onFinish(values);
              }}
              className="space-y-5"
            >
              <div>
                <label htmlFor="Username" className="block text-white font-medium pl-4">
                  รหัสพนักงาน
                </label>
                <input
                  type="text"
                  id="Username"
                  name="Username"
                  onInvalid={handleInvalid}
                  placeholder="🧑 username"
                  required
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm 
                 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              <div>
                <label htmlFor="Password" className="block text-white font-medium pl-4">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  id="Password"
                  name="Password"
                  onInvalid={handleInvalid}
                  placeholder="🔑 password"
                  required
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#F26522] text-white font-semibold rounded-full transition-transform hover:scale-105"
                >
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-white font-semibold hover:underline"
                    onClick={() => { setShowReset(true); loginFormRef.current?.reset(); }}
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form
              ref={resetFormRef}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const values: ChangePasswordInterface = {
                  Email: formData.get("Email") as string,
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
                <label htmlFor="Email" className="block text-white font-medium pl-4">
                  อีเมล
                </label>
                <input
                  type="email"
                  id="Email"
                  name="Email"
                  required
                  onInvalid={InvalidForPassword}
                  onInput={(e) => (e.currentTarget as HTMLInputElement).setCustomValidity("")}
                  placeholder="📧 example@g.sut.ac.th"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

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

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-white font-semibold hover:underline"
                    onClick={() => { setShowReset(false); resetFormRef.current?.reset(); }}
                  >
                    กลับสู่หน้าเข้าสู่ระบบ
                  </button>
                </div>
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
          )}

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

export default LoginPage;
