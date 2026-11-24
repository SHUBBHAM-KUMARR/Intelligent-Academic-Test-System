import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  api,
  type StudentSummary,
  type SubmissionItem,
} from "../services/api";
import {
  GraduationCapIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  SearchIcon,
  LogOutIcon,
  BookOpenIcon,
  RefreshIcon,
  UsersIcon,
  XIcon,
} from "../components/Icons";

export const AdminStudentsPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Role detection
  const isAdmin = user?.role === "admin" || user?.role === "educator";

  // Data states
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "tests" | "score" | "calibration">("name");

  // Selected student for detailed dossier modal
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/auth?mode=login", { replace: true });
      } else if (!isAdmin) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  // Load students list
  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminStudents();
      setStudents(data.students || []);
      setTotalSubmissions(data.total_submissions || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load student registry";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadStudents();
    }
  }, [isAuthenticated, isAdmin]);

  // Open dossier modal and load submissions for a student
  const handleOpenDossier = async (student: StudentSummary) => {
    setSelectedStudent(student);
    setLoadingSubmissions(true);
    try {
      const data = await api.getAdminStudentSubmissions(student.id);
      setStudentSubmissions(data.submissions || []);
    } catch (err: unknown) {
      console.error("Failed to fetch student submissions:", err);
      setStudentSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Close dossier modal
  const handleCloseDossier = () => {
    setSelectedStudent(null);
    setStudentSubmissions([]);
  };

  // Bloom Calibration Tier Helper
  const getCalibrationTier = (score: number) => {
    if (score >= 80) return { label: "Cognitive Mastery", bg: "bg-[#EBF3EE]", text: "text-[#1E3A2F]", border: "border-[#CDE1D4]" };
    if (score >= 65) return { label: "Advanced Synthesis", bg: "bg-[#EBF3EE]", text: "text-[#2D734E]", border: "border-[#CDE1D4]" };
    if (score >= 50) return { label: "Proficient Baseline", bg: "bg-[#F7F5EF]", text: "text-[#18191B]", border: "border-[#DDD7CC]" };
    return { label: "Foundational", bg: "bg-[#F3EFE7]", text: "text-[#666C7A]", border: "border-[#E4DFD5]" };
  };

  // Filtered & Sorted students
  const filteredStudents = useMemo(() => {
    let result = students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "tests") return b.tests_taken - a.tests_taken;
      if (sortBy === "score") return (b.average_score || 0) - (a.average_score || 0);
      if (sortBy === "calibration") return (b.latest_calibration || 50) - (a.latest_calibration || 50);
      return 0;
    });

    return result;
  }, [students, searchQuery, sortBy]);

  // Overall Cohort Metrics
  const cohortMeanScore = useMemo(() => {
    if (students.length === 0) return 0;
    const total = students.reduce((acc, s) => acc + (s.average_score || 0), 0);
    return Math.round(total / students.length);
  }, [students]);

  const cohortMeanCalibration = useMemo(() => {
    if (students.length === 0) return 50.0;
    const total = students.reduce((acc, s) => acc + (s.latest_calibration || 50), 0);
    return Math.round((total / students.length) * 10) / 10;
  }, [students]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] flex items-center justify-center text-[#1E3A2F] animate-spin">
            <RefreshIcon size={18} />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#666C7A]">
            Verifying Admin Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin || !user) {
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
                  Admin Console
                </span>
              </div>
            </Link>

            {/* Middle Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className="text-[13px] font-medium text-[#575C66] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F7F5EF] transition-colors flex items-center gap-1.5"
              >
                <ShieldCheckIcon size={14} />
                <span>Dashboard</span>
              </Link>
              <span className="text-[13px] font-semibold text-[#1E3A2F] px-3.5 py-1.5 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] flex items-center gap-1.5">
                <UsersIcon size={14} />
                <span>Student Registry</span>
              </span>
              <Link
                to="/tests"
                className="text-[13px] font-medium text-[#575C66] hover:text-[#18191B] px-3.5 py-1.5 rounded-full hover:bg-[#F7F5EF] transition-colors flex items-center gap-1.5"
              >
                <BookOpenIcon size={14} />
                <span>Testing Center</span>
              </Link>
            </div>

            {/* Profile Pill & Sign Out */}
            <div className="flex items-center gap-2.5">
              <Link
                to="/dashboard"
                title="Go to Dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] hover:border-[#DDD7CC] transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-[#1E3A2F] flex items-center justify-center text-[11px] font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#18191B] max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD7CC] text-[#575C66]">
                  {user.role}
                </span>
              </Link>

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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-8 animate-in fade-in duration-300">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD5]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] text-[11px] font-mono uppercase tracking-wider text-[#1E3A2F] mb-3">
              <UsersIcon size={13} />
              <span>Institutional Student Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal font-['Newsreader',serif] text-[#18191B] tracking-tight">
              Enrolled <span className="italic font-normal text-[#1E3A2F]">Student Profiles</span> & Performance
            </h1>
            <p className="text-sm text-[#575C66] mt-1.5 max-w-2xl">
              Inspect student cognitive calibration levels, audit individual test histories, and track academic progression across uniform learner cards.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#F7F5EF] border border-[#DDD7CC] text-xs font-semibold text-[#18191B] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ShieldCheckIcon size={13} />
              <span>Back to Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={loadStudents}
              disabled={loading}
              className="px-3.5 py-2 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshIcon size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh Directory</span>
            </button>
          </div>
        </div>

        {/* Metric Ticker Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="text-[10px] font-mono uppercase text-[#666C7A]">Total Students</div>
            <div className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B] mt-1">
              {students.length}
            </div>
            <div className="text-[10px] font-mono text-[#666C7A] mt-1">Active registrations</div>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="text-[10px] font-mono uppercase text-[#666C7A]">Total Submissions</div>
            <div className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B] mt-1">
              {totalSubmissions}
            </div>
            <div className="text-[10px] font-mono text-[#666C7A] mt-1">Evaluated across all tests</div>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="text-[10px] font-mono uppercase text-[#666C7A]">Cohort Mean Score</div>
            <div className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B] mt-1">
              {cohortMeanScore}%
            </div>
            <div className="text-[10px] font-mono text-[#666C7A] mt-1">Average student grade</div>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="text-[10px] font-mono uppercase text-[#666C7A]">Mean Calibration</div>
            <div className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B] mt-1">
              {cohortMeanCalibration}
              <span className="text-xs font-mono text-[#666C7A] ml-1">/ 100</span>
            </div>
            <div className="text-[10px] font-mono text-[#1E3A2F] mt-1">Bloom cognitive index</div>
          </div>
        </div>

        {/* Search, Filter, and Sort Toolbar */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDD7CC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <SearchIcon
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#787F8D]"
            />
            <input
              type="text"
              placeholder="Search by student name, email, or roll ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] placeholder-[#787F8D] focus:outline-none focus:border-[#1E3A2F] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-[#666C7A] uppercase">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "tests" | "score" | "calibration")}
              className="px-3 py-1.5 text-xs rounded-full bg-[#F7F5EF] border border-[#E4DFD5] text-[#18191B] focus:outline-none focus:border-[#1E3A2F] transition-colors"
            >
              <option value="name">Alphabetical (Name)</option>
              <option value="tests">Most Tests Taken</option>
              <option value="score">Highest Average Score</option>
              <option value="calibration">Bloom Calibration Index</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#E07A7A] text-xs text-[#991B1B] flex items-center gap-2">
            <AlertCircleIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Students Cards Grid (Same-Size Cards) */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 rounded-full bg-[#EBF3EE] border border-[#D2E3D8] text-[#1E3A2F] flex items-center justify-center mx-auto mb-2 animate-spin">
              <RefreshIcon size={15} />
            </div>
            <p className="text-xs font-mono text-[#666C7A]">Loading student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-8">
            <div className="w-12 h-12 rounded-full bg-[#F7F5EF] border border-[#E4DFD5] flex items-center justify-center mx-auto mb-3 text-[#666C7A]">
              <UsersIcon size={20} />
            </div>
            <h3 className="text-base font-normal font-['Newsreader',serif] text-[#18191B] mb-1">
              No Students Found
            </h3>
            <p className="text-xs text-[#575C66]">
              {searchQuery
                ? `No students matched the query "${searchQuery}".`
                : "No student accounts are currently enrolled in the institution."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => {
              const tier = getCalibrationTier(student.latest_calibration || 50);
              const enrolledDate = student.enrolled_at
                ? new Date(student.enrolled_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Enrolled";

              return (
                <div
                  key={student.id}
                  className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#1E3A2F] transition-all flex flex-col justify-between h-[340px] group"
                >
                  {/* Top: Avatar, Name & Roll ID */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] border border-[#CDE1D4] text-[#1E3A2F] flex items-center justify-center text-sm font-semibold font-mono shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-normal font-['Newsreader',serif] text-[#18191B] truncate group-hover:text-[#1E3A2F] transition-colors">
                            {student.name}
                          </h3>
                          <p className="text-xs text-[#575C66] truncate">{student.email}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#E4DFD5] text-[#666C7A] shrink-0">
                        ID #{student.id}
                      </span>
                    </div>

                    {/* Middle: 3-Metric Uniform Block */}
                    <div className="p-3.5 rounded-2xl bg-[#F7F5EF] border border-[#E4DFD5] grid grid-cols-3 gap-2 text-center my-3">
                      <div>
                        <div className="text-[9.5px] font-mono uppercase text-[#666C7A]">Tests</div>
                        <div className="text-sm font-semibold text-[#18191B] font-mono mt-0.5">
                          {student.tests_taken}
                        </div>
                        <div className="text-[9px] font-mono text-[#2D734E]">
                          {student.tests_passed} passed
                        </div>
                      </div>

                      <div className="border-x border-[#E4DFD5]">
                        <div className="text-[9.5px] font-mono uppercase text-[#666C7A]">Avg Score</div>
                        <div className="text-sm font-semibold text-[#18191B] font-mono mt-0.5">
                          {student.average_score}%
                        </div>
                        <div className="text-[9px] font-mono text-[#666C7A]">Mean grade</div>
                      </div>

                      <div>
                        <div className="text-[9.5px] font-mono uppercase text-[#666C7A]">Calibration</div>
                        <div className="text-sm font-semibold text-[#1E3A2F] font-mono mt-0.5">
                          {student.latest_calibration || 50}
                        </div>
                        <div className="text-[9px] font-mono text-[#666C7A]">Index</div>
                      </div>
                    </div>

                    {/* Calibration Tier Badge & Enrollment */}
                    <div className="flex items-center justify-between text-[10.5px] font-mono pt-1">
                      <span className={`px-2 py-0.5 rounded border ${tier.bg} ${tier.text} ${tier.border} font-semibold uppercase text-[9.5px]`}>
                        {tier.label}
                      </span>
                      <span className="text-[#787F8D]">Since {enrolledDate}</span>
                    </div>
                  </div>

                  {/* Bottom: Action Button */}
                  <div className="pt-3 border-t border-[#ECE7DE]">
                    <button
                      type="button"
                      onClick={() => handleOpenDossier(student)}
                      className="w-full py-2.5 rounded-full bg-[#1E3A2F] text-[#FAF9F6] hover:bg-[#162C23] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <BookOpenIcon size={13} />
                      <span>View Assessment Dossier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Student Assessment Dossier */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDD7CC] p-6 sm:p-8 max-w-2xl w-full shadow-[0_16px_48px_rgba(0,0,0,0.12)] space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#ECE7DE]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EBF3EE] border border-[#CDE1D4] text-[10px] font-mono uppercase text-[#1E3A2F] mb-2 font-semibold">
                    <span>Student Assessment Dossier</span>
                    <span>•</span>
                    <span>Roll #{selectedStudent.id}</span>
                  </div>
                  <h2 className="text-2xl font-normal font-['Newsreader',serif] text-[#18191B]">
                    {selectedStudent.name}
                  </h2>
                  <p className="text-xs text-[#575C66] mt-0.5">{selectedStudent.email}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDossier}
                  className="p-2 rounded-full text-[#666C7A] hover:text-[#18191B] hover:bg-[#F7F5EF] transition-colors"
                >
                  <XIcon size={18} />
                </button>
              </div>

              {/* Student Overview Strip */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#F7F5EF] border border-[#E4DFD5] text-center text-xs">
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#666C7A]">Tests Taken</div>
                  <div className="text-base font-semibold text-[#18191B] font-mono mt-0.5">
                    {selectedStudent.tests_taken}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#666C7A]">Average Score</div>
                  <div className="text-base font-semibold text-[#18191B] font-mono mt-0.5">
                    {selectedStudent.average_score}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#1E3A2F]">Bloom Calibration</div>
                  <div className="text-base font-semibold text-[#1E3A2F] font-mono mt-0.5">
                    {selectedStudent.latest_calibration || 50}
                  </div>
                </div>
              </div>

              {/* Tests Submissions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono uppercase font-semibold text-[#18191B]">
                  <span>Completed Tests ({studentSubmissions.length})</span>
                </div>

                {loadingSubmissions ? (
                  <div className="py-12 text-center text-xs font-mono text-[#666C7A]">
                    <RefreshIcon size={16} className="animate-spin mx-auto mb-2 text-[#1E3A2F]" />
                    <span>Loading student's completed tests...</span>
                  </div>
                ) : studentSubmissions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#666C7A] bg-[#F7F5EF] rounded-2xl border border-[#E4DFD5] p-5">
                    This student has not yet completed any assessments.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {studentSubmissions.map((sub) => {
                      const dateStr = sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recently";

                      return (
                        <div
                          key={sub.id}
                          className="p-4 rounded-2xl bg-[#F7F5EF] border border-[#E4DFD5] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#18191B]">
                                {sub.test?.title || `Test Assessment #${sub.test_id}`}
                              </span>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#FFFFFF] border border-[#DDD7CC] text-[#575C66]">
                                {sub.test?.subject || "Curriculum"}
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

                          <div className="flex items-center justify-between text-xs text-[#666C7A] font-mono text-[11px]">
                            <span>{dateStr}</span>
                            <span>
                              Raw: <strong className="text-[#18191B]">{sub.score} / {sub.total_marks}</strong>
                            </span>
                            <span>
                              Calibration: <strong className="text-[#1E3A2F]">{sub.calibration_score}</strong>
                            </span>
                            <span className="text-sm font-normal font-['Newsreader',serif] text-[#18191B]">
                              {sub.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={handleCloseDossier}
                  className="px-5 py-2 rounded-full bg-[#FFFFFF] border border-[#DDD7CC] hover:bg-[#F7F5EF] text-xs font-semibold text-[#18191B] transition-colors"
                >
                  Close Dossier
                </button>
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
     
      </footer>
    </div>
  );
};
