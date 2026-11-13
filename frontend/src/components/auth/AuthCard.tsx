import React from "react";
import { GraduationCapIcon } from "../Icons";

interface AuthCardProps {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ mode, onModeChange, children }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-[#FFFFFF] border border-[#DDD7CC] rounded-3xl p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-left">
      {/* Brand Icon & Heading */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F]">
            <GraduationCapIcon size={16} />
          </div>
          <span className="font-semibold text-base tracking-tight text-[#18191B]">
            IATS
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FAF9F6] text-[#666C7A] border border-[#DDD7CC]">
            Auth Portal
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-[#F2EFE9] rounded-full border border-[#DDD7CC] text-xs">
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className={`px-3 py-1 rounded-full font-semibold transition-all duration-150 ${
              mode === "login"
                ? "bg-[#1E3A2F] text-[#FAF9F6] shadow-sm"
                : "text-[#585E6A] hover:text-[#18191B]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onModeChange("register")}
            className={`px-3 py-1 rounded-full font-semibold transition-all duration-150 ${
              mode === "register"
                ? "bg-[#1E3A2F] text-[#FAF9F6] shadow-sm"
                : "text-[#585E6A] hover:text-[#18191B]"
            }`}
          >
            Register
          </button>
        </div>
      </div>

      {/* Editorial Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-normal font-['Newsreader',serif] text-[#18191B] tracking-tight leading-snug mb-1.5">
          {mode === "login" ? (
            <>
              Welcome back to <span className="italic text-[#1E3A2F]">academic testing</span>.
            </>
          ) : (
            <>
              Create your <span className="italic text-[#1E3A2F]">academic testing</span> account.
            </>
          )}
        </h2>
        <p className="text-xs sm:text-[13px] text-[#575C66] leading-relaxed">
          {mode === "login"
            ? "Enter your credentials to access your tests, question banks, and calibration metrics."
            : "Join verified students and educators using source-grounded intelligence."}
        </p>
      </div>

      {children}
    </div>
  );
};

