import React from "react";
import { GraduationCapIcon, ShieldCheckIcon } from "../Icons";

export type AuthRole = "student" | "admin";

interface RoleSelectorProps {
  selectedRole: AuthRole;
  onChange: (role: AuthRole) => void;
  disabled?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5 text-left w-full">
      <label className="text-xs font-semibold text-[#18191B] tracking-tight">
        Academic Account Type
      </label>

      <div className="grid grid-cols-2 gap-2.5 p-1 bg-[#F2EFE9] rounded-2xl border border-[#DDD7CC]">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("student")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
            selectedRole === "student"
              ? "bg-[#1E3A2F] text-[#FAF9F6] shadow-sm"
              : "text-[#585E6A] hover:text-[#18191B] hover:bg-[#FAF9F6]/60"
          }`}
        >
          <GraduationCapIcon size={15} />
          <span>Student</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("admin")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
            selectedRole === "admin"
              ? "bg-[#1E3A2F] text-[#FAF9F6] shadow-sm"
              : "text-[#585E6A] hover:text-[#18191B] hover:bg-[#FAF9F6]/60"
          }`}
        >
          <ShieldCheckIcon size={15} />
          <span>Educator / Admin</span>
        </button>
      </div>

      <div className="text-[11px] text-[#666C7A] px-1">
        {selectedRole === "student"
          ? "Takes adaptive tests, tracks Bloom's calibration score & receives rubric feedback."
          : "Authorizes textbook sources, provisions questions & monitors cohort analytics."}
      </div>
    </div>
  );
};

