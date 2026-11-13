import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthCard } from "../components/auth/AuthCard";
import { InputField } from "../components/auth/InputField";
import { RoleSelector, type AuthRole } from "../components/auth/RoleSelector";
import { AuthAlert } from "../components/auth/AuthAlert";
import {
  MailIcon,
  LockIcon,
  UserIcon,
  ArrowRightIcon,
  CheckIcon,
  BuildingIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  LogOutIcon
} from "../components/Icons";

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [role, setRole] = useState<AuthRole>("student");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // UI states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alert, setAlert] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, register, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Sync mode with URL search param
  const handleModeChange = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrors({});
    setAlert(null);
    setSearchParams({ mode: newMode });
  };

  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "register" && mode !== "register") {
      setMode("register");
    } else if (urlMode === "login" && mode !== "login") {
      setMode("login");
    }
  }, [searchParams]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (mode === "register") {
      if (!name.trim()) {
        newErrors.name = "Full name is required";
      } else if (name.trim().length < 3) {
        newErrors.name = "Name must be at least 3 characters long";
      }
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid academic or personal email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (mode === "register") {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    if (mode === "login") {
      const res = await login(email, password);
      setIsSubmitting(false);

      if (res.success) {
        setAlert({ type: "success", message: "Login successful! Redirecting..." });
        setTimeout(() => {
          navigate("/");
        }, 800);
      } else {
        setAlert({
          type: "error",
          message: res.error || "Invalid email or password",
        });
      }
    } else {
      // Register
      const res = await register(name, email, password, role);
      setIsSubmitting(false);

      if (res.success) {
        setAlert({
          type: "success",
          message: "Account created successfully! Welcome to IATS.",
        });
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setAlert({
          type: "error",
          message: res.error || "Registration failed. Please verify your details.",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18191B] selection:bg-[#EBF3EE] selection:text-[#1E3A2F] relative font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F] transition-transform duration-200 group-hover:scale-105">
            <GraduationCapIcon size={17} />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-[#18191B]">
                IATS
              </span>
              <span className="text-[10px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded bg-[#EBF3EE] text-[#1E3A2F] border border-[#D2E3D8] font-medium">
                v1.0
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs sm:text-sm font-medium text-[#575C66] hover:text-[#18191B] transition-colors flex items-center gap-1.5 px-3.5 py-1.5 rounded-full hover:bg-[#F2EFE9]"
        >
          <span>Return to Home</span>
          <ArrowRightIcon size={13} />
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex items-center justify-center">
        {isAuthenticated && user ? (
          /* Already Signed In Card */
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#DDD7CC] rounded-3xl p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon size={26} />
            </div>
            <h2 className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
              You are signed in
            </h2>
            <p className="text-sm text-[#575C66] mb-6">
              Authenticated as <span className="font-semibold text-[#18191B]">{user.name}</span> ({user.email})
            </p>

            <div className="p-4 rounded-2xl bg-[#F7F5EF] border border-[#E4DFD5] mb-6 text-left text-xs space-y-1.5">
              <div className="flex justify-between text-[#575C66]">
                <span>Account Role:</span>
                <span className="font-semibold text-[#1E3A2F] uppercase font-mono tracking-wider">
                  {user.role}
                </span>
              </div>
              <div className="flex justify-between text-[#575C66]">
                <span>User Identifier:</span>
                <span className="font-mono text-[#18191B]">#{user.id}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                to="/"
                className="w-full py-3 rounded-full bg-[#1E3A2F] text-[#FAF9F6] font-semibold text-xs sm:text-sm hover:bg-[#162C23] shadow-sm transition-all"
              >
                Go to Testing Platform
              </Link>
              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 rounded-full bg-[#FFFFFF] border border-[#DDD7CC] hover:bg-[#FDF2F2] hover:border-[#E07A7A] hover:text-[#991B1B] text-[#575C66] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <LogOutIcon size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Split Layout: Editorial Story on Left + Auth Card on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
            {/* Left Column: Wispr Flow Style Editorial Story */}
            <div className="hidden lg:flex lg:col-span-6 flex-col text-left space-y-8 pr-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2EFE9] border border-[#DDD7CC] text-xs text-[#575C66] w-fit">
                <span className="w-2 h-2 rounded-full bg-[#2D734E]" />
                <span className="font-semibold text-[#18191B]">Institutional RBAC</span>
                <span>·</span>
                <span>Deterministic Grounding</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-normal font-['Newsreader',serif] text-[#18191B] leading-[1.15] tracking-tight">
                Academic tests grounded in <span className="italic text-[#1E3A2F]">verified literature</span>, not guesswork.
              </h1>

              <p className="text-base text-[#575C66] leading-relaxed max-w-lg">
                Whether you are an educator provisioning syllabus-grounded assessments or a student practicing adaptive problem-solving, IATS provides verified citations, zero hallucinations, and explainable rubric grading.
              </p>

              {/* Verified Feature Points */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mt-0.5 shrink-0">
                    <CheckIcon size={12} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#18191B]">Deterministic Source Grounding</h4>
                    <p className="text-xs text-[#666C7A] mt-0.5">
                      Questions cite direct textbook paragraphs and theorems. Unverified synthesis is rejected.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mt-0.5 shrink-0">
                    <CheckIcon size={12} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#18191B]">Adaptive Item Response Calibration</h4>
                    <p className="text-xs text-[#666C7A] mt-0.5">
                      Question difficulty dynamically shifts based on cognitive performance across Bloom’s Taxonomy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mt-0.5 shrink-0">
                    <CheckIcon size={12} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#18191B]">Protected Question Repositories</h4>
                    <p className="text-xs text-[#666C7A] mt-0.5">
                      Role-based authorization guarantees test keys and institutional test banks remain confidential.
                    </p>
                  </div>
                </div>
              </div>

              {/* Institution Trust Quote */}
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DDD7CC] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-start gap-3 max-w-lg">
                <div className="p-2 rounded-xl bg-[#F7F5EF] text-[#1E3A2F] border border-[#DDD7CC]">
                  <BuildingIcon size={16} />
                </div>
                <div>
                  <p className="text-xs text-[#333842] italic">
                    "IATS ensures that automated question generation reflects the exact academic rigor of our department syllabus without standard LLM drift."
                  </p>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#79808E] mt-1 block">
                    Academic Testing Committee · Review Note
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Form Container */}
            <div className="w-full lg:col-span-6 flex justify-center">
              <AuthCard mode={mode} onModeChange={handleModeChange}>
                {/* Alert Notification */}
                {alert && (
                  <div className="mb-5">
                    <AuthAlert
                      type={alert.type}
                      message={alert.message}
                      onDismiss={() => setAlert(null)}
                    />
                  </div>
                )}

                {/* Institutional SSO Button */}
                <button
                  type="button"
                  onClick={() => {
                    setAlert({
                      type: "info",
                      message: "Campus SSO / Single Sign-On integration requires institutional domain configuration.",
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#DDD7CC] hover:border-[#BFB9AC] bg-[#FAF9F6] hover:bg-[#F3EFE7] text-[#18191B] text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors mb-5"
                >
                  <BuildingIcon size={15} className="text-[#1E3A2F]" />
                  <span>Continue with Campus SSO or Google Workspace</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center mb-5">
                  <div className="w-full border-t border-[#E4DFD5]" />
                  <span className="absolute bg-[#FFFFFF] px-3 text-[10.5px] uppercase font-mono tracking-wider text-[#787F8D]">
                    or continue with email
                  </span>
                </div>

                {/* Form Elements */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Account Role Selector on Register */}
                  {mode === "register" && (
                    <div className="mb-4">
                      <RoleSelector
                        selectedRole={role}
                        onChange={setRole}
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* Full Name for Registration */}
                  {mode === "register" && (
                    <InputField
                      label="Full Name"
                      placeholder="e.g. Dr. Eleanor Vance or John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={errors.name}
                      icon={<UserIcon size={16} />}
                      required
                      disabled={isSubmitting}
                    />
                  )}

                  {/* Email Field */}
                  <InputField
                    label="Academic or Personal Email"
                    type="email"
                    placeholder="student@university.edu or user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    icon={<MailIcon size={16} />}
                    required
                    disabled={isSubmitting}
                  />

                  {/* Password Field */}
                  <InputField
                    label="Password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    helperText={mode === "register" ? "Minimum 8 characters with letters & numbers" : undefined}
                    icon={<LockIcon size={16} />}
                    required
                    disabled={isSubmitting}
                  />

                  {/* Confirm Password for Registration */}
                  {mode === "register" && (
                    <InputField
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={errors.confirmPassword}
                      icon={<LockIcon size={16} />}
                      required
                      disabled={isSubmitting}
                    />
                  )}

                  {/* Login Options: Remember Me & Forgot Password */}
                  {mode === "login" && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[#575C66] select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-[#DDD7CC] text-[#1E3A2F] focus:ring-0 accent-[#1E3A2F]"
                        />
                        <span>Remember this device</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[#1E3A2F] hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button (Solid Forest Moss, 0 Gradient) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3 px-6 rounded-full bg-[#1E3A2F] text-[#FAF9F6] font-semibold text-xs sm:text-sm hover:bg-[#162C23] shadow-sm transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      <>
                        <span>{mode === "login" ? "Sign In to IATS" : "Create Academic Account"}</span>
                        <ArrowRightIcon
                          size={14}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switcher Note */}
                <div className="mt-6 pt-5 border-t border-[#E4DFD5] text-center text-xs text-[#666C7A]">
                  {mode === "login" ? (
                    <p>
                      Don't have an academic account?{" "}
                      <button
                        type="button"
                        onClick={() => handleModeChange("register")}
                        className="text-[#1E3A2F] font-semibold hover:underline"
                      >
                        Create an account
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already registered?{" "}
                      <button
                        type="button"
                        onClick={() => handleModeChange("login")}
                        className="text-[#1E3A2F] font-semibold hover:underline"
                      >
                        Sign in instead
                      </button>
                    </p>
                  )}
                </div>

                {/* Terms Disclaimer */}
                <p className="mt-4 text-[10.5px] text-center text-[#787F8D] leading-normal">
                  By signing in or registering, you acknowledge compliance with academic integrity policies and source calibration terms.
                </p>
              </AuthCard>
            </div>
          </div>
        )}
      </main>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#DDD7CC] rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-left">
            <h3 className="text-xl font-normal font-['Newsreader',serif] text-[#18191B] mb-2">
              Password Recovery
            </h3>
            <p className="text-xs text-[#575C66] leading-relaxed mb-4">
              Enter your registered academic email and our authorization system will transmit a password reset token.
            </p>
            <InputField
              label="Academic Email"
              type="email"
              placeholder="user@university.edu"
              defaultValue={email}
              icon={<MailIcon size={16} />}
            />
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setAlert({
                    type: "info",
                    message: "If an account matches that email, password reset instructions have been dispatched.",
                  });
                }}
                className="flex-1 py-2 rounded-full bg-[#1E3A2F] text-[#FAF9F6] text-xs font-semibold hover:bg-[#162C23]"
              >
                Send Instructions
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 rounded-full border border-[#DDD7CC] hover:bg-[#F2EFE9] text-xs font-semibold text-[#575C66]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-[#DDD7CC] text-center text-[11px] text-[#787F8D] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} IATS. Intelligent Academic Test System.</div>
        <div className="flex gap-4">
          <span className="text-[#1E3A2F] font-medium">Mild Light Theme · Zero Gradients</span>
          <span>·</span>
          <span>Role-Based JWT Security</span>
        </div>
      </footer>
    </div>
  );
};
