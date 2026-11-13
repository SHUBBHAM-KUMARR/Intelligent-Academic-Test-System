import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "../Icons";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  helperText,
  type = "text",
  id,
  className = "",
  disabled,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5 text-left w-full">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#18191B] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {label} {props.required && <span className="text-[#A82A2A]">*</span>}
        </label>
        {helperText && !error && (
          <span className="text-[11px] text-[#666C7A]">{helperText}</span>
        )}
      </div>

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-[#79808E] pointer-events-none flex items-center">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={actualType}
          disabled={disabled}
          className={`w-full text-[13.5px] rounded-xl bg-[#FFFFFF] border transition-all duration-150 text-[#18191B] placeholder:text-[#A49E92] outline-none ${
            icon ? "pl-10" : "pl-3.5"
          } ${isPassword ? "pr-10" : "pr-3.5"} py-2.5 ${
            error
              ? "border-[#E07A7A] focus:border-[#A82A2A] bg-[#FFFBFB]"
              : "border-[#DDD7CC] hover:border-[#BFB9AC] focus:border-[#1E3A2F]"
          } ${disabled ? "opacity-60 cursor-not-allowed bg-[#F7F5EF]" : ""} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute right-3 text-[#79808E] hover:text-[#18191B] transition-colors p-1 rounded focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        )}
      </div>

      {error && (
        <span className="text-[11px] text-[#991B1B] font-medium animate-in fade-in duration-150">
          {error}
        </span>
      )}
    </div>
  );
};

