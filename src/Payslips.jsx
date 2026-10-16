import React, { useEffect, useMemo, useState } from "react";



import { api, errorText } from "./api";



import {



  FileText, Printer, Search, CalendarDays, UserRound,



  Wallet, ShieldCheck, ChevronRight, AlertCircle,



  CheckCircle2, RefreshCw, ReceiptText



} from "lucide-react";







const fmt = (paise) => (Number(paise || 0) / 100).toLocaleString("en-IN", {



  style: "currency", currency: "INR"



});



const monthTitle = (year, month) => new Date(year, month - 1, 1)



  .toLocaleDateString("en-IN", { month: "long", year: "numeric" });



const getAmount = (items, code) => (items || [])



  .filter((x) => String(x.code || "").toUpperCase() === code)



  .reduce((sum, x) => sum + Number(x.amountPaise || 0), 0);



const shortDate = (value) => value ? new Date(value).toLocaleDateString("en-IN") : "—";







function NumberTile({ label, value, icon: Icon, emphasis = false }) {



  return <div className={"ps-stat " + (emphasis ? "ps-stat-focus" : "")}>



    <div className="ps-stat-heading"><span>{label}</span><Icon size={17} /></div>



    <strong>{value}</strong>



  </div>;



}







export default function Payslips() {



  const today = new Date();



  const [year, setYear] = useState(today.getFullYear());



  const [month, setMonth] = useState(today.getMonth() + 1);



  const [employees, setEmployees] = useState([]);



  const [employee, setEmployee] = useState("");



  const [slip, setSlip] = useState(null);



  const [statement, setStatement] = useState(null);



  const [from, setFrom] = useState(`${today.getFullYear()}-01`);



  const [to, setTo] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);



  const [error, setError] = useState("");



  const [message, setMessage] = useState("");



  const [loading, setLoading] = useState(false);



  const [loadingStatement, setLoadingStatement] = useState(false);



  const [printSection, setPrintSection] = useState("slip");



  const [tab, setTab] = useState("slip");







  useEffect(() => {



    let live = true;



    api.get("/employees?limit=100")



      .then((r) => { if (live) setEmployees(r.data.data || []); })



      .catch((e) => { if (live) setError(errorText(e)); });



    return () => { live = false; };



  }, []);



  useEffect(() => { setSlip(null); setMessage(""); }, [employee, year, month]);



  useEffect(() => { setStatement(null); }, [employee, from, to]);







  async function loadSlip() {



    if (!employee) return;



    setError(""); setMessage(""); setSlip(null); setLoading(true);



    try {



      const { data } = await api.get(`/payslips/${year}/${month}/${employee}`);



      setSlip(data);



      setTab("slip");



    } catch (e) { setError(errorText(e)); }



    finally { setLoading(false); }



  }







  async function loadStatement() {



    if (!employee) { setError("Select an employee first."); return; }



    if (!from || !to || from > to) { setError("Select a valid From / To date range."); return; }



    setError(""); setMessage(""); setStatement(null); setLoadingStatement(true);



    try {



      const { data } = await api.get(`/payslips/statement/${employee}`, { params: { from, to } });



      setStatement(data);



      setTab("statement");



    } catch (e) { setError(errorText(e)); }



    finally { setLoadingStatement(false); }



  }







  function print(kind) {



    setPrintSection(kind);



    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));



  }







  const entry = slip?.entry;



  const earnings = entry?.components || [];



  const deductions = entry?.deductions || [];



  const employerPF = getAmount(entry?.employerContributions, "EMPLOYER_PF");



  const employeePF = getAmount(deductions, "PF");



  const isCtcIncluded = entry?.policySnapshot?.employerPfIncludedInCtc === true;



  const earnedCtc = Number(entry?.attendanceSnapshot?.earnedCtcPaise || 0) ||



    (isCtcIncluded ? Number(entry?.earnedGrossPaise || 0) + employerPF : 0);



  const overtimeDays = Number(entry?.attendanceSnapshot?.approvedOverDays || 0);



  // Print-only CTC columns. Does not alter the displayed page or payroll figures.

  const printMonthlyCtc = Number(entry?.monthlyGrossPaise || 0);

  const printCalendarDays = Number(entry?.calendarDays || 0);

  const printPayableDays = Number(entry?.payableDays || 0);

  const printCtcRatio = printCalendarDays > 0 && printPayableDays > 0

    ? printPayableDays / printCalendarDays : 0;

  const printOriginalComponents = earnings.map((item) => {

    const code = String(item.code || "").toUpperCase();

    const earned = Number(item.amountPaise || 0);

    // In CTC-inclusive payroll, employer PF is allocated within OTHER.

    const ctcEarnedComponent = earned +

      (isCtcIncluded && code === "OTHER" ? employerPF : 0);

    const savedMonthly = [

      item.monthlyAmountPaise, item.actualMonthlyPaise,

      item.originalAmountPaise, item.configuredAmountPaise

    ].find((value) => value !== undefined && value !== null);

    return {

      ...item,

      actualPaise: savedMonthly != null ? Number(savedMonthly)

        : (printCtcRatio > 0 ? Math.round(ctcEarnedComponent / printCtcRatio) : null),

      hasSavedMonthly: savedMonthly != null,

    };

  });

  const printActualTotal = printMonthlyCtc > 0 ? printMonthlyCtc

    : printOriginalComponents.every((item) => item.actualPaise != null)

      ? printOriginalComponents.reduce((sum, item) => sum + item.actualPaise, 0) : null;

  const printIsEstimated = printOriginalComponents.some((item) => !item.hasSavedMonthly);

  const maxRows = Math.max(earnings.length, deductions.length, 1);



  const selectedPerson = useMemo(() => employees.find((e) => e._id === employee), [employees, employee]);



  const monthlyRows = statement?.periods || [];



  const statementTotal = monthlyRows.reduce((sum, p) => sum + Number(p.entry?.netPaise || 0), 0);







  return <div className="ps-page">



    <style>{`



      .ps-page{--ps-border:#e5ebf0;--ps-text:#183044;--ps-muted:#8393a3;--ps-orange:#f28a29;color:var(--ps-text);padding-bottom:34px}



      .ps-page *{box-sizing:border-box}.ps-head{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap}



      .ps-kicker{font-size:10px;font-weight:800;letter-spacing:1.7px;color:#e67c1b}.ps-head h1{font-size:29px;letter-spacing:-.8px;margin:6px 0}.ps-head p{font-size:13px;color:var(--ps-muted);margin:0}



      .ps-header-action,.ps-btn{display:inline-flex;gap:8px;align-items:center;justify-content:center;border-radius:10px;font-size:12px;font-weight:750;padding:11px 16px;border:1px solid var(--ps-border);cursor:pointer;background:#fff;color:#355065;font-family:inherit}



      .ps-btn.primary,.ps-header-action{background:var(--ps-orange);border-color:var(--ps-orange);color:#fff}.ps-btn:disabled{opacity:.5;cursor:not-allowed}



      .ps-header-action{text-decoration:none}.ps-panel{background:#fff;border:1px solid var(--ps-border);border-radius:17px;padding:23px;box-shadow:0 5px 25px #17324407}



      .ps-section-title{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:19px;flex-wrap:wrap}.ps-section-title h2{font-size:16px;letter-spacing:-.3px;margin:0}.ps-section-title small{font-size:11px;color:var(--ps-muted)}



      .ps-filters{display:grid;grid-template-columns:minmax(200px,2fr) minmax(90px,0.7fr) minmax(130px,1fr) auto;gap:12px;align-items:end}



      .ps-field{display:flex;flex-direction:column;gap:7px;min-width:0}.ps-field>span{font-size:11px;font-weight:700;color:#5e7285}.ps-field input,.ps-field select{min-width:0;width:100%;height:42px;border:1px solid #e0e7ed;background:#f9fbfc;border-radius:9px;padding:8px 11px;font-size:12px;color:#233c4d;outline:none}



      .ps-field input:focus,.ps-field select:focus{border-color:var(--ps-orange);background:white}.ps-filter-action{height:42px;white-space:nowrap}



      .ps-tabs{display:flex;gap:5px;border-bottom:1px solid var(--ps-border);margin:22px 0 18px}.ps-tab{border:0;background:transparent;color:#8493a0;font-size:12px;font-weight:750;padding:12px 17px;cursor:pointer;border-bottom:2px solid transparent}.ps-tab.active{color:#e67c1b;border-bottom-color:#f28a29}



      .ps-alert{display:flex;gap:10px;align-items:center;border-radius:11px;padding:13px 16px;margin:14px 0;font-size:12px}.ps-alert.error{background:#fff1ef;color:#b74139;border:1px solid #f8d5d1}.ps-alert.success{background:#edfbf4;color:#13835a;border:1px solid #caead8}



      .ps-stat-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin:18px 0}.ps-stat{background:#fff;border:1px solid var(--ps-border);border-radius:14px;padding:18px;min-width:0}.ps-stat-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;color:#7e8e9e;font-size:11px;font-weight:650}.ps-stat-heading svg{color:#e7872d}.ps-stat strong{display:block;margin-top:12px;font-size:clamp(17px,1.8vw,24px);letter-spacing:-.5px;white-space:nowrap}.ps-stat-focus{background:linear-gradient(120deg,#113547,#205568);color:white;border:0}.ps-stat-focus .ps-stat-heading{color:#bcd1dd}.ps-stat-focus svg{color:#bcd1dd}



      .ps-content-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(240px,.75fr);gap:18px;align-items:start}.ps-slip{background:#fff;border:1px solid var(--ps-border);border-radius:16px;padding:26px;min-width:0}.ps-slip-top{display:flex;justify-content:space-between;align-items:start;gap:12px;border-bottom:2px solid #e8ecf0;padding-bottom:16px;margin-bottom:15px}



      .ps-brand{font-size:20px;font-weight:900;letter-spacing:1px;color:#de7b28}.ps-slip-top small{display:block;color:#708394;font-size:10px;margin-top:3px}.ps-slip-title{text-align:right}.ps-slip-title strong{display:block;font-size:16px}.ps-slip-title span{font-size:12px;color:#7e90a0}



      .ps-slip-table{width:100%;border-collapse:collapse;font-size:11px;margin:13px 0}.ps-slip-table th,.ps-slip-table td{border:1px solid #e1e7ec;padding:8px 9px;text-align:left;vertical-align:top}.ps-slip-table th{background:#f5f8fa;font-size:10px;text-transform:uppercase;letter-spacing:.4px}.ps-slip-table .amount{text-align:right;white-space:nowrap}.ps-slip-table .total-row{background:#f6f9fa;font-weight:800}.ps-slip-table .key{color:#647687;width:21%}



      .ps-net{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#eaf8f1;color:#137953;padding:14px 16px;border-radius:9px;font-size:13px;font-weight:800}.ps-net strong{font-size:21px}



      .ps-slip-note{font-size:10px;color:#64798b;line-height:1.7;margin-top:12px}.ps-slip-footer{border-top:1px solid #e8edf2;margin-top:17px;padding-top:13px;text-align:center;font-size:10px;color:#94a1ae}



      .ps-side{display:grid;gap:16px}.ps-side-card{padding:20px;background:#fff;border:1px solid var(--ps-border);border-radius:15px}.ps-side-card h3{font-size:13px;margin:0 0 15px}.ps-person{display:flex;align-items:center;gap:11px;margin-bottom:15px}.ps-avatar{height:45px;width:45px;border-radius:14px;background:#ffebda;color:#d47724;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center}.ps-person strong{font-size:13px}.ps-person span{display:block;color:#91a0ac;font-size:11px;margin-top:3px}.ps-side-line{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #f0f2f4;padding:10px 0;font-size:11px}.ps-side-line>span{color:#82919e}.ps-side-line>b{font-weight:750;text-align:right}.ps-side-card .ps-btn{width:100%;margin-top:15px}



      .ps-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;min-height:280px;border:1px dashed #dce5eb;border-radius:15px;color:#96a5b1;padding:30px}.ps-placeholder h3{color:#3f5567;margin:0;font-size:16px}.ps-placeholder p{max-width:340px;font-size:12px;line-height:1.6;margin:0}



      .ps-statement-filters{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:16px}.ps-statement-filters .ps-field{min-width:140px}.ps-table-wrap{overflow:auto}.ps-statement-table{border-collapse:collapse;width:100%;min-width:680px;font-size:12px}.ps-statement-table th{text-align:left;color:#8493a2;font-size:10px;letter-spacing:.5px;background:#f7f9fb;padding:14px}.ps-statement-table td{padding:14px;border-bottom:1px solid #edf1f4}.ps-statement-table td:last-child{font-weight:800;color:#148460}



      .ps-statement-footer{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-top:16px;padding:14px;background:#f3faf6;border-radius:10px}.ps-statement-footer strong{color:#13805a}



      @media(max-width:1180px){.ps-content-grid{grid-template-columns:1fr}.ps-side{grid-template-columns:repeat(2,minmax(0,1fr))}.ps-stat-row{grid-template-columns:repeat(2,minmax(0,1fr))}}



      @media(max-width:720px){.ps-filters{grid-template-columns:1fr 1fr}.ps-filter-action{grid-column:1/-1}.ps-side{grid-template-columns:1fr}.ps-stat-row{grid-template-columns:1fr 1fr}.ps-head h1{font-size:24px}.ps-slip{padding:14px}.ps-slip-table th,.ps-slip-table td{padding:6px 4px;font-size:10px}}



      @media(max-width:440px){.ps-filters,.ps-stat-row{grid-template-columns:1fr}.ps-slip-top{flex-direction:column}.ps-slip-title{text-align:left}}





      /* PDF/print layout only — existing screen layout remains unchanged */
      .ps-print-document{display:none}
      @media print{
        @page{size:A4 portrait;margin:10mm}
        html,body,#root{background:#fff!important;margin:0!important;padding:0!important}
        body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        .sidebar,.topbar,.no-print,.ps-head,.ps-tabs,.ps-stat-row,.ps-side,.ps-alert{display:none!important}
        .content,.main,.shell{padding:0!important;margin:0!important;overflow:visible!important;width:auto!important;max-width:none!important}
        .ps-page{padding:0!important;margin:0!important;color:#213547!important}
        .ps-content-grid{display:block!important;margin:0!important}
        .ps-print-slip .ps-statement-area{display:none!important}
        .ps-print-statement .ps-slip-area{display:none!important}
        .ps-print-slip .ps-slip-area{display:block!important}
        .ps-print-slip .ps-slip{display:block!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;margin:0!important;overflow:visible!important}
        .ps-print-slip .ps-slip > :not(.ps-print-document){display:none!important}
        .ps-print-slip .ps-print-document{
          display:flex!important;flex-direction:column;position:relative;
          width:100%;height:272mm;min-height:0!important;max-height:272mm;
          padding:0 1mm 2mm;margin:0;overflow:hidden;
          font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.3;color:#243746;
          box-sizing:border-box;break-inside:avoid;page-break-inside:avoid;
        }
        .ps-pdf-header{text-align:center;margin:0 0 4mm;flex-shrink:0}
        .ps-pdf-logo svg{display:block;width:48px;height:48px;margin:0 auto}
        .ps-pdf-logo div{font-size:18px;letter-spacing:2px;color:#ed8426;font-weight:800;line-height:1.1}
        .ps-pdf-company{font-size:11px;font-weight:750;color:#314a5c;margin-top:2mm}
        .ps-pdf-title{text-align:center;font-size:13px;font-weight:800;letter-spacing:1px;border:1px solid #bdcbd5;padding:5px;background:#fff4e9;color:#c96917;flex-shrink:0}
        .ps-pdf-info,.ps-pdf-pay{border-collapse:collapse;width:100%;table-layout:fixed;flex-shrink:0}
        .ps-pdf-info th,.ps-pdf-info td,.ps-pdf-pay th,.ps-pdf-pay td{border:1px solid #c7d1d9;padding:4px 7px!important;font-size:10px!important;line-height:1.25}
        .ps-pdf-info th{text-align:left;width:35%;font-weight:750;background:#f8fafb}
        .ps-pdf-info td{font-weight:600}
        .ps-pdf-pay{margin-top:4mm}
        .ps-pdf-pay thead th{background:#fff1e4;color:#9b5218;font-weight:800;text-align:left}
        .ps-pdf-pay thead th:not(:first-child){text-align:right}
        .ps-pdf-pay th:first-child{width:48%}
        .ps-pdf-num{text-align:right!important;white-space:nowrap}
        .ps-pdf-total{font-weight:800;background:#f4f7f9}
        .ps-pdf-deductions{margin-top:4mm}
        .ps-pdf-net td{background:#fff1e4!important;color:#9b5218;font-size:11px!important;font-weight:800}
        .ps-pdf-note{font-size:8px;line-height:1.4;margin-top:3mm;color:#5c6e7a;flex-shrink:0}
        .ps-pdf-footer{
          position:static!important;bottom:auto!important;left:auto!important;right:auto!important;
          margin-top:auto;padding:3mm 0 2mm;border-top:1px solid #dce4e9;
          border-bottom:4px solid #ed8426;text-align:center;font-size:9px;line-height:1.5;
          flex-shrink:0;break-inside:avoid;
        }
        .ps-pdf-signature{text-align:right;margin-bottom:3mm;padding-right:6mm;font-weight:600;font-size:9px}
        .ps-pdf-signature span{display:block;font-size:9px;margin-top:4mm}
        .ps-pdf-foot-company{font-size:15px;color:#e77c20;letter-spacing:.6px;font-weight:800}
        .ps-pdf-foot-contact{font-size:9px}
        .ps-pdf-pay tr,.ps-pdf-info tr,.ps-pdf-header{break-inside:avoid}
        /* Keep existing salary-statement print behavior */
        .ps-print-statement .ps-statement-area{display:block!important;border:0!important;padding:0!important;box-shadow:none!important}
        .ps-print-statement .ps-statement-table{min-width:0!important;font-size:10px}
        .ps-print-statement .ps-statement-table th,.ps-print-statement .ps-statement-table td{padding:8px}
        .ps-print-statement .ps-statement-table tr{break-inside:avoid}
      }
    `}</style>







    <div className="ps-head no-print">



      <div><div className="ps-kicker">PAYROLL / EMPLOYEE DOCUMENTS</div><h1>Payslips & Statements</h1>



        <p>Approved salary records, CTC breakdowns and printable statements.</p></div>



      <button className="ps-header-action" disabled={!slip && !statement}



        onClick={() => print(tab === "statement" ? "statement" : "slip")}>



        <Printer size={16} /> Print / Save PDF



      </button>



    </div>







    <section className="ps-panel no-print">



      <div className="ps-section-title"><h2>Find Payroll Document</h2><small>Only approved payroll periods can generate a payslip</small></div>



      <div className="ps-filters">



        <label className="ps-field"><span>Employee</span><select value={employee} onChange={(e) => setEmployee(e.target.value)}>



          <option value="">Select employee</option>



          {employees.map((e) => <option key={e._id} value={e._id}>{e.employeeCode} — {e.firstName} {e.lastName}</option>)}



        </select></label>



        <label className="ps-field"><span>Year</span><input type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>



        <label className="ps-field"><span>Month</span><select value={month} onChange={(e) => setMonth(Number(e.target.value))}>



          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleString("en-IN", { month: "long" })}</option>)}



        </select></label>



        <button className="ps-btn primary ps-filter-action" disabled={!employee || loading} onClick={loadSlip}>



          <Search size={16} /> {loading ? "Loading..." : "View Payslip"} <ChevronRight size={15} />



        </button>



      </div>



    </section>







    {error && <div className="ps-alert error no-print"><AlertCircle size={18} />{error}</div>}



    {message && <div className="ps-alert success no-print"><CheckCircle2 size={18} />{message}</div>}







    <nav className="ps-tabs no-print" aria-label="Document view">



      <button className={"ps-tab " + (tab === "slip" ? "active" : "")} onClick={() => setTab("slip")}>Monthly Payslip</button>



      <button className={"ps-tab " + (tab === "statement" ? "active" : "")} onClick={() => setTab("statement")}>Salary Statement</button>



    </nav>







    {tab === "slip" && <>



      {entry && <div className="ps-stat-row no-print">



        <NumberTile label="Earned Gross" value={fmt(entry.earnedGrossPaise)} icon={Wallet} />



        <NumberTile label="Employee Deductions" value={fmt(entry.totalDeductionPaise)} icon={ReceiptText} />



        <NumberTile label="Net Salary" value={fmt(entry.netPaise)} icon={ShieldCheck} emphasis />



        <NumberTile label="Payable Days" value={`${entry.payableDays} / ${entry.calendarDays}`} icon={CalendarDays} />



      </div>}







      <div className="ps-content-grid ps-slip-area">



        {entry ? <section className="ps-slip">



          <header className="ps-slip-top">



            <div><div className="ps-brand">THETAVEGA</div><strong>{slip.company?.companyName || "THETAVEGA TECH PVT LTD"}</strong>



              <small>{slip.company?.companyAddress || ""}</small></div>



            <div className="ps-slip-title"><strong>SALARY SLIP</strong><span>{monthTitle(slip.period.year, slip.period.month)}</span></div>



          </header>







          <table className="ps-slip-table"><tbody>



            <tr><td className="key">Employee</td><td><b>{slip.employee?.name}</b></td><td className="key">Employee Code</td><td>{slip.employee?.employeeCode}</td></tr>



            <tr><td className="key">Department</td><td>{slip.employee?.department || "—"}</td><td className="key">Designation</td><td>{slip.employee?.designation || "—"}</td></tr>



            <tr><td className="key">Calendar Days</td><td>{entry.calendarDays}</td><td className="key">Payable Days</td><td><b>{entry.payableDays}</b></td></tr>



            <tr><td className="key">Overtime Days</td><td>{overtimeDays}</td><td className="key">Late Penalty</td><td>{entry.attendanceSnapshot?.latePenaltyDays || 0} days</td></tr>



          </tbody></table>







          <table className="ps-slip-table ps-screen-earnings"><thead><tr><th>EARNINGS</th><th className="amount">AMOUNT</th><th>DEDUCTIONS</th><th className="amount">AMOUNT</th></tr></thead>



            <tbody>



              {Array.from({ length: maxRows }, (_, i) => <tr key={i}>



                <td>{earnings[i]?.name || ""}</td><td className="amount">{earnings[i] ? fmt(earnings[i].amountPaise) : ""}</td>



                <td>{deductions[i]?.name || ""}</td><td className="amount">{deductions[i] ? fmt(deductions[i].amountPaise) : ""}</td>



              </tr>)}



              <tr className="total-row"><td>Earned Gross</td><td className="amount">{fmt(entry.earnedGrossPaise)}</td>



                <td>Total Deductions</td><td className="amount">{fmt(entry.totalDeductionPaise)}</td></tr>



            </tbody>



          </table>







          <div className="ps-net"><span>NET SALARY PAYABLE</span><strong>{fmt(entry.netPaise)}</strong></div>



          <div className="ps-slip-note">



            {isCtcIncluded && <div><b>Earned CTC:</b> {fmt(earnedCtc)}</div>}



            <div><b>Employee PF:</b> {fmt(employeePF)} &nbsp; • &nbsp; <b>Employer PF:</b> {fmt(employerPF)}</div>



            <div>Employer PF is an employer contribution, not an additional deduction from employee wages.



              {isCtcIncluded ? " It has been accounted for within the CTC salary structure." : ""}</div>



          </div>



          <footer className="ps-slip-footer">Computer-generated payslip based on an approved payroll record.</footer>
          <div className="ps-print-document">

            <header className="ps-pdf-header">

              <div className="ps-pdf-logo">

                {/* Replace this inline mark with your official logo image if available. */}

                <svg viewBox="0 0 100 95" aria-label="Thetavega emblem">

                  <path fill="#ed8426" d="M50 4 92 31 92 48 50 22 8 48 8 31Z"/>

                  <path fill="#ed8426" d="M8 54 43 34 43 88C24 83 12 72 8 54Z"/>

                  <path fill="#ed8426" d="M57 34 92 54C88 72 76 83 57 88Z"/>

                </svg>

                <div>THETAVEGA</div>

              </div>

              <div className="ps-pdf-company">{slip.company?.companyName || "THETAVEGA TECH PRIVATE LIMITED"}</div>

            </header>

            <div className="ps-pdf-title">SALARY SLIP</div>

            <table className="ps-pdf-info"><tbody>

              <tr><th>COMPANY NAME</th><td>{slip.company?.companyName || "THETAVEGA TECH PVT LTD"}</td></tr>

              <tr><th>EMPLOYEE NAME</th><td>{slip.employee?.name || "—"}</td></tr>

              <tr><th>EMPLOYEE CODE</th><td>{slip.employee?.employeeCode || "—"}</td></tr>

              <tr><th>DESIGNATION</th><td>{slip.employee?.designation || "—"}</td></tr>

              <tr><th>DEPARTMENT</th><td>{slip.employee?.department || "—"}</td></tr>

              <tr><th>SALARY MONTH</th><td>{monthTitle(slip.period.year, slip.period.month)}</td></tr>

              <tr><th>PAYABLE DAYS</th><td>{entry.payableDays} / {entry.calendarDays}</td></tr>

            </tbody></table>

            <table className="ps-pdf-pay"><thead>

              <tr><th>EARNINGS</th><th>ACTUAL MONTHLY CTC</th><th>EARNED SALARY</th></tr>

            </thead><tbody>

              {printOriginalComponents.map((item,i)=><tr key={i}>

                <td>{item.name || item.code || "—"}</td>

                <td className="ps-pdf-num">{item.actualPaise == null ? "—" : fmt(item.actualPaise)}</td>

                <td className="ps-pdf-num">{fmt(item.amountPaise)}</td>

              </tr>)}

              <tr className="ps-pdf-total"><td>MONTHLY CTC / EARNED GROSS</td>

                <td className="ps-pdf-num">{printActualTotal == null ? "—" : fmt(printActualTotal)}</td>

                <td className="ps-pdf-num">{fmt(entry.earnedGrossPaise)}</td></tr>

            </tbody></table>

            <table className="ps-pdf-pay ps-pdf-deductions">

              <thead><tr><th>PARTICULARS</th><th>AMOUNT</th></tr></thead>

              <tbody>

                <tr><td>Employee PF</td><td className="ps-pdf-num">{fmt(employeePF)}</td></tr>

                <tr><td>Employer PF</td><td className="ps-pdf-num">{fmt(employerPF)}</td></tr>

                <tr><td>Professional Tax</td><td className="ps-pdf-num">{fmt(getAmount(deductions, "PT"))}</td></tr>

                <tr className="ps-pdf-total ps-pdf-net"><td>NET SALARY PAYABLE (INCLUDING OVERTIME)</td><td className="ps-pdf-num">{fmt(entry.netPaise)}</td></tr>

              </tbody>

            </table>

            <div className="ps-pdf-note">

              Employer PF is a company contribution and is not deducted from net salary.

              {printIsEstimated ? " Actual monthly component figures are reconstructed where the original salary structure is unavailable; verify against the approved structure." : ""}

            </div>

            <footer className="ps-pdf-footer">

              <div className="ps-pdf-signature">For Thetavega Tech Private Limited <span>Authorised Signatory</span></div>

              <div className="ps-pdf-foot-company">THETAVEGA TECH PRIVATE LIMITED</div>

              <div>{slip.company?.companyAddress || "#02, Sadafulli, Rana Nagar, Aurangabad - 431001."}</div>

              <div className="ps-pdf-foot-contact">{slip.company?.companyPhone || "+91 9175109978"} &nbsp; | &nbsp; {slip.company?.companyEmail || "info@thetavega.tech"} &nbsp; | &nbsp; www.thetavega.tech</div>

              <div>{slip.company?.cin ? `CIN: ${slip.company.cin}` : "Computer-generated salary slip"}</div>

            </footer>

          </div>



        </section> : <div className="ps-placeholder no-print"><FileText size={36}/><h3>No payslip selected</h3>



          <p>Select an employee, year and month, then click View Payslip. Only approved payroll records can be displayed.</p></div>}







        <aside className="ps-side no-print">



          <div className="ps-side-card">



            <h3>Employee Details</h3>



            <div className="ps-person"><div className="ps-avatar">{selectedPerson ? `${selectedPerson.firstName?.[0] || ""}${selectedPerson.lastName?.[0] || ""}` : "TV"}</div>



              <div><strong>{selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : "Select an employee"}</strong>



                <span>{selectedPerson?.employeeCode || "Employee code"}</span></div></div>



            <div className="ps-side-line"><span>Month</span><b>{monthTitle(year, month)}</b></div>



            <div className="ps-side-line"><span>Status</span><b>{entry ? "APPROVED" : "Not loaded"}</b></div>



            <div className="ps-side-line"><span>Approved on</span><b>{shortDate(slip?.period?.approvedAt)}</b></div>



          </div>



          <div className="ps-side-card"><h3>Statutory Summary</h3>



            <div className="ps-side-line"><span>Employee PF</span><b>{entry ? fmt(employeePF) : "—"}</b></div>



            <div className="ps-side-line"><span>Employer PF</span><b>{entry ? fmt(employerPF) : "—"}</b></div>



            <div className="ps-side-line"><span>Professional Tax</span><b>{entry ? fmt(getAmount(deductions, "PT")) : "—"}</b></div>



            <button className="ps-btn primary" disabled={!entry} onClick={() => print("slip")}><Printer size={16}/> Print Salary Slip</button>



          </div>



        </aside>



      </div>



    </>}







    {tab === "statement" && <section className="ps-panel ps-statement-area">



      <div className="ps-section-title"><h2>Multi-Month Salary Statement</h2><small>Approved periods only</small></div>



      <div className="ps-statement-filters no-print">



        <label className="ps-field"><span>From</span><input type="month" value={from} onChange={(e) => setFrom(e.target.value)} /></label>



        <label className="ps-field"><span>To</span><input type="month" value={to} onChange={(e) => setTo(e.target.value)} /></label>



        <button className="ps-btn primary" disabled={!employee || loadingStatement} onClick={loadStatement}>



          <RefreshCw size={15}/>{loadingStatement ? "Loading..." : "Load Statement"}



        </button>



        <button className="ps-btn" disabled={!statement} onClick={() => print("statement")}><Printer size={15}/> Print Statement</button>



      </div>



      {statement ? <>



        <div className="ps-slip-top"><div><div className="ps-brand">THETAVEGA</div><strong>MONTHLY SALARY STATEMENT</strong>



          <small>{selectedPerson?.firstName} {selectedPerson?.lastName} • {selectedPerson?.employeeCode}</small></div>



          <div className="ps-slip-title"><span>{from} to {to}</span></div></div>



        <div className="ps-table-wrap"><table className="ps-statement-table"><thead><tr><th>MONTH</th><th>PAYABLE DAYS</th><th>EARNED GROSS</th><th>EMPLOYEE PF</th><th>EMPLOYER PF</th><th>DEDUCTIONS</th><th>NET SALARY</th></tr></thead>



          <tbody>{monthlyRows.map((row, i) => <tr key={i}>



            <td>{monthTitle(row.year, row.month)}</td><td>{row.entry?.payableDays ?? "—"}</td>



            <td>{row.entry ? fmt(row.entry.earnedGrossPaise) : "—"}</td>



            <td>{row.entry ? fmt(getAmount(row.entry.deductions, "PF")) : "—"}</td>



            <td>{row.entry ? fmt(getAmount(row.entry.employerContributions, "EMPLOYER_PF")) : "—"}</td>



            <td>{row.entry ? fmt(row.entry.totalDeductionPaise) : "—"}</td>



            <td>{row.entry ? fmt(row.entry.netPaise) : "—"}</td>



          </tr>)}{monthlyRows.length === 0 && <tr><td colSpan="7">No approved periods found.</td></tr>}</tbody>



        </table></div>



        <div className="ps-statement-footer"><span>Total Net Salary (selected months)</span><strong>{fmt(statementTotal)}</strong></div>



      </> : <div className="ps-placeholder no-print"><ReceiptText size={34}/><h3>Generate salary statement</h3><p>Choose From and To months, then click Load Statement.</p></div>}



    </section>}







    <style>{`@media print{.ps-page.ps-print-slip .ps-statement-area{display:none!important}.ps-page.ps-print-statement .ps-slip-area{display:none!important}.ps-page.ps-print-statement .ps-statement-area{display:block!important}.ps-page.ps-print-statement .ps-stat-row{display:none!important}.ps-page.ps-print-slip .ps-slip-area .ps-slip{display:block!important}}`}</style>



  </div>;



}
