import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  api,
  type SubmissionItem,
  type StudentDashboardData,
  type StudentSummary,
} from "../services/api";
import {
  GraduationCapIcon,
  ShieldCheckIcon,
  BarChartIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SearchIcon,
  LogOutIcon,
  BookOpenIcon,
  RefreshIcon,
  ArrowRightIcon,
  UsersIcon,
  AwardIcon,
  SparklesIcon,
  ChevronDownIcon,
  BrainIcon,
} from "../components/Icons";

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Role detection
  const isAdmin = user?.role === "admin" || user?.role === "educator";

  // Student view states
  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [studentLoading, setStudentLoading] = useState<boolean>(true);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<number | null>(null);

  // Admin view states
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<{
    student: StudentSummary;
    submissions: SubmissionItem[];
  } | null>(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState<boolean>(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>("");

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth?mode=login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load student dashboard data
  const loadStudentDashboard = async () => {
    setStudentLoading(true);
    setStudentError(null);
    try {
      const data = await api.getMySubmissions();
      setStudentData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load test history";
      setStudentError(message);
    } finally {
      setStudentLoading(false);
    }
  };

  // Load admin dashboard data
  const loadAdminDashboard = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const data = await api.getAdminStudents();
      setStudents(data.students || []);
      setTotalSubmissions(data.total_submissions || 0);
      if (data.students && data.students.length > 0 && selectedStudentId === null) {
        // Auto-select first student
        fetchStudentDetail(data.students[0].id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load student directory";
      setAdminError(message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Fetch individual student submission history for admin
  const fetchStudentDetail = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setLoadingStudentDetail(true);
    try {
      const data = await api.getAdminStudentSubmissions(studentId);
      setSelectedStudentDetails({
        student: {
          id: data.student.id,
          name: data.student.name,
          email: data.student.email,
          role: data.student.role,
          enrolled_at: data.student.created_at,
          tests_taken: data.summary.total_tests,
          tests_passed: data.summary.passed_tests,
          average_score: data.summary.average_score,
          latest_calibration: data.summary.latest_calibration,
        },
        submissions: data.submissions || [],
      });
    } catch (err: unknown) {
      console.error("Failed to fetch student details:", err);
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (isAdmin) {
        loadAdminDashboard();
      } else {
        loadStudentDashboard();
      }
    }
  }, [isAuthenticated, user?.role]);

  // Filtered submissions for student view
  const filteredSubmissions = useMemo(() => {
    if (!studentData?.submissions) return [];
    return studentData.submissions.filter((sub) => {
      const testTitle = sub.test?.title?.toLowerCase() || `test #${sub.test_id}`;
      const subject = sub.test?.subject?.toLowerCase() || "";
      const matchesSearch =
        testTitle.includes(searchQuery.toLowerCase()) ||
        subject.includes(searchQuery.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === "all" ||
        sub.test?.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();
      return matchesSearch && matchesDifficulty;
    });
  }, [studentData, searchQuery, difficultyFilter]);

  // Filtered student list for admin view
  const filteredAdminStudents = useMemo(() => {
    if (!students) return [];
    if (!adminSearchQuery.trim()) return students;
    const q = adminSearchQuery.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, adminSearchQuery]);

  // Helper for Bloom's calibration status pill
  const getCalibrationTier = (score: number) => {
    if (score >= 80) return { label: "Cognitive Mastery", bg: "bg-[#EBF3EE]", text: "text-[#1E3A2F]", border: "border-[#CDE1D4]" };
    if (score >= 65) return { label: "Advanced Synthesis", bg: "bg-[#EBF3EE]", text: "text-[#2D734E]", border: "border-[#CDE1D4]" };
    if (score >= 50) return { label: "Proficient Baseline", bg: "bg-[#F7F5EF]", text: "text-[#18191B]", border: "border-[#DDD7CC]" };
    return { label: "Foundational", bg: "bg-[#F3EFE7]", text: "text-[#666C7A]", border: "border-[#E4DFD5]" };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F] animate-spin">
            <RefreshIcon size={18} />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#666C7A]">
            Verifying Authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18191B] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#EBF3EE] selection:text-[#1E3A2F] flex flex-col justify-between">
      {/* Top Floating Navigation Capsule */}
      <header className="sticky top-0 z-50 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center justify-between px-5 sm:px-7 py-3 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md border border-[#DDD7CC] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F] transition-transform duration-200 group-hover:scale-105">
                <GraduationCapIcon size={17} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight text-[#18191B]">
                  IATS
                </span>
                <span className="text-[10px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded bg-[#EBF3EE] text-[#1E3A2F] border border-[#D2E3D8] font-medium">
                  {isAdmin ? "Admin Console" : "Student Portal"}
                </span>
              </div>
            </Link>

            {/* Middle Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="text-[13px] font-medium text-[#575C66] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F7F5EF] transition-colors"
              >
                Overview
              </Link>
              <Link
                to="/tests"
                className="text-[13px] font-medium text-[#575C66] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F7F5EF] transition-colors flex items-center gap-1.5"
              >
                <BookOpenIcon size={13} className="text-[#1E3A2F]" />
                <span>Assessment Center</span>
              </Link>
              <span className="text-[13px] font-semibold text-[#1E3A2F] px-3.5 py-1.5 rounded-full bg-[#EBF3EE] border border-[#CDE1D4]">
                Dashboard
              </span>
              {isAdmin && (
                <Link
                  to="/admin/students"
                  className="text-[13px] font-medium text-[#575C66] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F7F5EF] transition-colors flex items-center gap-1.5"
                >
                  <UsersIcon size={13} className="text-[#1E3A2F]" />
                  <span>Students</span>
                </Link>
              )}
            </div>

            {/* Profile Pill & Sign Out */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5EF] border border-[#E4DFD5]">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-[#1E3A2F] flex items-center justify-center text-[11px] font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#18191B] max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD7CC] text-[#575C66]">
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-full text-[#575C66] hover:text-[#991B1B] hover:bg-[#FDF2F2] border border-transparent hover:border-[#E07A7A] transition-colors"
              >
                <LogOutIcon size={15} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* ==================================================================== */}
        {/* STUDENT DASHBOARD VIEW */}
        {/* ==================================================================== */}
        {!isAdmin && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD5]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[11px] font-mono uppercase tracking-wider text-[#666C7A] mb-3">
                  <ShieldCheckIcon size={13} className="text-[#1E3A2F]" />
                  <span>Verified Learning Portfolio</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] tracking-tight">
                  Academic <span className="italic font-normal text-[#1E3A2F]">Learning Record</span> & Test History
                </h1>
                <p className="text-sm text-[#575C66] mt-1.5 max-w-2xl">
                  Real-time Bloom’s cognitive calibration, evaluation rubrics, and conceptual remediation notes.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={loadStudentDashboard}
                  disabled={studentLoading}
                  className="px-3.5 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#F7F5EF] border border-[#DDD7CC] text-xs font-medium text-[#18191B] flex items-center gap-1.5 transition-colors"
                >
                  <RefreshIcon size={13} className={studentLoading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
                <Link
                  to="/tests"
                  className="px-4 py-2 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <SparklesIcon size={13} />
                  <span>Take New Test</span>
                </Link>
              </div>
            </div>

            {/* Performance Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Tests Completed */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-[#666C7A] mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider font-mono">
                    Assessments Taken
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center text-[#18191B]">
                    <BookOpenIcon size={15} />
                  </div>
                </div>
                <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                  {studentData?.summary?.total_tests ?? 0}
                </div>
                <div className="text-[11px] text-[#666C7A] mt-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#2D734E] font-semibold">
                    {studentData?.summary?.passed_tests ?? 0} Passed
                  </span>
                  <span>•</span>
                  <span>
                    {(studentData?.summary?.total_tests ?? 0) - (studentData?.summary?.passed_tests ?? 0)} Retake Needed
                  </span>
                </div>
              </div>

              {/* Card 2: Average Score */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-[#666C7A] mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider font-mono">
                    Mean Score
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center text-[#18191B]">
                    <BarChartIcon size={15} />
                  </div>
                </div>
                <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                  {studentData?.summary?.average_score ?? 0}
                  <span className="text-lg font-mono text-[#666C7A] ml-1">%</span>
                </div>
                <div className="text-[11px] text-[#666C7A] mt-2 font-mono">
                  Peak score: <span className="font-semibold text-[#18191B]">{studentData?.summary?.highest_score ?? 0}%</span>
                </div>
              </div>

              {/* Card 3: Cognitive Calibration Level */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-[#666C7A] mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider font-mono">
                    Bloom Calibration
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] flex items-center justify-center text-[#1E3A2F]">
                    <BrainIcon size={15} />
                  </div>
                </div>
                <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                  {studentData?.summary?.latest_calibration ?? 50.0}
                  <span className="text-xs font-mono text-[#666C7A] ml-1">/ 100</span>
                </div>
                <div className="mt-2">
                  {(() => {
                    const tier = getCalibrationTier(studentData?.summary?.latest_calibration ?? 50);
                    return (
                      <span className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${tier.bg} ${tier.text} ${tier.border}`}>
                        {tier.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Card 4: Accuracy Pass Ratio */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-[#666C7A] mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider font-mono">
                    Pass Ratio
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center text-[#18191B]">
                    <AwardIcon size={15} />
                  </div>
                </div>
                <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                  {studentData?.summary?.total_tests
                    ? Math.round(
                        ((studentData.summary.passed_tests || 0) / studentData.summary.total_tests) * 100
                      )
                    : 0}
                  <span className="text-lg font-mono text-[#666C7A] ml-1">%</span>
                </div>
                <div className="text-[11px] text-[#666C7A] mt-2 font-mono">
                  {studentData?.summary?.passed_tests || 0} of {studentData?.summary?.total_tests || 0} benchmarks achieved
                </div>
              </div>
            </div>

            {/* Tests Results Section */}
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ECE7DE]">
                <div>
                  <h2 className="text-xl font-normal font-['Newsreader',serif] text-[#18191B]">
                    Completed Test Submissions
                  </h2>
                  <p className="text-xs text-[#575C66] mt-0.5">
                    Click any test record to inspect question-level rubrics and concept remediation notes.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Search Bar */}
                  <div className="relative">
                    <SearchIcon
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787F8D]"
                    />
                    <input
                      type="text"
                      placeholder="Filter by subject or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] placeholder-[#787F8D] focus:outline-none focus:border-[#1E3A2F] w-48 sm:w-60 transition-colors"
                    />
                  </div>

                  {/* Difficulty Filter */}
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F] transition-colors"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy (Bloom I-II)</option>
                    <option value="medium">Medium (Bloom III-IV)</option>
                    <option value="hard">Hard (Bloom V-VI)</option>
                  </select>
                </div>
              </div>

              {/* Submissions List */}
              {studentLoading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mx-auto mb-2 animate-spin">
                    <RefreshIcon size={15} />
                  </div>
                  <p className="text-xs font-mono text-[#666C7A]">Loading your submissions...</p>
                </div>
              ) : studentError ? (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#FDF2F2] border border-[#E07A7A] text-[#991B1B] flex items-center justify-center mx-auto mb-3">
                    <AlertCircleIcon size={18} />
                  </div>
                  <p className="text-xs text-[#991B1B] font-medium">{studentError}</p>
                  <button
                    type="button"
                    onClick={loadStudentDashboard}
                    className="mt-3 text-xs font-mono underline text-[#1E3A2F]"
                  >
                    Retry loading
                  </button>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                /* Empty State */
                <div className="py-16 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#666C7A] flex items-center justify-center mx-auto mb-3">
                    <BookOpenIcon size={22} />
                  </div>
                  <h3 className="text-lg font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
                    No Test Records Found
                  </h3>
                  <p className="text-xs text-[#575C66] mb-5">
                    {searchQuery || difficultyFilter !== "all"
                      ? "No tests matched your active search query or difficulty filter."
                      : "You have not completed any academic assessments yet. Take your first source-grounded test to calibrate your cognitive profile."}
                  </p>
                  <Link
                    to="/tests"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E3A2F] text-[#FAF9F6] text-xs font-semibold hover:bg-[#162C23] shadow-sm transition-all"
                  >
                    <span>Generate & Take a Test</span>
                    <ArrowRightIcon size={13} />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#ECE7DE]">
                  {filteredSubmissions.map((sub) => {
                    const isExpanded = expandedSubmissionId === sub.id;
                    const dateFormatted = sub.submitted_at
                      ? new Date(sub.submitted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently";

                    return (
                      <div key={sub.id} className="py-4.5 transition-colors">
                        <div
                          className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer group"
                          onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                sub.passed
                                  ? "bg-[#EBF3EE] border-[#CDE1D4] text-[#2D734E]"
                                  : "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                              }`}
                            >
                              {sub.passed ? <CheckCircleIcon size={18} /> : <AlertCircleIcon size={18} />}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-medium text-[#18191B] group-hover:text-[#1E3A2F] transition-colors">
                                  {sub.test?.title || `Test Assessment #${sub.test_id}`}
                                </h4>
                                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#E4DFD5] text-[#575C66]">
                                  {sub.test?.subject || "Curriculum"}
                                </span>
                                <span
                                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                                    sub.test?.difficulty === "hard"
                                      ? "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                                      : sub.test?.difficulty === "medium"
                                      ? "bg-[#F7F5EF] border-[#DDD7CC] text-[#854D0E]"
                                      : "bg-[#EBF3EE] border-[#CDE1D4] text-[#2D734E]"
                                  }`}
                                >
                                  {sub.test?.difficulty || "medium"}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-[#666C7A] mt-1 font-mono">
                                <span>{dateFormatted}</span>
                                <span>•</span>
                                <span>
                                  Raw Score:{" "}
                                  <strong className="text-[#18191B]">
                                    {sub.score} / {sub.total_marks}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Calibration Index:{" "}
                                  <strong className="text-[#1E3A2F]">
                                    {sub.calibration_score}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                            <div className="text-right">
                              <div className="text-lg font-normal font-['Newsreader',serif] text-[#18191B]">
                                {sub.percentage}%
                              </div>
                              <span
                                className={`text-[9px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                                  sub.passed
                                    ? "bg-[#EBF3EE] border-[#CDE1D4] text-[#2D734E]"
                                    : "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                                }`}
                              >
                                {sub.passed ? "PASSED" : "RETAKE NEEDED"}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="w-7 h-7 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center text-[#575C66] group-hover:bg-[#EBF3EE] group-hover:text-[#1E3A2F] transition-all"
                            >
                              <ChevronDownIcon
                                size={14}
                                className={`transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Item Breakdown */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[#ECE7DE] bg-[#F7F5EF]/60 rounded-2xl p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-3 text-xs">
                              <span className="font-semibold text-[#18191B] font-mono uppercase tracking-wider text-[11px]">
                                Item-by-Item Rubric Evaluation ({sub.evaluations?.length || 0} Questions)
                              </span>
                              <span className="text-[11px] font-mono text-[#666C7A]">
                                Passing threshold: {sub.test?.passing_percentage || 40}%
                              </span>
                            </div>

                            {(!sub.evaluations || sub.evaluations.length === 0) ? (
                              <p className="text-xs text-[#666C7A] italic">
                                Detailed answer rubric is archived for this legacy assessment.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {sub.evaluations.map((ev, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#DDD7CC] text-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold text-[#18191B]">
                                          Q{idx + 1}
                                        </span>
                                        <span
                                          className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                                            ev.is_correct
                                              ? "bg-[#EBF3EE] border-[#CDE1D4] text-[#2D734E]"
                                              : "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                                          }`}
                                        >
                                          {ev.is_correct ? "Correct" : "Incorrect"}
                                        </span>
                                        {ev.bloom_level && (
                                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#F3EFE7] text-[#666C7A]">
                                            {ev.bloom_level}
                                          </span>
                                        )}
                                      </div>

                                      <span className="font-mono font-semibold text-[#18191B]">
                                        {ev.points_awarded} / {ev.max_points} pts
                                      </span>
                                    </div>

                                    {ev.explanation && (
                                      <p className="text-[#575C66] text-[11.5px] leading-relaxed pt-1">
                                        <strong className="text-[#18191B] font-medium">Rubric explanation: </strong>
                                        {ev.explanation}
                                      </p>
                                    )}

                                    {ev.source_citation && (
                                      <div className="text-[10px] font-mono text-[#1E3A2F] flex items-center gap-1 pt-0.5">
                                        <BookOpenIcon size={11} />
                                        <span>Grounded Source: {ev.source_citation}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ADMIN DASHBOARD VIEW */}
        {/* ==================================================================== */}
        {isAdmin && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD5]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] text-[11px] font-mono uppercase tracking-wider text-[#1E3A2F] mb-3">
                  <ShieldCheckIcon size={13} />
                  <span>Institutional Oversight Console</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] tracking-tight">
                  Student Registry & <span className="italic font-normal text-[#1E3A2F]">Test Performance</span>
                </h1>
                <p className="text-sm text-[#575C66] mt-1.5 max-w-2xl">
                  Inspect enrolled learner cohorts, monitor Bloom’s cognitive progression, and audit detailed submission rubrics.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={loadAdminDashboard}
                  disabled={adminLoading}
                  className="px-3.5 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#F7F5EF] border border-[#DDD7CC] text-xs font-medium text-[#18191B] flex items-center gap-1.5 transition-colors"
                >
                  <RefreshIcon size={13} className={adminLoading ? "animate-spin" : ""} />
                  <span>Refresh Cohort</span>
                </button>
              </div>
            </div>

            {/* Admin Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[#666C7A] mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider font-mono">
                      Enrolled Students
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] flex items-center justify-center text-[#1E3A2F]">
                      <UsersIcon size={15} />
                    </div>
                  </div>
                  <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                    {students.length}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#ECE7DE]">
                  <span className="text-[11px] text-[#666C7A] font-mono">
                    Active profiles
                  </span>
                  <Link
                    to="/admin/students"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A2F] hover:bg-[#162C23] text-xs font-semibold text-[#FAF9F6] transition-all transform active:scale-95 shadow-sm"
                  >
                    <span>View Students</span>
                    <ArrowRightIcon size={12} />
                  </Link>
                </div>
              </div>

              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[#666C7A] mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider font-mono">
                      Total Submissions
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center text-[#18191B]">
                      <BookOpenIcon size={15} />
                    </div>
                  </div>
                  <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                    {totalSubmissions}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#ECE7DE]">
                  <span className="text-[11px] text-[#666C7A] font-mono">
                    Graded submissions
                  </span>
                  <Link
                    to="/admin/students"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] hover:bg-[#DDF0E3] border border-[#CDE1D4] text-xs font-semibold text-[#1E3A2F] transition-all transform active:scale-95 shadow-sm"
                  >
                    <span>Inspect Tests</span>
                    <ArrowRightIcon size={12} />
                  </Link>
                </div>
              </div>

              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-[#666C7A] mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider font-mono">
                    Cohort Mean Score
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center text-[#18191B]">
                    <BarChartIcon size={15} />
                  </div>
                </div>
                <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                  {students.length > 0
                    ? Math.round(
                        students.reduce((acc, s) => acc + (s.average_score || 0), 0) /
                          students.length
                      )
                    : 0}
                  <span className="text-lg font-mono text-[#666C7A] ml-1">%</span>
                </div>
                <div className="text-[11px] text-[#666C7A] mt-2 font-mono">
                  Weighted cohort performance
                </div>
              </div>

              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-[#666C7A] mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider font-mono">
                    System Calibration
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center text-[#18191B]">
                    <BrainIcon size={15} />
                  </div>
                </div>
                <div className="text-3xl font-normal font-['Newsreader',serif] text-[#18191B]">
                  {students.length > 0
                    ? Math.round(
                        students.reduce((acc, s) => acc + (s.latest_calibration || 50), 0) /
                          students.length
                      )
                    : 50}
                  <span className="text-xs font-mono text-[#666C7A] ml-1">/ 100</span>
                </div>
                <div className="text-[11px] text-[#666C7A] mt-2 font-mono">
                  Mean Bloom cognitive index
                </div>
              </div>
            </div>

            {/* Split Screen: Student List (Left) + Detailed Tests (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Student Registry (5 cols) */}
              <div
                id="student-registry-section"
                className="lg:col-span-5 bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] scroll-mt-24"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#ECE7DE] mb-4">
                  <div>
                    <h3 className="text-lg font-normal font-['Newsreader',serif] text-[#18191B]">
                      Enrolled Students
                    </h3>
                    <p className="text-xs text-[#575C66]">Select a student to view their test dossiers.</p>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B]">
                    {filteredAdminStudents.length} Students
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <SearchIcon
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787F8D]"
                  />
                  <input
                    id="admin-student-search-input"
                    type="text"
                    placeholder="Search by name or email..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] placeholder-[#787F8D] focus:outline-none focus:border-[#1E3A2F] transition-colors"
                  />
                </div>

                {/* List */}
                {adminLoading ? (
                  <div className="py-12 text-center text-xs text-[#666C7A]">
                    <RefreshIcon size={16} className="animate-spin mx-auto mb-2 text-[#1E3A2F]" />
                    <span>Loading student registry...</span>
                  </div>
                ) : adminError ? (
                  <div className="py-8 text-center text-xs text-[#991B1B]">
                    {adminError}
                  </div>
                ) : filteredAdminStudents.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#666C7A]">
                    No students match the search criteria.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {filteredAdminStudents.map((st) => {
                      const isSelected = selectedStudentId === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => fetchStudentDetail(st.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#EBF3EE] border-[#CDE1D4] shadow-sm"
                              : "bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DFD5]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-xs text-[#18191B]">
                              {st.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FFFFFF] border border-[#DDD7CC] text-[#575C66]">
                              ID #{st.id}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#575C66] truncate mb-2">
                            {st.email}
                          </p>

                          <div className="flex items-center justify-between text-[10.5px] font-mono text-[#666C7A] pt-1.5 border-t border-[#ECE7DE]">
                            <span>
                              Tests: <strong className="text-[#18191B]">{st.tests_taken}</strong>
                            </span>
                            <span>
                              Avg: <strong className="text-[#18191B]">{st.average_score}%</strong>
                            </span>
                            <span>
                              Calib: <strong className="text-[#1E3A2F]">{st.latest_calibration}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Selected Student's Test History (7 cols) */}
              <div className="lg:col-span-7 bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[500px]">
                {loadingStudentDetail ? (
                  <div className="py-24 text-center">
                    <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mx-auto mb-2 animate-spin">
                      <RefreshIcon size={15} />
                    </div>
                    <p className="text-xs font-mono text-[#666C7A]">Fetching student dossier & tests...</p>
                  </div>
                ) : !selectedStudentDetails ? (
                  <div className="py-24 text-center max-w-sm mx-auto text-xs text-[#666C7A]">
                    <div className="w-12 h-12 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center mx-auto mb-3">
                      <UsersIcon size={20} className="text-[#575C66]" />
                    </div>
                    <h4 className="text-base font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
                      No Student Selected
                    </h4>
                    <p>Select any student from the left registry to inspect their complete test logs.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Student Dossier Header */}
                    <div className="pb-5 border-b border-[#ECE7DE]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[10px] font-mono uppercase text-[#666C7A] mb-2">
                            <span>Student Dossier</span>
                            <span>•</span>
                            <span>ID #{selectedStudentDetails.student.id}</span>
                          </div>
                          <h3 className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B]">
                            {selectedStudentDetails.student.name}
                          </h3>
                          <p className="text-xs text-[#575C66] mt-0.5">
                            {selectedStudentDetails.student.email}
                          </p>
                        </div>

                        {/* Metric Tickers */}
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-center">
                            <div className="text-[10px] font-mono uppercase text-[#666C7A]">Tests</div>
                            <div className="text-sm font-semibold text-[#18191B] font-mono">
                              {selectedStudentDetails.student.tests_taken}
                            </div>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-[#F7F5EF] border border-[#E4DFD5] text-center">
                            <div className="text-[10px] font-mono uppercase text-[#666C7A]">Avg</div>
                            <div className="text-sm font-semibold text-[#18191B] font-mono">
                              {selectedStudentDetails.student.average_score}%
                            </div>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-[#EBF3EE] border border-[#CDE1D4] text-center">
                            <div className="text-[10px] font-mono uppercase text-[#1E3A2F]">Calibration</div>
                            <div className="text-sm font-semibold text-[#1E3A2F] font-mono">
                              {selectedStudentDetails.student.latest_calibration}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Test List */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider font-mono text-[#18191B]">
                          Test Submissions ({selectedStudentDetails.submissions.length})
                        </h4>
                      </div>

                      {selectedStudentDetails.submissions.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[#666C7A] bg-[#F7F5EF] rounded-2xl border border-[#E4DFD5] p-6">
                          This student has not yet taken any assessments.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedStudentDetails.submissions.map((sub) => {
                            const dateFormatted = sub.submitted_at
                              ? new Date(sub.submitted_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Recently";

                            return (
                              <div
                                key={sub.id}
                                className="p-4 rounded-2xl bg-[#F7F5EF] border border-[#E4DFD5] hover:border-[#DDD7CC] transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-[#18191B]">
                                      {sub.test?.title || `Test #${sub.test_id}`}
                                    </span>
                                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#FFFFFF] border border-[#DDD7CC] text-[#575C66]">
                                      {sub.test?.subject || "General"}
                                    </span>
                                  </div>

                                  <span
                                    className={`text-[9px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                                      sub.passed
                                        ? "bg-[#EBF3EE] border-[#CDE1D4] text-[#2D734E]"
                                        : "bg-[#FDF2F2] border-[#E07A7A] text-[#991B1B]"
                                    }`}
                                  >
                                    {sub.passed ? "PASSED" : "FAILED"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-[#575C66]">
                                  <div className="flex items-center gap-2 font-mono text-[11px]">
                                    <span>{dateFormatted}</span>
                                    <span>•</span>
                                    <span>
                                      Raw: <strong className="text-[#18191B]">{sub.score} / {sub.total_marks}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Calibration: <strong className="text-[#1E3A2F]">{sub.calibration_score}</strong>
                                    </span>
                                  </div>

                                  <div className="text-base font-normal font-['Newsreader',serif] text-[#18191B]">
                                    {sub.percentage}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-[#E4DFD5] mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-[#666C7A]">
        <div className="flex items-center gap-2">
          <GraduationCapIcon size={14} className="text-[#1E3A2F]" />
          <span>IATS Intelligent Academic Testing System &copy; 2026</span>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
          <span>Quiet Luxury Editorial UI</span>
          <span>•</span>
          <span>100% Solid Hex Tokens</span>
        </div>
      </footer>
    </div>
  );
};
