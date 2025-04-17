import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div className="w-full h-screen bg-[#aaaaaa]/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#09261d] py-6 px-4 md:px-12 rounded-t-xl">
          <h1 className="text-white text-2xl md:text-4xl font-bold font-montserrat text-center">
            CPE Teaching Schedule
          </h1>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-10">
          {/* Left - Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-black text-lg font-montserrat mb-1">รหัสพนักงาน</label>
              <input
                type="text"
                placeholder="username"
                className="w-full h-12 px-4 rounded-xl border border-[#aaaaaa] text-[#aaaaaa] text-lg font-montserrat"
              />
            </div>
            <div>
              <label className="block text-black text-lg font-montserrat mb-1">รหัสผ่าน</label>
              <input
                type="password"
                placeholder="password"
                className="w-full h-12 px-4 rounded-xl border border-[#aaaaaa] text-[#aaaaaa] text-lg font-montserrat"
              />
            </div>
            <button className="w-full h-12 bg-[#ff6314] text-white text-xl font-bold font-montserrat rounded-xl hover:bg-orange-600 transition">
              Sign in
            </button>
          </div>

          {/* Right - Info */}
          <div className="text-black text-base md:text-lg font-montserrat space-y-4">
            <p>
              (1) If you cannot log in, please contact the administrator:<br />
              Tel: 0-4422-5759<br />
              Email: <a href="mailto:administrator@sut.ac.th" className="underline">administrator@sut.ac.th</a>
            </p>
            <p>
              (2) Please enter your email address correctly to auto-reply in case you forgot your password.
            </p>
            <a href="#" className="text-[#58b9ea] font-bold block mt-2">Forgotten your password?</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
