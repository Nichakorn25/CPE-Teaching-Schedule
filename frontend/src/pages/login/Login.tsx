import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SignIn } from "../../services/https";
import { SignInInterface } from "../../interfaces/SignIn";

import TopBar from "../../../src/components/topbar/TopBar";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    document.body.classList.add("bg-gray-100");
    return () => {
      document.body.classList.remove("bg-gray-100");
    };
  }, []);

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;

    if (target.name === "UsernameID" && target.value === "") {
      target.setCustomValidity("กรุณากรอกรหัสพนักงาน");
    } else if (target.name === "Password" && target.value === "") {
      target.setCustomValidity("กรุณากรอกรหัสผ่าน");
    } else {
      target.setCustomValidity("");
    }
  };

  const onFinish = async (values: SignInInterface) => {
    setLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const res = await SignIn(values);

      if (res.status === 200) {
        setMessage("เข้าสู่ระบบสำเร็จ");
        setMessageType("success");
        const { token, token_type, role, user_id, first_name, last_name } = res.data;

        localStorage.setItem("isLogin", "true");
        localStorage.setItem("token", token);
        localStorage.setItem("token_type", token_type);
        localStorage.setItem("role", role);
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("first_name", first_name);
        localStorage.setItem("last_name", last_name);
        
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

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
        style={{ backgroundImage: 'linear-gradient(rgba(60,60,60,0.4), rgba(60,60,60,0.3)),url(/sut.jpg)' }}
      >
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#09261d] text-white text-center py-4">
            <h1 className="text-2xl font-bold tracking-wide">
              CPE Teaching Schedule
            </h1>
          </div>

          {/* กล่องซ้ายขวา */}
          <div className="flex flex-col md:flex-row">
            {/* ซ้ายมือเรา */}
            <div className="w-full md:w-1/2 p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const values: SignInInterface = {
                    UsernameID: formData.get("UsernameID") as string,
                    Password: formData.get("Password") as string,
                  };
                  onFinish(values);
                }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="UsernameID" className="block text-gray-700 font-medium">รหัสพนักงาน</label>
                  <input
                    type="text"
                    id="UsernameID"
                    name="UsernameID"
                    onInvalid={handleInvalid}
                    placeholder="username"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label htmlFor="Password" className="block text-gray-700 font-medium">รหัสผ่าน</label>
                  <input
                    type="password"
                    id="Password"
                    name="Password"
                    onInvalid={handleInvalid}
                    placeholder="password"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#ff6314] text-white font-medium rounded-md transition transform hover:scale-105"
                  >
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </button>
                </div>
              </form>

              {message && (
                <div
                  className={`mt-4 p-4 rounded-md text-center text-sm font-semibold ${messageType === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {message}
                </div>
              )}
            </div>

            {/* ขวามือเรา */}
            <div className="w-full md:w-1/2 p-8 border-t md:border-t-0 md:border-l border-gray-200 text-sm text-gray-700">
              <p className="mb-4">
                (1) If you can not log-in, <br />
                please contact the administrator<br />
                Tel: 0-4422-5759<br />
                Email:{" "}
                <a
                  href="mailto:administrator@sut.ac.th"
                  className="text-blue-600 underline"
                >
                  administrator@sut.ac.th
                </a>
              </p>
              <p className="mb-4">
                (2) Please enter your email address correctly to auto-reply in case you forgot your password
              </p>
              <Link
                to="/forgot-password"
                className="text-blue-600 text-sm font-semibold hover:underline"
              >
                ส่งคำร้องขอเปลี่ยนรหัสผ่าน?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
