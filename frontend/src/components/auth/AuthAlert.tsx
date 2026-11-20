import React from "react";
import { AlertCircleIcon, CheckCircleIcon } from "../Icons";

interface AuthAlertProps {
  type: "error" | "success" | "info";
  message: string;
  onDismiss?: () => void;
}

export const AuthAlert: React.FC<AuthAlertProps> = ({ type, message, onDismiss }) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: "bg-[#FDF2F2]",
      border: "border-[#E07A7A]",
      text: "text-[#991B1B]",
      icon: <AlertCircleIcon size={16} className="text-[#A82A2A] shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-[#EBF3EE]",
      border: "border-[#CDE1D4]",
      text: "text-[#1E3A2F]",
      icon: <CheckCircleIcon size={16} className="text-[#2D734E] shrink-0 mt-0.5" />,
    },
    info: {
      bg: "bg-[#F7F5EF]",
      border: "border-[#DDD7CC]",
      text: "text-[#4F5664]",
      icon: <AlertCircleIcon size={16} className="text-[#666C7A] shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div
      className={`flex items-start gap-2.5 p-3.5 rounded-2xl border ${styles.bg} ${styles.border} ${styles.text} text-xs leading-relaxed animate-in fade-in duration-150`}
    >
      {styles.icon}
      <div className="flex-1 font-medium">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-current opacity-60 hover:opacity-100 ml-1 font-bold text-sm leading-none"
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

