import React, { useState, useEffect } from "react";
import {
  GraduationCapIcon,
  ArrowRightIcon,
  MenuIcon,
  XIcon,
  SparklesIcon,
  ChevronDownIcon
} from "./Icons";

interface HeaderProps {
  onOpenTestModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTestModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200 py-3 sm:py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <nav
          className={`flex items-center justify-between px-5 sm:px-7 py-3 rounded-full transition-all duration-200 ${
            scrolled
              ? "bg-[#FFFFFF]/95 backdrop-blur-md border border-[#D8D3C8] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
              : "bg-[#FFFFFF]/90 backdrop-blur-md border border-[#E4DFD5] shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          }`}
        >
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F] transition-transform duration-200 group-hover:scale-105">
              <GraduationCapIcon size={19} />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[17px] tracking-tight text-[#18191B] font-['Plus_Jakarta_Sans',sans-serif]">
                  IATS
                </span>
                <span className="text-[10px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded bg-[#EBF3EE] text-[#1E3A2F] border border-[#D2E3D8] font-medium">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#79808E] hidden sm:inline">
                Academic Test Engine
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <a
              href="#features"
              className="text-[13.5px] font-medium text-[#585E6A] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F3F0EA] transition-colors"
            >
              Features
            </a>

            {/* Dropdown for Solutions */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("assessments")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center gap-1 text-[13.5px] font-medium text-[#585E6A] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F3F0EA] transition-colors">
                <span>Solutions</span>
                <ChevronDownIcon size={14} className="opacity-70" />
              </button>

              {activeDropdown === "assessments" && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-[#FFFFFF] border border-[#E0DBCF] p-3 shadow-[0_12px_36px_rgba(0,0,0,0.08)]">
                  <a
                    href="#how-it-works"
                    className="flex flex-col p-2.5 rounded-xl hover:bg-[#F6F4EE] transition-colors group"
                  >
                    <span className="text-[13px] font-semibold text-[#18191B] group-hover:text-[#1E3A2F] transition-colors">
                      Source-Grounded Tests
                    </span>
                    <span className="text-[11.5px] text-[#6E7583]">
                      Generated strictly from textbooks & syllabus notes
                    </span>
                  </a>
                  <a
                    href="#adaptive"
                    className="flex flex-col p-2.5 rounded-xl hover:bg-[#F6F4EE] transition-colors group"
                  >
                    <span className="text-[13px] font-semibold text-[#18191B] group-hover:text-[#1E3A2F] transition-colors">
                      Adaptive Difficulty
                    </span>
                    <span className="text-[11.5px] text-[#6E7583]">
                      Calibrates questions in real-time to student skill
                    </span>
                  </a>
                  <a
                    href="#grading"
                    className="flex flex-col p-2.5 rounded-xl hover:bg-[#F6F4EE] transition-colors group"
                  >
                    <span className="text-[13px] font-semibold text-[#18191B] group-hover:text-[#1E3A2F] transition-colors">
                      Automated Rubric Grading
                    </span>
                    <span className="text-[11.5px] text-[#6E7583]">
                      Instant objective evaluation & analytical feedback
                    </span>
                  </a>
                </div>
              )}
            </div>

            <a
              href="#how-it-works"
              className="text-[13.5px] font-medium text-[#585E6A] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F3F0EA] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#interactive-demo"
              className="text-[13.5px] font-medium text-[#585E6A] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F3F0EA] transition-colors flex items-center gap-1.5"
            >
              <SparklesIcon size={14} className="text-[#1E3A2F]" />
              <span>Live Playground</span>
            </a>
            <a
              href="#architecture"
              className="text-[13.5px] font-medium text-[#585E6A] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F3F0EA] transition-colors"
            >
              Architecture
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#login"
              className="hidden sm:inline-flex text-[13px] font-medium text-[#585E6A] hover:text-[#18191B] px-3.5 py-2 transition-colors"
            >
              Sign In
            </a>

            <button
              onClick={onOpenTestModal}
              className="relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] shadow-sm transition-all duration-200 transform active:scale-95 group"
            >
              <span>Get Started</span>
              <ArrowRightIcon
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-[#585E6A] hover:text-[#18191B] hover:bg-[#F3F0EA] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-5 rounded-3xl bg-[#FFFFFF] border border-[#DDD7CC] shadow-[0_12px_36px_rgba(0,0,0,0.08)] flex flex-col gap-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#373A42] hover:text-[#1E3A2F] py-2 border-b border-[#ECE7DE]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#373A42] hover:text-[#1E3A2F] py-2 border-b border-[#ECE7DE]"
            >
              How it Works
            </a>
            <a
              href="#interactive-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#373A42] hover:text-[#1E3A2F] py-2 border-b border-[#ECE7DE] flex items-center justify-between"
            >
              <span>Live Playground</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#EBF3EE] text-[#1E3A2F] border border-[#D2E3D8] font-medium">
                Interactive
              </span>
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#373A42] hover:text-[#1E3A2F] py-2 border-b border-[#ECE7DE]"
            >
              Architecture & API
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="#login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-medium text-[#585E6A] py-2.5 rounded-full hover:bg-[#F3F0EA]"
              >
                Sign In
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenTestModal) onOpenTestModal();
                }}
                className="w-full py-2.5 rounded-full text-sm font-semibold bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-center"
              >
                Create Academic Test
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
