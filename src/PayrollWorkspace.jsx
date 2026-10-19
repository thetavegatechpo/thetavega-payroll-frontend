import React, { useEffect, useMemo, useState } from "react";
import { api, errorText } from "./api";
import {
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileCheck2,
  FileText,
  IndianRupee,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  Calculator,
  Search,
  Check,
  TrendingUp,
  CalendarCheck2,
} from "lucide-react";
// =======================================================
// HELPERS
// =======================================================
const money = (paise) =>
  (Number(paise || 0) / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
const daysInMonth = (year, month) =>
  new Date(year, month, 0).getDate();
const round2 = (number) =>
  Math.round((number + Number.EPSILON) * 100) / 100;
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2026, i, 1).toLocaleString("en-IN", {
    month: "long",
  }),
}));
const initialAttendance = {
  totalLeaves: 0,
  casualLeaveDays: 0,
  weeklyOffDays: 0,
  holidayDays: 0,
  lateMarks: 0,
  earlyLeaves: 0,
  halfDays: 0,
  approvedOverDays: 0,
};
const attendanceFields = [
  {
    key: "totalLeaves",
    label: "Total Leaves",
    hint: "Including paid casual leave",
  },
  {
    key: "casualLeaveDays",
    label: "Paid Casual Leave",
    hint: "Auto-applied: 1 paid CL after 20 equivalent days worked if any leave was taken",
  },
  {
    key: "weeklyOffDays",
    label: "Weekly Offs",
    hint: "Paid weekly rest days",
  },
  {
    key: "holidayDays",
    label: "Paid Holidays",
    hint: "Applicable paid holidays",
  },
  {
    key: "lateMarks",
    label: "Late Marks",
    hint: "Each late mark = 0.25 day",
  },
  {
    key: "earlyLeaves",
    label: "Early Leaves",
    hint: "First 2 free; from 3rd, 25% of daily Gross each. Exclude check-outs before 4 PM already counted as half-days.",
  },
  {
    key: "halfDays",
    label: "Half Days",
    hint: "Each half day = 0.50 day deduction",
  },
  {
    key: "approvedOverDays",
    label: "Approved Overtime Days",
    hint: "Admin-authorized paid days",
  },
];
function calculateAttendance(year, month, a) {
  const calendarDays = daysInMonth(year, month);
  const totalLeaves = Number(a.totalLeaves);
  const weeklyOffDays = Number(a.weeklyOffDays);
  const holidayDays = Number(a.holidayDays);
  const lateMarks = Number(a.lateMarks);
  const earlyLeaves = Number(a.earlyLeaves || 0);
  const approvedOverDays = Number(a.approvedOverDays);
  const halfDays = Number(a.halfDays || 0);
  const presentDays =
    calendarDays -
    totalLeaves -
    weeklyOffDays -
    holidayDays;
  const workedEquivalentDays = presentDays - halfDays * 0.5;
  // The one monthly CL is paid only against a leave already taken.
  // It cannot add another day to the month or create a leave in the bank.
  const casualLeaveDays = workedEquivalentDays >= 20 && totalLeaves >= 1
    ? 1 : 0;
  const unpaidLeaveDays = totalLeaves - casualLeaveDays;
  const latePenaltyDays = round2(lateMarks * 0.25);
  const halfDayPenaltyDays = round2(halfDays * 0.5);
  const totalDeductionDays = round2(
    unpaidLeaveDays + latePenaltyDays + halfDayPenaltyDays
  );
  const basePayableDays = round2(
    calendarDays - totalDeductionDays
  );
  const payableDays = round2(
    basePayableDays + approvedOverDays
  );
  const numbers = [
    totalLeaves,
    casualLeaveDays,
    weeklyOffDays,
    holidayDays,
    lateMarks,
    earlyLeaves,
    halfDays,
    approvedOverDays,
  ];
  let validationError = "";
  if (numbers.some((n) => !Number.isFinite(n) || n < 0)) {
    validationError =
      "Attendance must contain valid non-negative numbers.";
  } else if (!Number.isInteger(halfDays)) {
    validationError = "Half days must be a whole number.";
  } else if (!Number.isInteger(lateMarks)) {
    validationError = "Late marks must be whole numbers.";
  } else if (!Number.isInteger(earlyLeaves)) {
    validationError = "Early leaves must be whole numbers.";
  } else if (earlyLeaves > presentDays - halfDays) {
    validationError = "Early leaves cannot exceed full attendance days (half-days excluded).";
  } else if (casualLeaveDays > (workedEquivalentDays >= 20 ? 1 : 0)) {
    validationError = "One paid casual leave requires 20 equivalent days worked this month.";
  } else if (casualLeaveDays > totalLeaves) {
    validationError =
      "Paid casual leave cannot exceed total leaves.";
  } else if (halfDays > presentDays) {
    validationError = "Half days cannot exceed present days.";
  } else if (presentDays < 0) {
    validationError =
      "Leaves, weekly offs and holidays exceed calendar days.";
  } else if (
    basePayableDays < 0 ||
    payableDays < 0 ||
    payableDays > calendarDays + approvedOverDays
  ) {
    validationError =
      "Invalid payable days. Review attendance values.";
  } else if (approvedOverDays > 31) {
    validationError =
      "Approved overtime days cannot exceed 31.";
  }
  return {
    calendarDays,
    totalLeaves,
    presentDays,
    paidLeaveDays: casualLeaveDays,
    casualLeaveDays,
    workedEquivalentDays,
    unpaidLeaveDays,
    latePenaltyDays,
    earlyLeaves,
    halfDayPenaltyDays,
    totalDeductionDays,
    basePayableDays,
    approvedOverDays,
    payableDays,
    validationError,
  };
}
const deduction = (entry, code) =>
  (entry?.deductions || [])
    .filter((item) => item.code === code)
    .reduce(
      (sum, item) => sum + Number(item.amountPaise || 0),
      0
    );
const contribution = (entry, code) =>
  (entry?.employerContributions || [])
    .filter((item) => item.code === code)
    .reduce(
      (sum, item) => sum + Number(item.amountPaise || 0),
      0
    );
// =======================================================
// REUSABLE UI
// =======================================================
function StatCard({
  icon: Icon,
  label,
  value,
  note,
  accent = "orange",
}) {
  return (
    <div className={`tw-stat tw-stat-${accent}`}>
      <div className="tw-stat-top">
        <span className="tw-stat-label">{label}</span>
        <span className="tw-stat-icon">
          <Icon size={19} />
        </span>
      </div>
      <div className="tw-stat-value">{value}</div>
      {note && <div className="tw-stat-note">{note}</div>}
    </div>
  );
}
function Detail({
  label,
  value,
  strong = false,
  positive = false,
}) {
  return (
    <div className="tw-detail">
      <span>{label}</span>
      <strong
        className={[
          strong ? "tw-detail-strong" : "",
          positive ? "tw-green-text" : "",
        ].join(" ")}
      >
        {value}
      </strong>
    </div>
  );
}
function Workflow({ current }) {
  const steps = [
    { label: "Attendance", icon: CalendarCheck2 },
    { label: "Calculate", icon: Calculator },
    { label: "Payslip", icon: FileCheck2 },
  ];
  return (
    <div className="tw-workflow">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const complete = index < current;
        const active = index === current;
        return (
          <React.Fragment key={step.label}>
            <div
              className={`tw-workflow-step ${
                complete ? "complete" : ""
              } ${active ? "current" : ""}`}
            >
              <span className="tw-workflow-icon">
                {complete ? (
                  <Check size={16} />
                ) : (
                  <Icon size={17} />
                )}
              </span>
              <span className="tw-workflow-label">
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`tw-workflow-line ${
                  complete ? "complete" : ""
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
// =======================================================
// MAIN COMPONENT
// =======================================================
export default function PayrollWorkspace() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState("");
  const [attendance, setAttendance] = useState({
    ...initialAttendance,
  });
  const [attendanceExists, setAttendanceExists] =
    useState(false);
  const [attendanceLoading, setAttendanceLoading] =
    useState(false);
  const [period, setPeriod] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const summary = useMemo(
    () => calculateAttendance(year, month, attendance),
    [year, month, attendance]
  );
  const selectedEntry = entries.find(item => String(item.employee?._id || item.employee) === String(employee));
  const selectedStatus = selectedEntry?.status || "NOT_PROCESSED";
  const locked = ["PENDING_APPROVAL", "APPROVED"].includes(selectedStatus);
  const statusLabel = (status) => ({
    NOT_PROCESSED: "Not processed", DRAFT: "Draft",
    PENDING_APPROVAL: "Pending approval", APPROVED: "Approved"
  }[status] || status);
  const selectedEmployee = employees.find(
    (item) => String(item._id) === String(employee)
  );
  const totalGross = entries.reduce(
    (sum, item) =>
      sum + Number(item.earnedGrossPaise || 0),
    0
  );
  const totalNet = entries.reduce(
    (sum, item) => sum + Number(item.netPaise || 0),
    0
  );
  const totalDeduction = entries.reduce(
    (sum, item) =>
      sum + Number(item.totalDeductionPaise || 0),
    0
  );
  const totalEmployerPF = entries.reduce(
    (sum, item) =>
      sum + contribution(item, "EMPLOYER_PF"),
    0
  );
  const filteredEntries = entries.filter((entry) => {
    const q = search.toLowerCase();
    return (
      String(entry.employeeName || "")
        .toLowerCase()
        .includes(q) ||
      String(entry.employeeCode || "")
        .toLowerCase()
        .includes(q)
    );
  });
  const workflowCurrent = selectedEntry ? 2 : attendanceExists ? 1 : 0;
  // =====================================================
  // LOAD DATA
  // =====================================================
  async function reloadPeriod() {
    const { data } = await api.get(
      `/payroll/period/${year}/${month}`
    );
    setPeriod(data.period || null);
    setEntries(data.entries || []);
  }
  useEffect(() => {
    let active = true;
    api
      .get("/employees?limit=100")
      .then(({ data }) => {
        if (active) setEmployees(data.data || []);
      })
      .catch((err) => {
        if (active) setError(errorText(err));
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setPeriod(null);
    setEntries([]);
    setMessage("");
    setError("");
    api
      .get(`/payroll/period/${year}/${month}`)
      .then(({ data }) => {
        if (!active) return;
        setPeriod(data.period || null);
        setEntries(data.entries || []);
      })
      .catch((err) => {
        if (active) setError(errorText(err));
      });
    return () => {
      active = false;
    };
  }, [year, month]);
  useEffect(() => {
    let active = true;
    setAttendance({ ...initialAttendance });
    setAttendanceExists(false);
    if (!employee) {
      setAttendanceLoading(false);
      return;
    }
    setAttendanceLoading(true);
    api
      .get("/payroll/attendance", {
        params: { year, month },
      })
      .then(({ data }) => {
        if (!active) return;
        const saved = (data || []).find(
          (item) =>
            String(item.employee?._id || item.employee) ===
            String(employee)
        );
        if (!saved) return;
        setAttendance({
          totalLeaves:
            Number(saved.paidLeaveDays || 0) +
            Number(saved.unpaidLeaveDays || 0),
          casualLeaveDays: Number(
            saved.casualLeaveDays || 0
          ),
          weeklyOffDays: Number(
            saved.weeklyOffDays || 0
          ),
          holidayDays: Number(
            saved.holidayDays || 0
          ),
            lateMarks: Number(saved.lateMarks || 0),
            earlyLeaves: Number(saved.earlyLeaves || 0),
          halfDays: Number(saved.halfDays || 0),
          approvedOverDays: Number(
            saved.approvedOverDays || 0
          ),
        });
        setAttendanceExists(true);
      })
      .catch((err) => {
        if (active) setError(errorText(err));
      })
      .finally(() => {
        if (active) setAttendanceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [employee, year, month]);
  // =====================================================
  // ACTIONS
  // =====================================================
  async function action(run) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await run();
      await reloadPeriod();
      setMessage(result || "Saved successfully.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }
  function saveAttendance() {
    if (!employee) {
      setError("Select an employee first.");
      return;
    }
    if (summary.validationError) {
      setError(summary.validationError);
      return;
    }
    action(async () => {
      await api.put(`/payroll/attendance/${employee}`, {
        year,
        month,
        presentDays: summary.presentDays,
        paidLeaveDays: summary.paidLeaveDays,
        unpaidLeaveDays: summary.unpaidLeaveDays,
        weeklyOffDays: Number(attendance.weeklyOffDays),
        holidayDays: Number(attendance.holidayDays),
        casualLeaveDays: summary.casualLeaveDays,
        lateMarks: Number(attendance.lateMarks),
        earlyLeaves: Number(attendance.earlyLeaves),
        halfDays: Number(attendance.halfDays),
        approvedOverDays: Number(
          attendance.approvedOverDays
        ),
      });
      setAttendanceExists(true);
      return "Attendance saved successfully.";
    });
  }
  function calculatePayroll() {
    if (!employee) { setError("Select an employee first."); return; }
    action(async () => {
      const { data } = await api.post(
        "/payroll/calculate",
          { year, month, employeeId: employee }
      );
      const skipped = data.skipped || [];
      return (
        `Payroll finalized for ${data.calculated || 0} employee(s).` +
        (skipped.length
          ? ` Skipped: ${skipped
              .map(
                (item) =>
                  `${item.employeeCode}: ${item.reason}`
              )
              .join(", ")}`
          : "")
      );
    });
  }
  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="tw-payroll">
      {/* HEADER */}
      <div className="tw-page-header">
        <div>
          <div className="tw-eyebrow">
            <span className="tw-eyebrow-dot" />
            PAYROLL OPERATIONS
          </div>
          <h1>Monthly Payroll</h1>
          <p>
            Manage attendance, salary processing and
            approvals in one workspace.
          </p>
        </div>
        <div className="tw-header-actions">
          <div className="tw-period-picker">
            <CalendarDays size={18} />
            <select
              value={month}
              onChange={(e) =>
                setMonth(Number(e.target.value))
              }
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(e) =>
                setYear(Number(e.target.value))
              }
            />
          </div>
          <button
            className="tw-icon-button"
            title="Refresh payroll"
            disabled={loading}
            onClick={() =>
              action(async () => "Payroll refreshed.")
            }
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>
      {/* MESSAGES */}
      {error && (
        <div className="tw-alert tw-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="tw-alert tw-alert-success">
          <CircleCheck size={18} />
          <span>{message}</span>
        </div>
      )}
      {/* SUMMARY BANNER */}
      <div className="tw-hero">
        <div className="tw-hero-content">
          <div className="tw-hero-top">
            <span className="tw-hero-kicker">
              PAYROLL SNAPSHOT
            </span>
            <span className="tw-hero-period">
              {months[month - 1]?.label} {year}
            </span>
          </div>
          <div className="tw-hero-label">
            Total Net Payable
          </div>
          <div className="tw-hero-amount">
            {money(totalNet)}
          </div>
          <div className="tw-hero-bottom">
            <span>
              <Users size={15} />
              {entries.length} employees calculated
            </span>
            <span className="tw-hero-status">
              <span className="tw-status-dot" />
              {employee ? statusLabel(selectedStatus) : "Select employee"}
            </span>
          </div>
        </div>
        <div className="tw-hero-decoration">
          <Wallet size={120} strokeWidth={1} />
        </div>
      </div>
      {/* STATISTICS */}
      <div className="tw-stats">
        <StatCard
          icon={Users}
          label="Employees Processed"
          value={entries.length}
          note="In selected payroll period"
          accent="blue"
        />
        <StatCard
          icon={IndianRupee}
          label="Earned Gross"
          value={money(totalGross)}
          note="Calculated gross wages"
          accent="orange"
        />
        <StatCard
          icon={TrendingUp}
          label="Employee Deductions"
          value={money(totalDeduction)}
          note="PF, PT and other deductions"
          accent="red"
        />
        <StatCard
          icon={ShieldCheck}
          label="Employer PF"
          value={money(totalEmployerPF)}
          note="Shown separately in CTC"
          accent="purple"
        />
      </div>
      {/* WORKFLOW */}
      <section className="tw-panel tw-workflow-panel">
        <div className="tw-section-title">
          <div>
            <h2>Payroll Processing</h2>
            <p>Selected employee payroll approval workflow</p>
          </div>
          <span className="tw-section-tag">
            <Clock3 size={14} />
            {employee ? statusLabel(selectedStatus) : "Select employee"}
          </span>
        </div>
        <Workflow current={workflowCurrent} />
      </section>
      {/* MAIN WORKSPACE */}
      <div className="tw-workspace-grid">
        {/* LEFT SIDE */}
        <section className="tw-panel">
          <div className="tw-section-title">
            <div>
              <div className="tw-section-number">
                STEP 01
              </div>
              <h2>Attendance & Overtime</h2>
              <p>
                Update attendance for the selected employee
              </p>
            </div>
            <CalendarCheck2
              size={22}
              className="tw-section-main-icon"
            />
          </div>
          <label className="tw-field">
            <span>Select Employee</span>
            <select
              value={employee}
              onChange={(e) =>
                setEmployee(e.target.value)
              }
            >
              <option value="">Choose an employee</option>
              {employees.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.employeeCode} —{" "}
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </select>
          </label>
          {selectedEmployee && (
            <div className="tw-employee-mini">
              <div className="tw-employee-avatar">
                {selectedEmployee.firstName?.[0] || ""}
                {selectedEmployee.lastName?.[0] || ""}
              </div>
              <div className="tw-employee-name">
                <strong>
                  {selectedEmployee.firstName}{" "}
                  {selectedEmployee.lastName}
                </strong>
                <span>
                  {selectedEmployee.employeeCode}
                </span>
              </div>
              <span className="tw-mini-active">
                ACTIVE
              </span>
            </div>
          )}
          <div className="tw-form-grid">
            {attendanceFields.map((field) => (
              <label
                className="tw-field"
                key={field.key}
              >
                <span>{field.label}</span>
                <input
                  type="number"
                  min="0"
                  step={
                    ["lateMarks", "earlyLeaves", "halfDays"].includes(field.key)
                      ? "1"
                      : "0.25"
                  }
                  value={field.key === "casualLeaveDays" ? summary.casualLeaveDays : attendance[field.key]}
                  disabled={
                    field.key === "casualLeaveDays" ||
                    !employee ||
                    loading ||
                    attendanceLoading ||
                    locked
                  }
                  onChange={(e) =>
                    setAttendance((previous) => ({
                      ...previous,
                      [field.key]:
                        e.target.value === ""
                          ? 0
                          : Number(e.target.value),
                    }))
                  }
                />
                <small>{field.hint}</small>
              </label>
            ))}
          </div>
          {employee && attendanceLoading && (
            <div className="tw-inline-note">
              Loading employee attendance...
            </div>
          )}
          {employee && !attendanceLoading && (
            <>
              <div className="tw-attendance-preview">
                <div className="tw-preview-heading">
                  <span>Attendance Calculation</span>
                  <span className="tw-preview-month">
                    {summary.calendarDays} calendar days
                  </span>
                </div>
                <Detail
                  label="Present Days"
                  value={summary.presentDays}
                />
                <Detail
                  label="Paid Casual Leave"
                  value={summary.casualLeaveDays}
                />
                <Detail
                  label="Unpaid Leave"
                  value={summary.unpaidLeaveDays}
                />
                <Detail
                  label="Early Leaves"
                  value={`${summary.earlyLeaves} (first 2 free; further penalties deducted in ₹ at payroll calculation)`}
                />
                <Detail
                  label="Late Penalty"
                  value={`${summary.latePenaltyDays} days`}
                />
                  <Detail
                    label="Half Day Penalty"
                    value={`${summary.halfDayPenaltyDays} days`}
                  />
                  <div className="tw-detail-divider" />
                <Detail
                  label="Payable Before Overtime"
                  value={summary.basePayableDays}
                />
                <Detail
                  label="Approved Overtime"
                  value={`+ ${summary.approvedOverDays} days`}
                  positive
                />
                <div className="tw-total-days">
                  <span>Final Payable Days</span>
                  <strong>{summary.payableDays}</strong>
                </div>
                <div className="tw-days-formula">
                  {summary.calendarDays} −{" "}
                  {summary.unpaidLeaveDays} unpaid −{" "}
                  {summary.latePenaltyDays} late −{" "}
                    {summary.halfDayPenaltyDays} half days +{" "}
                  {summary.approvedOverDays} overtime
                  = {summary.payableDays}
                </div>
              </div>
              {summary.validationError && (
                <div className="tw-alert tw-alert-error">
                  <AlertCircle size={16} />
                  {summary.validationError}
                </div>
              )}
              {attendanceExists && (
                <div className="tw-inline-note">
                  <CircleCheck size={15} />
                  Saved attendance found for this employee.
                </div>
              )}
              <button
                className="tw-primary-button tw-save-button"
                disabled={
                  loading ||
                  attendanceLoading ||
                  locked ||
                  Boolean(summary.validationError)
                }
                onClick={saveAttendance}
              >
                <CalendarCheck2 size={17} />
                Save Attendance
                <ArrowUpRight size={16} />
              </button>
            </>
          )}
          {!employee && (
            <div className="tw-empty-employee">
              <Users size={26} />
              <strong>Select an employee</strong>
              <span>
                Attendance details will appear here.
              </span>
            </div>
          )}
        </section>
        {/* RIGHT SIDE */}
        <div className="tw-right-column">
          <section className="tw-panel">
            <div className="tw-section-title">
              <div>
                <div className="tw-section-number">
                  STEP 02
                </div>
                <h2>Salary Processing</h2>
                <p>
                  Calculate payroll for the selected employee
                </p>
              </div>
              <Calculator
                size={22}
                className="tw-section-main-icon"
              />
            </div>
            <div className="tw-processing-info">
              <div className="tw-processing-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>Payroll Calculation Rules</strong>
                <p>
                  Final payable days include approved
                  overtime days. Employee PF is calculated
                  on earned Basic Salary. Employer PF is
                  recorded separately and included in the
                  CTC reconciliation where configured.
                </p>
              </div>
            </div>
            <button
              className="tw-primary-button tw-calculate-button"
              disabled={!employee || loading || attendanceLoading || locked}
              onClick={calculatePayroll}
            >
              <Calculator size={18} />
              {loading
                ? "Processing..."
                : "Calculate & Finalize Employee Payroll"}
              <ChevronRight size={18} />
            </button>
          </section>
          <section className="tw-panel tw-help-panel">
            <div className="tw-help-icon"><CircleCheck size={20} /></div>
            <div><strong>Direct Payroll Processing</strong>
              <p>Save attendance and calculate salary. Successful calculation finalizes this employee's payroll immediately and makes the payslip available. Verify all inputs before calculating; finalized payroll is locked.</p>
            </div>
          </section>
        </div>
      </div>
      {/* PAYROLL SUMMARY */}
      <section className="tw-panel tw-review-panel">
        <div className="tw-section-title tw-review-heading">
          <div>
            <div className="tw-section-number">
              PAYROLL REGISTER
            </div>
            <h2>Employee Payroll Summary</h2>
            <p>
              Salary and statutory deduction breakdown
            </p>
          </div>
          <div className="tw-review-actions">
            <div className="tw-table-search">
              <Search size={16} />
              <input
                placeholder="Search employees..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
            <span className="tw-record-count">
              {filteredEntries.length} Records
            </span>
          </div>
        </div>
        <div className="tw-table-wrap">
          <table className="tw-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>PAYABLE DAYS</th>
                <th>EARNED GROSS</th>
                <th>EMPLOYEE PF</th>
                <th>EMPLOYER PF</th>
                <th>OTHER DEDUCTIONS</th>
                <th>TOTAL DEDUCTIONS</th>
                <th>NET SALARY</th>
                  <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const employeePF = deduction(
                  entry,
                  "PF"
                );
                const employerPF = contribution(
                  entry,
                  "EMPLOYER_PF"
                );
                const otherDeductions =
                  Number(
                    entry.totalDeductionPaise || 0
                  ) - employeePF;
                const initials = String(
                  entry.employeeName || ""
                )
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <tr key={entry._id}>
                    <td>
                      <div className="tw-table-employee">
                        <div className="tw-table-avatar">
                          {initials}
                        </div>
                        <div>
                          <strong>
                            {entry.employeeName}
                          </strong>
                          <span>
                            {entry.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tw-days-pill">
                        {entry.payableDays}
                        <small>
                          / {entry.calendarDays}
                        </small>
                      </span>
                    </td>
                    <td className="tw-money-cell">
                      {money(entry.earnedGrossPaise)}
                    </td>
                    <td className="tw-money-cell">
                      {money(employeePF)}
                    </td>
                    <td className="tw-money-cell">
                      {money(employerPF)}
                    </td>
                    <td className="tw-money-cell">
                      {money(otherDeductions)}
                    </td>
                    <td className="tw-money-cell">
                      {money(entry.totalDeductionPaise)}
                    </td>
                    <td className="tw-money-cell tw-net-cell">
                      {money(entry.netPaise)}
                    </td>
                    <td><span className="tw-days-pill">{statusLabel(entry.status || "DRAFT")}</span></td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="tw-table-empty">
                      <FileText size={28} />
                      <strong>
                        No payroll records found
                      </strong>
                      <span>
                        Save attendance and calculate payroll
                        to view results here.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tw-table-footer">
          <span>
            Employer PF is displayed separately and is
            not an employee deduction.
          </span>
          <strong>
            Total Net Payable: {money(totalNet)}
          </strong>
        </div>
      </section>
      {/* ===================================================
          PAGE-SCOPED STYLING
          =================================================== */}
      <style>{`
        .tw-payroll {
          --tw-orange: #f28a28;
          --tw-navy: #122d3c;
          --tw-text: #192b3b;
          --tw-muted: #8794a3;
          --tw-border: #e8edf2;
          font-family: inherit;
          color: var(--tw-text);
          padding-bottom: 36px;
        }
        .tw-payroll *,
        .tw-payroll *::before,
        .tw-payroll *::after {
          box-sizing: border-box;
        }
        .tw-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .tw-page-header h1 {
          margin: 7px 0 5px;
          font-size: 29px;
          font-weight: 750;
          letter-spacing: -0.8px;
        }
        .tw-page-header p,
        .tw-section-title p {
          margin: 0;
          color: #8b98a7;
          font-size: 13px;
        }
        .tw-eyebrow {
          color: #e87f20;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .tw-eyebrow-dot {
          width: 7px;
          height: 7px;
          background: #f28a28;
          border-radius: 50%;
        }
        .tw-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tw-period-picker {
          display: flex;
          align-items: center;
          gap: 9px;
          background: white;
          border: 1px solid var(--tw-border);
          border-radius: 11px;
          padding: 7px 12px;
          color: #6b7c8e;
        }
        .tw-period-picker select,
        .tw-period-picker input {
          border: 0;
          box-shadow: none;
          outline: none;
          padding: 4px;
          color: #233647;
          background: transparent;
          font-size: 13px;
        }
        .tw-period-picker select {
          width: 120px;
        }
        .tw-period-picker input {
          width: 65px;
        }
        .tw-icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: white;
          color: #425a6e;
          border: 1px solid var(--tw-border);
          border-radius: 11px;
          cursor: pointer;
        }
        .tw-hero {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background: linear-gradient(
            112deg,
            #102e40 0%,
            #1b4556 68%,
            #236477 100%
          );
          color: white;
          padding: 26px 32px;
          margin-bottom: 19px;
          min-height: 175px;
        }
        .tw-hero-content {
          position: relative;
          z-index: 1;
          max-width: 550px;
        }
        .tw-hero-top {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 12px;
        }
        .tw-hero-kicker {
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.5px;
          color: #9bc4d2;
        }
        .tw-hero-period {
          border: 1px solid #ffffff36;
          color: #e7f5fa;
          border-radius: 20px;
          padding: 4px 11px;
          font-size: 11px;
        }
        .tw-hero-label {
          font-size: 13px;
          color: #c1d6df;
          margin-bottom: 3px;
        }
        .tw-hero-amount {
          font-size: clamp(29px, 3vw, 42px);
          font-weight: 800;
          letter-spacing: -1px;
        }
        .tw-hero-bottom {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 13px;
          font-size: 11px;
          color: #d4e3e9;
        }
        .tw-hero-bottom > span {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .tw-hero-status {
          background: #ffffff1b;
          border: 1px solid #ffffff25;
          border-radius: 50px;
          padding: 5px 10px;
          font-weight: 700;
          font-size: 10px;
        }
        .tw-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
        }
        .tw-hero-decoration {
          position: absolute;
          right: 65px;
          top: 20px;
          opacity: 0.12;
          transform: rotate(-12deg);
        }
        .tw-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 19px;
        }
        .tw-stat {
          background: #fff;
          border: 1px solid var(--tw-border);
          border-radius: 15px;
          padding: 17px 18px;
          min-width: 0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .tw-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px #223f5a0b;
        }
        .tw-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .tw-stat-label {
          color: #7e8e9d;
          font-size: 11px;
          font-weight: 650;
        }
        .tw-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .tw-stat-orange .tw-stat-icon {
          color: #e98021;
          background: #fff2e6;
        }
        .tw-stat-blue .tw-stat-icon {
          color: #2b87bd;
          background: #eaf6ff;
        }
        .tw-stat-red .tw-stat-icon {
          color: #e06865;
          background: #fff1f0;
        }
        .tw-stat-purple .tw-stat-icon {
          color: #8b6cd5;
          background: #f3efff;
        }
        .tw-stat-value {
          font-size: clamp(17px, 1.7vw, 25px);
          font-weight: 800;
          letter-spacing: -0.6px;
          margin-top: 11px;
          white-space: nowrap;
        }
        .tw-stat-note {
          color: #a1acb8;
          font-size: 10px;
          margin-top: 5px;
        }
        .tw-panel {
          background: #fff;
          border: 1px solid var(--tw-border);
          border-radius: 16px;
          padding: 23px;
          min-width: 0;
        }
        .tw-workflow-panel {
          margin-bottom: 19px;
        }
        .tw-section-title {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 23px;
        }
        .tw-section-title h2 {
          font-size: 17px;
          letter-spacing: -0.35px;
          margin: 4px 0 5px;
          font-weight: 750;
        }
        .tw-section-number {
          font-size: 10px;
          font-weight: 800;
          color: #ec8325;
          letter-spacing: 1.2px;
        }
        .tw-section-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f2f5f8;
          border: 1px solid #e8edf2;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
        }
        .tw-section-main-icon {
          color: #f28a28;
        }
        .tw-workflow {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 13px;
          border-radius: 12px;
          background: #f7f9fb;
        }
        .tw-workflow-step {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9aa7b4;
          white-space: nowrap;
        }
        .tw-workflow-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 31px;
          height: 31px;
          border-radius: 10px;
          background: white;
          border: 1px solid #e7edf2;
          flex-shrink: 0;
        }
        .tw-workflow-label {
          font-size: 11px;
          font-weight: 650;
        }
        .tw-workflow-step.current {
          color: #d97b24;
        }
        .tw-workflow-step.current .tw-workflow-icon {
          background: #fff0df;
          color: #e88421;
          border-color: #f8d5ae;
        }
        .tw-workflow-step.complete {
          color: #18836c;
        }
        .tw-workflow-step.complete .tw-workflow-icon {
          background: #e3f7f0;
          color: #18836c;
          border-color: #c8ebdf;
        }
        .tw-workflow-line {
          height: 2px;
          background: #dbe4eb;
          flex: 1;
          min-width: 8px;
        }
        .tw-workflow-line.complete {
          background: #25a789;
        }
        .tw-workspace-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.13fr) minmax(0, 0.87fr);
          gap: 19px;
          align-items: start;
          margin-bottom: 19px;
        }
        .tw-right-column {
          display: flex;
          flex-direction: column;
          gap: 19px;
          min-width: 0;
        }
        .tw-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 11px;
          font-weight: 700;
          color: #465b70;
          min-width: 0;
        }
        .tw-field input,
        .tw-field select {
          width: 100%;
          border: 1px solid #e2e9ef;
          border-radius: 9px;
          background: #f9fbfc;
          padding: 11px 12px;
          font-family: inherit;
          font-size: 13px;
          color: #203448;
          outline: none;
          min-height: 42px;
        }
        .tw-field input:focus,
        .tw-field select:focus {
          background: #fff;
          border-color: #e99143;
          box-shadow: 0 0 0 3px #f28a2815;
        }
        .tw-field small {
          font-size: 10px;
          font-weight: 400;
          color: #a0adba;
          line-height: 1.4;
        }
        .tw-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }
        .tw-employee-mini {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 15px;
          padding: 12px;
          border-radius: 12px;
          background: #f5f8fb;
        }
        .tw-employee-avatar,
        .tw-table-avatar {
          background: #fee9d6;
          color: #d57b26;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .tw-employee-avatar {
          width: 42px;
          height: 42px;
          font-size: 13px;
        }
        .tw-employee-name {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }
        .tw-employee-name strong {
          font-size: 12px;
        }
        .tw-employee-name span {
          font-size: 10px;
          color: #8998a6;
        }
        .tw-mini-active {
          font-size: 9px;
          color: #16865e;
          background: #e0f8eb;
          border-radius: 20px;
          padding: 5px 9px;
          font-weight: 800;
        }
        .tw-attendance-preview {
          margin-top: 22px;
          border: 1px solid #e7edf2;
          border-radius: 13px;
          padding: 16px;
          background: #fafcfd;
        }
        .tw-preview-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 11px;
          font-size: 12px;
          font-weight: 800;
        }
        .tw-preview-month {
          font-weight: 500;
          font-size: 10px;
          color: #92a0ae;
        }
        .tw-detail {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
          font-size: 11px;
          color: #7c8b9a;
        }
        .tw-detail strong {
          color: #263c4f;
          font-size: 12px;
        }
        .tw-detail .tw-green-text {
          color: #168e6c;
        }
        .tw-detail-divider {
          height: 1px;
          background: #e6edf2;
          margin: 8px 0;
        }
        .tw-total-days {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
          background: #e8f7ef;
          color: #147b57;
          padding: 13px;
          border-radius: 9px;
        }
        .tw-total-days span {
          font-size: 12px;
          font-weight: 750;
        }
        .tw-total-days strong {
          font-size: 24px;
          font-weight: 850;
        }
        .tw-days-formula {
          color: #8795a3;
          margin-top: 12px;
          font-size: 10px;
          line-height: 1.5;
        }
        .tw-primary-button,
        .tw-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 17px;
          border-radius: 9px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          border: 1px solid transparent;
          transition: filter 0.2s, transform 0.2s;
        }
        .tw-primary-button {
          background: #f28a28;
          color: white;
        }
        .tw-primary-button:not(:disabled):hover {
          filter: brightness(0.96);
          transform: translateY(-1px);
        }
        .tw-secondary-button {
          background: #fff;
          border-color: #e4eaf0;
          color: #42576b;
        }
        .tw-primary-button:disabled,
        .tw-secondary-button:disabled,
        .tw-icon-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          transform: none;
        }
        .tw-save-button {
          width: 100%;
          margin-top: 18px;
        }
        .tw-save-button svg:last-child,
        .tw-calculate-button svg:last-child {
          margin-left: auto;
        }
        .tw-empty-employee {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          margin-top: 22px;
          padding: 36px 12px;
          border: 1px dashed #dbe4eb;
          border-radius: 12px;
          color: #97a4b1;
        }
        .tw-empty-employee strong {
          color: #4c6276;
          font-size: 13px;
        }
        .tw-empty-employee span {
          font-size: 11px;
        }
        .tw-processing-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #f4f9fb;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 18px;
        }
        .tw-processing-icon {
          color: #26869c;
          background: #e4f3f7;
          padding: 10px;
          border-radius: 11px;
          display: flex;
        }
        .tw-processing-info strong,
        .tw-approval-status strong,
        .tw-help-panel strong {
          font-size: 12px;
        }
        .tw-processing-info p,
        .tw-approval-status p,
        .tw-help-panel p {
          color: #8594a2;
          font-size: 11px;
          line-height: 1.7;
          margin: 6px 0 0;
        }
        .tw-calculate-button {
          width: 100%;
        }
        .tw-approval-status {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 15px;
          border: 1px solid #e7edf2;
          border-radius: 12px;
          margin-bottom: 17px;
        }
        .tw-approval-indicator {
          width: 10px;
          height: 10px;
          margin-top: 4px;
          background: #f2aa4c;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tw-approval-indicator.approved {
          background: #24a875;
        }
        .tw-approval-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .tw-help-panel {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 18px;
          background: #fffaf5;
          border-color: #f7e9d8;
        }
        .tw-help-icon {
          color: #e28a2f;
          flex-shrink: 0;
        }
        .tw-review-panel {
          padding: 23px 0 0;
          overflow: hidden;
        }
        .tw-review-heading {
          padding: 0 23px;
        }
        .tw-review-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tw-table-search {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #f7f9fb;
          border: 1px solid #e7edf2;
          padding: 8px 10px;
          border-radius: 9px;
          color: #8998a6;
        }
        .tw-table-search input {
          border: 0;
          background: transparent;
          outline: none;
          width: 155px;
          font-size: 11px;
        }
        .tw-record-count {
          background: #eff5f8;
          color: #5f7a8b;
          border-radius: 20px;
          padding: 8px 12px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }
        .tw-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .tw-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
          font-size: 11px;
        }
        .tw-table thead {
          background: #f7f9fb;
        }
        .tw-table th {
          color: #8d9aa8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-align: left;
          padding: 15px 14px;
          white-space: nowrap;
        }
        .tw-table td {
          padding: 14px;
          border-bottom: 1px solid #eef1f4;
          color: #44596a;
          white-space: nowrap;
        }
        .tw-table tbody tr:hover {
          background: #fafcfd;
        }
        .tw-table-employee {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tw-table-avatar {
          width: 36px;
          height: 36px;
          font-size: 11px;
        }
        .tw-table-employee > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tw-table-employee strong {
          color: #25394a;
          font-size: 11px;
        }
        .tw-table-employee span {
          color: #9aa7b3;
          font-size: 10px;
        }
        .tw-days-pill {
          background: #eef7f5;
          color: #18866e;
          padding: 7px 10px;
          border-radius: 20px;
          font-weight: 750;
        }
        .tw-days-pill small {
          opacity: 0.7;
          font-size: 10px;
        }
        .tw-money-cell {
          font-variant-numeric: tabular-nums;
        }
        .tw-net-cell {
          color: #138360 !important;
          font-weight: 850;
        }
        .tw-table-empty {
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 8px;
          padding: 38px 0;
          color: #97a6b4;
        }
        .tw-table-empty strong {
          color: #54697b;
        }
        .tw-table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 17px 23px;
          font-size: 11px;
          color: #8997a5;
        }
        .tw-table-footer strong {
          color: #157e60;
          font-size: 13px;
        }
        .tw-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 15px;
          font-size: 12px;
          line-height: 1.5;
        }
        .tw-alert-error {
          background: #fff1ef;
          color: #c6443c;
          border: 1px solid #ffd9d5;
        }
        .tw-alert-success {
          background: #eaf9f1;
          color: #167b56;
          border: 1px solid #cfecdb;
        }
        .tw-inline-note {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 13px;
          font-size: 11px;
          color: #668a7c;
        }
        @media (max-width: 1280px) {
          .tw-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .tw-workspace-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 800px) {
          .tw-hero {
            padding: 24px;
          }
          .tw-hero-decoration {
            right: -20px;
          }
          .tw-workflow-label {
            display: none;
          }
          .tw-workflow {
            justify-content: space-between;
          }
          .tw-workflow-line {
            min-width: 5px;
          }
          .tw-review-heading {
            flex-direction: column;
            align-items: stretch;
          }
          .tw-review-actions,
          .tw-table-search {
            width: 100%;
          }
          .tw-table-search input {
            width: 100%;
          }
        }
        @media (max-width: 520px) {
          .tw-page-header h1 {
            font-size: 24px;
          }
          .tw-stats,
          .tw-form-grid {
            grid-template-columns: 1fr;
          }
          .tw-panel {
            padding: 18px;
          }
          .tw-review-panel {
            padding: 18px 0 0;
          }
          .tw-approval-actions {
            grid-template-columns: 1fr;
          }
          .tw-period-picker {
            max-width: 100%;
          }
          .tw-table-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
