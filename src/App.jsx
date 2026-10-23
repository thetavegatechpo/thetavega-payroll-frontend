import SiteMaster from "./SiteMaster.jsx";
import CompanySettings from "./CompanySettings.jsx";
import UserManagement from "./UserManagement.jsx";
import Payslips from "./Payslips.jsx";

import logo from "./assets/logo.png";

import PayrollPolicy from "./PayrollPolicy.jsx";

import SiteAttendanceReview from "./SiteAttendanceReview";

import PayrollWorkspace from "./PayrollWorkspace.jsx";



import SalaryStructures from "./SalaryStructures.jsx";



import React,{useEffect,useState} from "react";



import {Routes,Route,Navigate,NavLink,useNavigate,useLocation} from "react-router-dom";



import {UserCog,LayoutDashboard,Users,Building2,BriefcaseBusiness,Settings2,ShieldCheck,LogOut,Plus,Search,RefreshCcw,Pencil,Eye,CheckCircle2,AlertCircle,Menu,X,Wallet,CalendarDays,FileText} from "lucide-react";



import {api,errorText} from "./api";



const getUser=()=>{try{return JSON.parse(localStorage.getItem("tv_payroll_user")||"null")}catch{return null}};



function Login({onLogin}){const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);const navigate=useNavigate();async function submit(e){e.preventDefault();setLoading(true);setError("");try{const{data}=await api.post("/auth/login",{email,password});localStorage.setItem("tv_payroll_token",data.token);localStorage.setItem("tv_payroll_user",JSON.stringify(data.user));onLogin(data.user);navigate("/")}catch(e){setError(errorText(e))}finally{setLoading(false)}}return <main className="login-page"><section className="login-panel"><div className="logo"><span className="brand-icon">T</span><div><b>THETAVEGA</b><small>TECH PVT LTD</small></div></div><div className="login-heading"><span className="eyebrow">EMPLOYEE & PAYROLL OPERATIONS</span><h1>Welcome back.</h1><p>Sign in to manage your workforce and payroll configuration.</p></div><form onSubmit={submit}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@thetavega.local"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password"/></label>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={loading}>{loading?"Signing in...":"Sign in"}</button></form></section><aside className="login-aside"><div className="aside-art"><div className="orbit one"/><div className="orbit two"/><div className="orbit three"/><Wallet size={74}/></div><h2>People. Payroll. Precision.</h2><p>A centralized platform for employee administration and configurable payroll policies.</p><span>THETAVEGA • INTERNAL SYSTEM</span></aside></main>}



// Navigation is grouped by what employees use most often.

const mainNav = [

  ["/", "Dashboard", LayoutDashboard],

  ["/payroll", "Monthly Payroll", CalendarDays],
  ["/site-attendance", "Site Attendance / TA", Building2],

  ["/payslips", "Payslips & Statements", FileText],

  ["/employees", "Employee Master", Users],

  ["/salary-structures", "Salary Structures", Wallet],

];



const configurationNav = [

  ["/departments", "Departments", Building2],
  ["/sites", "Site Master", Building2],

  ["/designations", "Designations", BriefcaseBusiness],

  ["/salary-components", "Salary Components", Wallet],

  ["/payroll-policy", "Payroll Settings", ShieldCheck],

 

  ["/settings", "Company Settings", Settings2],
  ["/users-access", "Users & Access", UserCog],

];



function SidebarLinks({ items, isAdmin = false }) {

  return items.filter(([path]) => path !== "/users-access" || isAdmin).map(([path, label, Icon]) => (

    <NavLink

      key={path}

      to={path}

      end={path === "/"}

      className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}

    >

      <Icon size={18} />

      {label}

    </NavLink>

  ));

}



function Shell({ user, onLogout, children }) {

  const [open, setOpen] = useState(false);

  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);



  return (

    <div className="shell">

      <aside className={"sidebar " + (open ? "open" : "")}>

        <div className="sidebar-logo">

          <img
  src={logo}
  alt="Thetavega Logo"
  className="tv-brand-logo"
/>

          <div>

            <strong>THETAVEGA</strong>

            <small>PAYROLL MANAGEMENT</small>

          </div>

          <button className="mobile-close" onClick={() => setOpen(false)}>

            <X size={18} />

          </button>

        </div>



        <nav aria-label="Payroll navigation">

          <div className="side-label">MAIN PAGES</div>

          <SidebarLinks items={mainNav} />



          <div

            className="side-label"

            style={{

              marginTop: 22,

              paddingTop: 16,

              borderTop: "1px solid rgba(148, 163, 184, 0.22)",

            }}

          >

            MASTERS & CONFIGURATION

          </div>

          <SidebarLinks items={configurationNav} isAdmin={["ADMIN", "SUPER_ADMIN"].includes(user?.role)} />

        </nav>



        <div className="sidebar-footer">

          <div className="avatar">{(user?.name || "A")[0]}</div>

          <div className="user-meta">

            <b>{user?.name || "User"}</b>

            <small>{user?.role || "Role"}</small>

          </div>

          <button title="Logout" className="icon-btn" onClick={onLogout}>

            <LogOut size={18} />

          </button>

        </div>

      </aside>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="content">

        <header className="topbar">

          <button className="menu-toggle icon-btn" onClick={() => setOpen(true)}>

            <Menu />

          </button>

          <div>

            <b>Payroll Management</b>

            <small>THETAVEGA TECH PVT LTD</small>

          </div>

          <div className="topbar-right">

            <span className="live-dot" /> MongoDB Connected via API

            <span className="role-pill">{user?.role}</span>

          </div>

        </header>

        <main className="main">{children}</main>

      </div>

    </div>

  );

}



function PageHead({eyebrow,title,desc,action}){return <div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div>{action}</div>}



function Notice({message,type="error"}){return message?<div className={type==="success"?"success":"error"}>{message}</div>:null}



// ============================================================
// PAYROLL ANALYTICS DASHBOARD — LIVE API DATA
// ============================================================
const dashboardMoney = (paise, compact = false) =>
  (Number(paise || 0) / 100).toLocaleString('en-IN', {
    style: 'currency', currency: 'INR',
    maximumFractionDigits: compact ? 0 : 2,
  });
const shortMonth = (year, month) =>
  new Date(year, month - 1, 1).toLocaleString('en-IN', {month: 'short'});
const payrollSum = (items, key) =>
  items.reduce((total, item) => total + Number(item[key] || 0), 0);
const entryPart = (item, part) =>
  (item?.deductions || []).filter(d => d.code === part)
    .reduce((total, d) => total + Number(d.amountPaise || 0), 0);

function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [periodData, setPeriodData] = useState({period: null, entries: []});
  const [trend, setTrend] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({total: 0, active: 0, departments: 0});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [display, setDisplay] = useState('overview');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/employees?limit=100'),
      api.get('/employees?limit=1&status=ACTIVE'),
      api.get('/masters/departments')
    ]).then(([all, active, departments]) => {
      if (cancelled) return;
      setEmployees(all.data.data || []);
      setStats({
        total: Number(all.data.total || 0),
        active: Number(active.data.total || 0),
        departments: (departments.data || []).length,
      });
    }).catch(e => {if (!cancelled) setError(errorText(e));});
    return () => {cancelled = true;};
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    // Six real payroll periods — no artificial salary figures.
    const periods = Array.from({length: 6}, (_, i) => {
      const d = new Date(year, month - 1 - (5 - i), 1);
      return {year: d.getFullYear(), month: d.getMonth() + 1};
    });
    Promise.allSettled(periods.map(p =>
      api.get(`/payroll/period/${p.year}/${p.month}`)
    )).then(results => {
      if (cancelled) return;
      const series = results.map((result, i) => {
        const p = periods[i];
        const payload = result.status === 'fulfilled' ? result.value.data : null;
        const entries = payload?.entries || [];
        return {
          ...p,
          label: `${shortMonth(p.year, p.month)} ${String(p.year).slice(-2)}`,
          gross: payrollSum(entries, 'earnedGrossPaise'),
          net: payrollSum(entries, 'netPaise'),
          count: entries.length,
          status: payload?.period?.status || 'NOT STARTED',
          entries,
          period: payload?.period || null,
        };
      });
      const current = series[series.length - 1];
      setTrend(series);
      setPeriodData({period: current.period, entries: current.entries});
      if (results.every(r => r.status === 'rejected')) {
        setError('Could not load payroll data. Check the backend connection.');
      }
    }).finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [year, month, refresh]);

  const entries = periodData.entries;
  const gross = payrollSum(entries, 'earnedGrossPaise');
  const net = payrollSum(entries, 'netPaise');
  const deductions = payrollSum(entries, 'totalDeductionPaise');
  const pf = entries.reduce((total, entry) => total + entryPart(entry, 'PF'), 0);
  const approved = periodData.period?.status === 'APPROVED';
  const pending = periodData.period?.status === 'PENDING_APPROVAL';
  const status = periodData.period?.status || 'NOT STARTED';
  const maxChart = Math.max(1, ...trend.map(m => m.gross));
  const grossHeight = value => Math.max(0, (value / maxChart) * 100);
  const shownEntries = entries.filter(entry =>
    `${entry.employeeName || ''} ${entry.employeeCode || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );
  const steps = ['Attendance', 'Calculation', 'Review', 'Approval', 'Payslips'];
  const stage = approved ? 5 : pending ? 3 : entries.length ? 2 : 0;
  const colors = ['#2c91c9','#20b69e','#f3a24a','#9182d7','#ee899a'];
  const departmentCount = employees.reduce((map, e) => {
    const name = e.department?.name || 'Unassigned';
    map[name] = (map[name] || 0) + 1;
    return map;
  }, {});
  const departmentBreakdown = Object.entries(departmentCount)
    .sort((a,b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="nx-dashboard">
      <div className="nx-heading">
        <div>
          <span className="nx-kicker">THETAVEGA / PAYROLL INTELLIGENCE</span>
          <h1>Payroll Overview<span className="nx-heading-dot">.</span></h1>
          <p>Monitor your people, payroll costs and monthly approvals.</p>
        </div>
        <div className="nx-heading-actions">
          <button className="nx-refresh" title="Refresh dashboard" onClick={() => setRefresh(n => n+1)}><RefreshCcw size={17}/></button>
          <button className="nx-orange-button" onClick={() => navigate('/payroll')}><CalendarDays size={17}/> Run Payroll <span>↗</span></button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="nx-controls">
        <div className="nx-view-switch">
          <button className={display === 'overview' ? 'selected' : ''} onClick={() => setDisplay('overview')}><LayoutDashboard size={15}/> Overview</button>
          <button className={display === 'register' ? 'selected' : ''} onClick={() => setDisplay('register')}><Users size={15}/> Salary register</button>
        </div>
        <div className="nx-period-control"><CalendarDays size={16}/>
          <select aria-label="Payroll month" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({length:12},(_,i) => <option key={i} value={i+1}>{new Date(2026,i,1).toLocaleString('en-IN',{month:'long'})}</option>)}
          </select>
          <input aria-label="Payroll year" type="number" min="2020" max="2100" value={year} onChange={e => setYear(Number(e.target.value))}/>
        </div>
      </div>

      {display === 'overview' && <>
        <div className="nx-top-grid">
          <section className="nx-feature">
            <div className="nx-feature-orb"/>
            <div className="nx-feature-top"><span>PAYROLL DISTRIBUTION</span><span className="nx-feature-period">{shortMonth(year,month)} {year}</span></div>
            <p>Total net salary payable</p>
            <h2>{dashboardMoney(net)}</h2>
            <div className="nx-feature-bottom"><span className="nx-feature-chip"><span className="nx-live-dot"/>{status.replaceAll('_',' ')}</span><span>{entries.length} employees processed</span></div>
            <button onClick={() => navigate('/payroll')}>Manage this payroll <span>→</span></button>
          </section>
          <div className="nx-metrics">
            <div className="nx-metric"><div><span>Earned gross</span><span className="nx-icon blue"><Wallet size={17}/></span></div><strong>{dashboardMoney(gross)}</strong><small>Salary before deductions</small></div>
            <div className="nx-metric"><div><span>Total deductions</span><span className="nx-icon pink"><ShieldCheck size={17}/></span></div><strong>{dashboardMoney(deductions)}</strong><small>Employee-side deductions</small></div>
            <div className="nx-metric"><div><span>Employees</span><span className="nx-icon teal"><Users size={17}/></span></div><strong>{stats.total.toLocaleString('en-IN')}</strong><small>{stats.active} currently active</small></div>
            <div className="nx-metric"><div><span>Employee PF</span><span className="nx-icon amber"><CheckCircle2 size={17}/></span></div><strong>{dashboardMoney(pf)}</strong><small>Included in deductions</small></div>
          </div>
        </div>

        <div className="nx-chart-row">
          <section className="nx-panel nx-trend">
            <div className="nx-panel-head"><div><span className="nx-kicker">FINANCIAL ACTIVITY</span><h3>Payroll trend</h3><p>Actual gross and take-home pay across six months</p></div><div className="nx-legend"><span><i className="gross"/> Gross</span><span><i className="net"/> Net</span></div></div>
            <div className="nx-chart">
              <div className="nx-chart-guides"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div>
              <div className="nx-chart-columns">
                {trend.map((m,i) => <div className="nx-chart-month" key={i} title={`${m.label}: gross ${dashboardMoney(m.gross)}, net ${dashboardMoney(m.net)}`}>
                  <div className="nx-bars"><div className="nx-bar gross" style={{height:`${grossHeight(m.gross)}%`}}/><div className="nx-bar net" style={{height:`${grossHeight(m.net)}%`}}/></div>
                  <span>{m.label}</span>
                </div>)}
              </div>
            </div>
            <div className="nx-chart-foot">{loading ? 'Loading payroll trend...' : 'Months without calculated payroll are shown at zero.'}</div>
          </section>
          <section className="nx-panel nx-workforce">
            <div className="nx-panel-head"><div><span className="nx-kicker">TEAM SNAPSHOT</span><h3>Workforce distribution</h3><p>Departments in your employee records</p></div><button onClick={() => navigate('/employees')} className="nx-arrow-button">↗</button></div>
            <div className="nx-donut-wrap"><div className="nx-donut" style={{background:departmentBreakdown.length ? `conic-gradient(${departmentBreakdown.map(([n,c],i) => {const before=departmentBreakdown.slice(0,i).reduce((sum,x)=>sum+x[1],0);const total=departmentBreakdown.reduce((sum,x)=>sum+x[1],0);return `${colors[i%colors.length]} ${(before/total*100).toFixed(2)}% ${((before+c)/total*100).toFixed(2)}%`;}).join(', ')})` : '#e8edf2'}}><div><strong>{employees.length}</strong><span>Loaded profiles</span></div></div></div>
            <div className="nx-dept-legend">{departmentBreakdown.map(([name,count],i) => <div key={name}><i style={{background:colors[i%colors.length]}}/><span title={name}>{name}</span><b>{count}</b></div>)}{!departmentBreakdown.length && <p className="nx-empty">No employees to display</p>}</div>
            <small className="nx-hint">Department chart uses the first 100 employee records.</small>
          </section>
        </div>

        <div className="nx-lower-row">
          <section className="nx-panel nx-workflow-panel"><div className="nx-panel-head"><div><span className="nx-kicker">MONTH END</span><h3>Processing progress</h3></div><span className={`nx-status ${approved?'done':pending?'pending':''}`}>{status.replaceAll('_',' ')}</span></div>
            <div className="nx-steps">{steps.map((name,i)=><div key={name} className={'nx-step '+(i<stage?'done':i===stage?'current':'')}><span>{i<stage?'✓':i+1}</span><b>{name}</b></div>)}</div>
            <div className="nx-workflow-caption">The indicators reflect payroll calculation and approval status. They do not indicate that every attendance record is complete.</div>
          </section>
          <section className="nx-panel nx-quick-panel"><div className="nx-panel-head"><div><span className="nx-kicker">TOOLS</span><h3>Quick access</h3></div></div><div className="nx-quick-grid">
            {[['/employees','Employees',Users],['/salary-structures','Salary CTC',Wallet],['/payslips','Payslips',FileText],['/payroll-policy','Payroll Policy',ShieldCheck]].map(([path,label,Icon])=><button key={path} onClick={()=>navigate(path)}><span><Icon size={17}/></span><b>{label}</b><span className="nx-quick-arrow">↗</span></button>)}
          </div></section>
        </div>
      </>}

      <section className="nx-panel nx-register">
        <div className="nx-register-head"><div><span className="nx-kicker">PAYROLL RECORDS</span><h3>Employee salary register</h3><p>Entries for {shortMonth(year,month)} {year}</p></div><div className="nx-search"><Search size={16}/><input placeholder="Search employee..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
        <div className="nx-table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>PAYABLE DAYS</th><th>EARNED GROSS</th><th>DEDUCTIONS</th><th>NET SALARY</th><th>STATUS</th></tr></thead><tbody>
          {shownEntries.map(e=><tr key={e._id}><td><div className="nx-employee-cell"><span className="nx-avatar">{(e.employeeName||'E').split(' ').map(x=>x[0]||'').slice(0,2).join('')}</span><span><b>{e.employeeName||e.employeeCode}</b><small>{e.employeeCode}</small></span></div></td><td><span className="nx-days">{e.payableDays} / {e.calendarDays}</span></td><td>{dashboardMoney(e.earnedGrossPaise)}</td><td>{dashboardMoney(e.totalDeductionPaise)}</td><td className="nx-net">{dashboardMoney(e.netPaise)}</td><td><span className={'nx-status '+(approved?'done':'')}>{status.replaceAll('_',' ')}</span></td></tr>)}
          {!shownEntries.length && <tr><td colSpan={6} className="nx-empty">{loading?'Loading payroll...':'No payroll records for this month.'}</td></tr>}
        </tbody></table></div>
        <div className="nx-register-footer"><span>{shownEntries.length} records shown</span><button onClick={()=>navigate('/payroll')}>Open monthly payroll →</button></div>
      </section>

      <style>{`
        .nx-dashboard{color:#182e40;padding-bottom:24px;--nx-border:#e6ecf1;--nx-muted:#8294a3}
        .nx-dashboard *{box-sizing:border-box}.nx-heading,.nx-heading-actions,.nx-controls,.nx-period-control,.nx-panel-head,.nx-register-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
        .nx-heading{margin-bottom:22px;flex-wrap:wrap}.nx-kicker{font-size:10px;letter-spacing:1.4px;color:#dd7a2a;font-weight:800}.nx-heading h1{margin:7px 0 5px;font-size:30px;letter-spacing:-1px}.nx-heading-dot{color:#ef8626}.nx-heading p,.nx-panel-head p,.nx-register-head p{margin:3px 0;color:#8694a2;font-size:12px}
        .nx-heading-actions{gap:9px}.nx-refresh,.nx-arrow-button{border:1px solid var(--nx-border);background:white;display:grid;place-items:center;border-radius:11px;width:41px;height:41px;cursor:pointer;color:#355468}.nx-orange-button{border:0;border-radius:10px;color:#fff;background:#f28a2b;display:flex;align-items:center;gap:10px;padding:12px 17px;font-weight:750;cursor:pointer}.nx-orange-button span{font-size:17px}
        .nx-controls{margin-bottom:18px;flex-wrap:wrap}.nx-view-switch{background:#eaf0f5;padding:4px;border-radius:10px;display:flex;gap:4px}.nx-view-switch button{background:transparent;border:0;border-radius:8px;padding:9px 13px;display:flex;align-items:center;gap:8px;color:#718394;font-weight:750;font-size:12px;cursor:pointer}.nx-view-switch button.selected{background:white;color:#1b3e54;box-shadow:0 2px 7px #12304315}.nx-period-control{justify-content:flex-start;gap:8px;padding:5px 10px;background:#fff;border:1px solid var(--nx-border);border-radius:11px;color:#657a8a}.nx-period-control select,.nx-period-control input{border:0;outline:0;background:transparent;padding:7px;color:#304758}.nx-period-control input{width:74px}.nx-period-control select{width:120px}
        .nx-top-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:17px;margin-bottom:17px}.nx-feature{position:relative;min-height:248px;background:linear-gradient(124deg,#102e40,#174d5c);color:white;border-radius:18px;padding:24px;overflow:hidden}.nx-feature-orb{position:absolute;width:250px;height:250px;right:-120px;top:-100px;border-radius:50%;border:38px solid #ffffff09;box-shadow:0 0 0 55px #ffffff07}.nx-feature-top,.nx-feature-bottom{display:flex;gap:13px;align-items:center;justify-content:space-between;flex-wrap:wrap;position:relative}.nx-feature-top{font-size:10px;font-weight:800;letter-spacing:1.1px;color:#adcfd8}.nx-feature-period{padding:6px 10px;border:1px solid #ffffff30;border-radius:18px}.nx-feature p{margin:33px 0 4px;color:#c8e0e7;font-size:12px}.nx-feature h2{font-size:clamp(26px,3vw,39px);letter-spacing:-1px;margin:0 0 24px;position:relative}.nx-feature-bottom{justify-content:flex-start;color:#d2e7ea;font-size:11px}.nx-feature-chip{display:inline-flex;gap:7px;align-items:center;border-radius:18px;background:#ffffff19;padding:7px 10px}.nx-live-dot{width:7px;height:7px;border-radius:50%;background:#2de5ac}.nx-feature>button{background:transparent;border:0;color:#e7f5f7;padding:0;cursor:pointer;text-decoration:underline;font-size:11px;margin-top:19px;position:relative}.nx-feature>button span{margin-left:5px}
        .nx-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.nx-metric{border:1px solid var(--nx-border);border-radius:15px;background:#fff;padding:18px;display:flex;flex-direction:column;justify-content:center;min-width:0}.nx-metric>div{display:flex;justify-content:space-between;align-items:center;gap:6px}.nx-metric>div>span:first-child{color:#72879a;font-size:11px;font-weight:750}.nx-metric strong{font-size:clamp(17px,1.75vw,25px);letter-spacing:-.5px;margin-top:10px;white-space:nowrap}.nx-metric small{font-size:10px;color:#98a7b2;margin-top:7px}.nx-icon{height:33px;width:33px;display:grid;place-items:center;border-radius:10px}.nx-icon.blue{background:#e8f4ff;color:#2b89c8}.nx-icon.pink{background:#fff0f1;color:#d96884}.nx-icon.teal{background:#e3f8f2;color:#23a98d}.nx-icon.amber{background:#fff3e4;color:#df9142}
        .nx-chart-row{display:grid;grid-template-columns:1.55fr 1fr;gap:17px;margin-bottom:17px}.nx-panel{border:1px solid var(--nx-border);border-radius:16px;background:white;padding:21px;min-width:0}.nx-panel-head{align-items:flex-start;margin-bottom:18px}.nx-panel-head h3,.nx-register-head h3{font-size:16px;letter-spacing:-.35px;margin:5px 0}.nx-legend{display:flex;gap:11px;align-items:center;font-size:10px;color:#778998}.nx-legend span{display:flex;align-items:center;gap:6px}.nx-legend i{width:8px;height:8px;display:inline-block;border-radius:3px}.nx-legend i.gross,.nx-bar.gross{background:#f49a3c}.nx-legend i.net,.nx-bar.net{background:#348bc7}
        .nx-chart{display:flex;min-height:200px;gap:10px}.nx-chart-guides{display:flex;flex-direction:column;justify-content:space-between;color:#a1aeb9;font-size:10px;padding:0 0 20px}.nx-chart-columns{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));flex:1;gap:9px;background:repeating-linear-gradient(to top,transparent 0,transparent calc(25% - 1px),#eff2f5 calc(25% - 1px),#eff2f5 25%);background-size:100% calc(100% - 20px)}.nx-chart-month{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0;gap:8px}.nx-chart-month>span{font-size:10px;color:#8294a3;white-space:nowrap}.nx-bars{height:180px;display:flex;align-items:flex-end;gap:5px;width:100%;justify-content:center}.nx-bar{width:min(22px,38%);border-radius:5px 5px 0 0;min-height:0;transition:height .35s}.nx-chart-foot{font-size:10px;color:#9aa9b3;margin-top:8px}
        .nx-donut-wrap{display:flex;justify-content:center;margin:15px 0 18px}.nx-donut{width:155px;height:155px;border-radius:50%;display:grid;place-items:center}.nx-donut>div{height:113px;width:113px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column}.nx-donut strong{font-size:28px}.nx-donut span{color:#9aa7b3;font-size:10px}.nx-dept-legend{display:grid;gap:10px}.nx-dept-legend>div{display:flex;gap:9px;align-items:center;font-size:11px}.nx-dept-legend i{width:9px;height:9px;border-radius:3px}.nx-dept-legend span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#758694}.nx-dept-legend b{color:#31495b}.nx-hint{display:block;margin-top:12px;color:#a5b1bb;font-size:10px}
        .nx-lower-row{display:grid;grid-template-columns:1.35fr 1fr;gap:17px;margin-bottom:17px}.nx-status{display:inline-block;border-radius:50px;background:#f2f5f8;padding:7px 10px;color:#738492;font-size:10px;font-weight:750;white-space:nowrap}.nx-status.done{background:#e7f8f0;color:#188a66}.nx-status.pending{background:#fff2dc;color:#b97d1d}.nx-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.nx-step{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:11px 4px;background:#f6f8fa;border-radius:10px;color:#a0aeb8}.nx-step span{width:26px;height:26px;border-radius:50%;background:#e5ebf0;display:grid;place-items:center;font-size:11px;font-weight:800}.nx-step b{font-size:10px}.nx-step.done{color:#168f6e;background:#eaf8f2}.nx-step.done span{background:#2dae86;color:white}.nx-step.current{color:#c17d26;background:#fff3e7}.nx-step.current span{background:#f39a3b;color:white}.nx-workflow-caption{font-size:10px;color:#9cabb5;margin-top:13px}.nx-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.nx-quick-grid button{border:1px solid #e7edf1;border-radius:11px;padding:13px 10px;display:flex;align-items:center;gap:8px;background:#fff;cursor:pointer;text-align:left}.nx-quick-grid button>span:first-child{color:#e88b2c;background:#fff3e7;border-radius:9px;width:31px;height:31px;display:grid;place-items:center;flex:none}.nx-quick-grid button b{font-size:11px;color:#314d61}.nx-quick-arrow{margin-left:auto;color:#d28c43}
        .nx-register{padding:0;overflow:hidden}.nx-register-head{padding:21px;align-items:center}.nx-search{display:flex;align-items:center;gap:8px;border:1px solid var(--nx-border);border-radius:9px;background:#f8fafb;padding:9px 12px;color:#8a99a5}.nx-search input{outline:0;border:0;background:transparent;font-size:12px;min-width:130px}.nx-table-scroll{overflow:auto}.nx-register table{width:100%;border-collapse:collapse;min-width:710px}.nx-register th{background:#f8fafb;color:#93a1ad;font-size:10px;text-align:left;padding:14px 18px;white-space:nowrap}.nx-register td{padding:13px 18px;border-top:1px solid #edf1f4;white-space:nowrap;font-size:12px}.nx-employee-cell{display:flex;align-items:center;gap:10px}.nx-employee-cell b{display:block;font-size:11px}.nx-employee-cell small{display:block;color:#93a1ad;font-size:10px;margin-top:4px}.nx-avatar{background:#e7f3f8;color:#2784a1;width:35px;height:35px;border-radius:10px;display:grid;place-items:center;font-size:11px;font-weight:800}.nx-days{background:#ecf7f2;color:#168968;padding:7px 9px;border-radius:20px;font-size:11px}.nx-net{font-weight:800;color:#178a69}.nx-register-footer{display:flex;align-items:center;justify-content:space-between;padding:13px 21px;border-top:1px solid var(--nx-border);font-size:11px;color:#93a1ad}.nx-register-footer button{border:0;background:none;color:#d78128;font-weight:750;cursor:pointer}.nx-empty{text-align:center;color:#9aa7b3;padding:34px!important}
        .nx-dashboard .nx-feature,.nx-dashboard .nx-metric,.nx-dashboard .nx-panel{animation:nx-appear .35s ease both}@keyframes nx-appear{from{opacity:.75;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:1200px){.nx-top-grid,.nx-chart-row,.nx-lower-row{grid-template-columns:1fr}.nx-feature{min-height:210px}}@media(max-width:700px){.nx-heading{align-items:flex-start}.nx-top-grid{grid-template-columns:1fr}.nx-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.nx-steps{grid-template-columns:repeat(5,minmax(0,1fr))}.nx-step b{font-size:9px}.nx-register-head{flex-direction:column;align-items:stretch}.nx-chart-row{grid-template-columns:1fr}}
        @media(max-width:480px){.nx-metrics{grid-template-columns:1fr}.nx-top-grid{grid-template-columns:1fr}.nx-period-control{width:100%}.nx-heading-actions{width:100%}.nx-orange-button{flex:1;justify-content:center}.nx-controls{align-items:stretch}.nx-view-switch{width:100%}.nx-view-switch button{flex:1;justify-content:center}}
      `}</style>
    </div>
  );
}

const employeeEmpty={employeeNumber:"",firstName:"",lastName:"",email:"",mobile:"",department:"",designation:"",joiningDate:"",employmentType:"FULL_TIME",gender:"",dateOfBirth:""};



function Employees() {

  const [rows, setRows] = useState([]);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [departmentFilter, setDepartmentFilter] = useState("");

  const [view, setView] = useState("cards");

  const [departments, setDepartments] = useState([]);

  const [designations, setDesignations] = useState([]);

  const [modal, setModal] = useState(false);

  const [form, setForm] = useState(employeeEmpty);

  const [editId, setEditId] = useState(null);

  const [busy, setBusy] = useState(false);

  const [err, setErr] = useState("");

  const [msg, setMsg] = useState("");

  const [refresh, setRefresh] = useState(0);

  const [selected, setSelected] = useState(null);
  const [pwdEmployee,setPwdEmployee]=useState(null);
  const [pwdConfigured,setPwdConfigured]=useState(null);
  const [pwdValue,setPwdValue]=useState('');
  const [pwdConfirm,setPwdConfirm]=useState('');
  const [pwdBusy,setPwdBusy]=useState(false);
  const [pwdError,setPwdError]=useState('');
  async function openAppPassword(employee){
    setPwdEmployee(employee);setPwdConfigured(null);setPwdValue('');setPwdConfirm('');setPwdError('');
    try {const {data}=await api.get(`/employees/${employee._id}/mobile-password`);setPwdConfigured(data.configured)}
    catch(e){setPwdError(errorText(e))}
  }
  async function saveAppPassword(e){
    e.preventDefault();
    if(pwdValue.length<10 || pwdValue.length>128){setPwdError('Password must be 10-128 characters');return}
    if(pwdValue!==pwdConfirm){setPwdError('Passwords do not match');return}
    setPwdBusy(true);setPwdError('');
    try {
      await api.put(`/employees/${pwdEmployee._id}/mobile-password`,{password:pwdValue});
      setPwdEmployee(null);setPwdValue('');setPwdConfirm('');setMsg('Employee app password saved; prior mobile sessions revoked');
    }catch(e){setPwdError(errorText(e))}finally{setPwdBusy(false)}
  }




  useEffect(() => {

    Promise.all([

      api.get("/masters/departments"),

      api.get("/masters/designations")

    ]).then(([a, b]) => {

      setDepartments(a.data || []);

      setDesignations(b.data || []);

    }).catch(e => setErr(errorText(e)));

  }, []);



  useEffect(() => {

    let cancelled = false;

    api.get("/employees", {

      params: { page, limit: 40, search, status: status || undefined }

    }).then(({data}) => {

      if (!cancelled) {

        setRows(data.data || []);

        setTotal(data.total || 0);

      }

    }).catch(e => { if (!cancelled) setErr(errorText(e)); });

    return () => { cancelled = true; };

  }, [page, search, status, refresh]);



  const visible = rows.filter(e =>

    !departmentFilter || String(e.department?._id || e.department) === departmentFilter

  );

  const grouped = visible.reduce((out, e) => {

    const name = e.department?.name || "Unassigned Department";

    (out[name] ||= []).push(e);

    return out;

  }, {});

  const initials = e => `${(e.firstName || "")[0] || ""}${(e.lastName || "")[0] || ""}`.toUpperCase() || "TV";

  const field = (key, label, type = "text", required = false) => (

    <label key={key}>{label}<input type={type} required={required}

      value={form[key] || ""} onChange={e => setForm({...form,[key]:e.target.value})}/></label>

  );

  function openNew() { setEditId(null); setForm(employeeEmpty); setModal(true); setErr(""); }

  function openEdit(e) {

    setSelected(null);

    setEditId(e._id);

    setForm({employeeNumber:(e.employeeCode||"").replace(/^TT\/E\//, ""),firstName:e.firstName||"",lastName:e.lastName||"",email:e.email||"",mobile:e.mobile||"",

      department:e.department?._id||e.department||"",designation:e.designation?._id||e.designation||"",

      joiningDate:e.joiningDate?.slice(0,10)||"",employmentType:e.employmentType||"FULL_TIME",

      gender:e.gender||"",dateOfBirth:e.dateOfBirth?.slice(0,10)||""});

    setModal(true); setErr("");

  }

  async function save(ev) {

    ev.preventDefault(); setBusy(true); setErr("");

    try {

      const payload = {...form};

      if (editId) delete payload.employeeNumber;

      if (!payload.dateOfBirth) delete payload.dateOfBirth;

      if (!payload.email) delete payload.email;

      if (!payload.gender) delete payload.gender;

      if (editId) await api.patch("/employees/"+editId,payload);

      else await api.post("/employees",payload);

      setModal(false); setMsg(editId ? "Employee updated" : "Employee created");

      setRefresh(x=>x+1);

    } catch(e) { setErr(errorText(e)); } finally { setBusy(false); }

  }

  async function toggle(e) {

    if (!window.confirm("Change employee status?")) return;

    try {

      await api.patch("/employees/"+e._id+"/status",{status:e.status==="ACTIVE"?"INACTIVE":"ACTIVE"});

      setSelected(null); setRefresh(x=>x+1);

    } catch(ex) { setErr(errorText(ex)); }

  }

  const validDesignations = designations.filter(d => d.active &&

    (!d.department || String(d.department?._id || d.department) === String(form.department)));

  return <>

    <style>{`

      .tv-employee-page .tv-emp-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}

      .tv-emp-overline{font-size:11px;letter-spacing:2px;color:#ed842d;font-weight:800;text-transform:uppercase}

      .tv-employee-page h1{font-size:29px;letter-spacing:-.8px;margin:6px 0 7px;color:#102a38}

      .tv-employee-page .tv-subtle{font-size:13px;color:#82919c;margin:0}

      .tv-emp-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:20px}

      .tv-emp-mini{border:1px solid #e7edf1;background:#fff;border-radius:16px;padding:17px 19px;display:flex;align-items:center;gap:14px;box-shadow:0 5px 22px #15293906}

      .tv-emp-mini-icon{width:41px;height:41px;border-radius:13px;background:#fff3e9;color:#e87d25;display:flex;align-items:center;justify-content:center}

      .tv-emp-mini small{display:block;color:#82919c;font-size:12px;margin-bottom:3px}

      .tv-emp-mini strong{display:block;font-size:23px;color:#183246}

      .tv-emp-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:14px;border:1px solid #e6edf0;border-radius:17px;background:#fff;margin-bottom:24px}

      .tv-emp-toolbar .tv-emp-search{flex:1 1 220px;display:flex;align-items:center;gap:9px;border:1px solid #e2e8ed;border-radius:10px;padding:0 11px;color:#81909e;background:#f8fafb}

      .tv-emp-toolbar .tv-emp-search input{border:0;outline:0;background:transparent;padding:11px 0;width:100%;min-width:0}

      .tv-emp-toolbar select{min-width:132px;max-width:200px;padding:11px 12px;border-radius:10px;border:1px solid #e2e8ed;background:#fff;color:#344b5a}

      .tv-emp-switch{display:flex;padding:4px;background:#f0f4f6;border-radius:11px;gap:3px}

      .tv-emp-switch button{border:0;background:transparent;padding:7px 12px;border-radius:8px;cursor:pointer;color:#728391;font-weight:700;font-size:12px}

      .tv-emp-switch button.active{background:white;color:#ef842a;box-shadow:0 1px 5px #09212d16}

      .tv-dept-title{display:flex;align-items:center;gap:11px;margin:8px 0 15px}

      .tv-dept-title strong{font-size:15px;color:#263746}

      .tv-dept-title span{background:#f0f3f5;color:#687785;border-radius:8px;padding:3px 9px;font-size:11px;font-weight:800}

      .tv-dept-line{height:1px;background:#e8edef;flex:1}

      .tv-emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(238px,1fr));gap:15px;margin-bottom:28px}

      .tv-emp-card{background:#fff;border:1px solid #e5eaee;border-radius:17px;padding:18px;box-shadow:0 6px 19px #1d3c4a07;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;min-width:0}

      .tv-emp-card:hover{transform:translateY(-3px);box-shadow:0 12px 30px #142c3b14;border-color:#f1c4a0}

      .tv-emp-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:14px}

      .tv-emp-avatar{width:49px;height:49px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;background:linear-gradient(135deg,#f9ddc6,#fff3eb);color:#cc6e25}

      .tv-emp-state{font-size:10px;font-weight:800;letter-spacing:.5px;border-radius:30px;padding:6px 9px;background:#e9f8f1;color:#1f9a65}

      .tv-emp-state.off{background:#f0f2f5;color:#8a909a}

      .tv-emp-card h3{margin:0;font-size:15px;font-weight:800;color:#172f41}

      .tv-emp-designation{font-size:12px;color:#85939e;margin:4px 0 15px}

      .tv-emp-divider{height:1px;background:#edf0f3;margin-bottom:13px}

      .tv-emp-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}

      .tv-emp-meta small{color:#97a4ad;font-size:10px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}

      .tv-emp-meta strong{font-size:11px;color:#344957;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

      .tv-emp-contact{border-radius:10px;background:#f7f9fa;padding:10px;font-size:11px;color:#687e8b;display:grid;gap:8px;margin-bottom:15px}

      .tv-emp-contact>div{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

      .tv-emp-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}

      .tv-emp-actions button{border:0;border-radius:9px;padding:10px 8px;font-size:12px;font-weight:700;cursor:pointer;background:#edf3f7;color:#34566d}

      .tv-emp-actions .tv-emp-primary{background:#f1882c;color:white}

      .tv-emp-list{background:#fff;border:1px solid #e6edf1;border-radius:16px;overflow:auto;margin-bottom:22px}

      .tv-emp-list table{width:100%}

      .tv-emp-pagination{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px;color:#718391;font-size:12px}

      .tv-emp-pagination button{border:1px solid #dde5eb;background:#fff;border-radius:8px;padding:9px 14px;margin-left:6px;cursor:pointer}

      .tv-emp-pagination button:disabled{opacity:.4;cursor:not-allowed}

      .tv-emp-detail{border:1px solid #e6ecf1;background:#fff;border-radius:16px;padding:20px;margin-bottom:18px}

      .tv-emp-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:14px}

      .tv-emp-detail-grid span{display:block;color:#8998a5;font-size:11px;margin-bottom:4px}

      .tv-emp-detail-grid strong{font-size:13px;color:#213b4f;word-break:break-word}

      .tv-employee-id-entry{display:flex;align-items:stretch;gap:8px;width:100%}
      .tv-employee-id-prefix{display:flex;align-items:center;justify-content:center;padding:0 15px;background:#fff3e7;color:#df7c25;border:1px solid #f4d6bd;border-radius:9px;font-size:13px;font-weight:800;white-space:nowrap}
      .tv-employee-id-entry input{flex:1;min-width:0}
      .tv-employee-id-entry input[readonly]{background:#f2f5f7;color:#64748b;cursor:not-allowed}
      @media(max-width:750px){.tv-emp-summary{grid-template-columns:1fr}.tv-emp-grid{grid-template-columns:repeat(auto-fill,minmax(215px,1fr))}.tv-emp-detail-grid{grid-template-columns:1fr}}

    `}</style>

    <section className="tv-employee-page">

      <div className="tv-emp-heading">

        <div><span className="tv-emp-overline">People & Organization</span>

          <h1>Employee Directory</h1>

          <p className="tv-subtle">Find your team, manage profiles and keep employee records organized.</p></div>

        <button className="primary" onClick={openNew}><Plus size={17}/> Add Employee</button>

      </div>

      <Notice message={err}/><Notice message={msg} type="success"/>

      <div className="tv-emp-summary">

        <div className="tv-emp-mini"><div className="tv-emp-mini-icon"><Users size={21}/></div><div><small>Total Employees</small><strong>{total}</strong></div></div>

        <div className="tv-emp-mini"><div className="tv-emp-mini-icon"><CheckCircle2 size={21}/></div><div><small>Active on this page</small><strong>{rows.filter(e=>e.status==="ACTIVE").length}</strong></div></div>

        <div className="tv-emp-mini"><div className="tv-emp-mini-icon"><Building2 size={21}/></div><div><small>Departments</small><strong>{departments.length}</strong></div></div>

      </div>

      <div className="tv-emp-toolbar">

        <div className="tv-emp-search"><Search size={17}/><input placeholder="Search employee name or code..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div>

        <select aria-label="Filter status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}>

          <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="EXITED">Exited</option>

        </select>

        <select aria-label="Filter department" value={departmentFilter} onChange={e=>setDepartmentFilter(e.target.value)}>

          <option value="">All departments</option>

          {departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}

        </select>

        <div className="tv-emp-switch"><button className={view==="cards"?"active":""} onClick={()=>setView("cards")}>▦ Cards</button><button className={view==="list"?"active":""} onClick={()=>setView("list")}>☷ List</button></div>

        <button className="outline" title="Refresh" onClick={()=>setRefresh(v=>v+1)}><RefreshCcw size={16}/></button>

      </div>

      {view === "cards" ? <>

        {Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([dept,people])=><div key={dept}>

          <div className="tv-dept-title"><strong>{dept}</strong><span>{people.length}</span><div className="tv-dept-line"/></div>

          <div className="tv-emp-grid">{people.map(e=><article key={e._id} className="tv-emp-card">

            <div className="tv-emp-top"><div className="tv-emp-avatar">{initials(e)}</div><span className={"tv-emp-state "+(e.status==="ACTIVE"?"":"off")}>{e.status}</span></div>

            <h3>{e.firstName} {e.lastName}</h3><div className="tv-emp-designation">{e.designation?.name||"Designation not set"}</div>

            <div className="tv-emp-divider"/>

            <div className="tv-emp-meta"><div><small>Employee ID</small><strong>{e.employeeCode}</strong></div><div><small>Joined</small><strong>{e.joiningDate?.slice(0,10)||"—"}</strong></div></div>

            <div className="tv-emp-contact"><div title={e.email||""}><FileText size={13}/>{e.email||"Email not provided"}</div><div><Users size={13}/>{e.mobile||"Mobile not provided"}</div></div>

            <div className="tv-emp-actions"><button onClick={()=>openEdit(e)}>Edit</button><button className="tv-emp-primary" onClick={()=>setSelected(e)}>View Profile</button><button style={{gridColumn:"1 / -1"}} onClick={()=>openAppPassword(e)}>Set / Reset App Password</button></div>

          </article>)}</div>

        </div>)}

        {!visible.length && <div className="card" style={{padding:36,textAlign:"center",color:"#8194a1"}}>No employees match your filters.</div>}

      </> : <div className="tv-emp-list"><table><thead><tr><th>Employee</th><th>ID</th><th>Department</th><th>Designation</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>

        {visible.map(e=><tr key={e._id}><td><b>{e.firstName} {e.lastName}</b><small>{e.email||"—"}</small></td><td>{e.employeeCode}</td><td>{e.department?.name||"—"}</td><td>{e.designation?.name||"—"}</td><td>{e.joiningDate?.slice(0,10)||"—"}</td><td><span className={"status "+(e.status==="ACTIVE"?"active":"inactive")}>{e.status}</span></td><td><div className="actions"><button className="outline" onClick={()=>openEdit(e)}><Pencil size={14}/>Edit</button><button className="text-btn" onClick={()=>setSelected(e)}>View</button><button className="outline" onClick={()=>openAppPassword(e)}>App Password</button></div></td></tr>)}

        {!visible.length && <tr><td colSpan="7" className="empty">No employees found</td></tr>}

      </tbody></table></div>}

      <div className="tv-emp-pagination"><span>Showing {visible.length} employees on page {page} · {total} total matching status/search</span><div><button disabled={page<=1} onClick={()=>setPage(v=>v-1)}>Previous</button><button disabled={page*40>=total} onClick={()=>setPage(v=>v+1)}>Next</button></div></div>

      {pwdEmployee && <div className="modal-backdrop" onClick={()=>{if(!pwdBusy)setPwdEmployee(null)}}>
        <div className="modal compact" onClick={e=>e.stopPropagation()}>
          <div className="modal-head"><div><span className="eyebrow">ATTENDANCE APP ACCESS</span><h2>Employee App Password</h2></div><button className="icon-btn" disabled={pwdBusy} onClick={()=>setPwdEmployee(null)}><X/></button></div>
          <p><strong>{pwdEmployee.employeeCode}</strong> — {pwdEmployee.firstName} {pwdEmployee.lastName}</p>
          <p>Mobile: {pwdEmployee.mobile || 'Not configured'}</p>
          <p>Status: {pwdConfigured===null?'Checking…':pwdConfigured?'Password configured':'Password not configured'}</p>
          <form onSubmit={saveAppPassword} autoComplete="off">
            <div className="form-grid">
              <label className="wide">New app password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={pwdValue} onChange={e=>setPwdValue(e.target.value)}/></label>
              <label className="wide">Confirm password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={pwdConfirm} onChange={e=>setPwdConfirm(e.target.value)}/></label>
            </div>
            <p style={{fontSize:12,color:'#718391'}}>The employee must change this temporary password. Resetting it signs out existing mobile sessions. Never share passwords in chat or email.</p>
            <Notice message={pwdError}/>
            <div className="modal-actions"><button type="button" className="outline" disabled={pwdBusy} onClick={()=>setPwdEmployee(null)}>Cancel</button><button className="primary" disabled={pwdBusy || pwdConfigured===null}>{pwdBusy?'Saving…':'Save App Password'}</button></div>
          </form>
        </div>
      </div>}
      {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal compact" onClick={e=>e.stopPropagation()}>

        <div className="modal-head"><div><span className="tv-emp-overline">Employee profile</span><h2>{selected.firstName} {selected.lastName}</h2></div><button className="icon-btn" onClick={()=>setSelected(null)}><X/></button></div>

        <div className="tv-emp-detail-grid">{[["Employee Code",selected.employeeCode],["Department",selected.department?.name],["Designation",selected.designation?.name],["Email",selected.email],["Phone",selected.mobile],["Joining Date",selected.joiningDate?.slice(0,10)],["Employment Type",selected.employmentType],["Status",selected.status]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value||"—"}</strong></div>)}</div>

        <div className="modal-actions"><button className="outline" onClick={()=>toggle(selected)}>{selected.status==="ACTIVE"?"Deactivate":"Activate"}</button><button className="primary" onClick={()=>openEdit(selected)}>Edit Employee</button></div>

      </div></div>}

      {modal && <div className="modal-backdrop"><div className="modal">

        <div className="modal-head"><div><span className="eyebrow">EMPLOYEE MASTER</span><h2>{editId?"Edit Employee":"New Employee"}</h2></div><button className="icon-btn" onClick={()=>setModal(false)}><X/></button></div>

        <form onSubmit={save}><div className="form-grid">

          <label className="wide">Employee ID
            <div className="tv-employee-id-entry">
              <span className="tv-employee-id-prefix">TT/E/</span>
              <input type="text" inputMode="numeric" pattern="[0-9]{1,5}" maxLength={5}
                required={!editId} readOnly={Boolean(editId)}
                placeholder="00001" value={form.employeeNumber || ""}
                onChange={e=>setForm({...form,employeeNumber:e.target.value.replace(/\D/g,"").slice(0,5)})} />
            </div>
            <small>{form.employeeNumber ? `Saved ID: TT/E/${form.employeeNumber.padStart(5,"0")}` : "Enter the last 1–5 digits"}</small>
          </label>

          {field("firstName","First name","text",true)}{field("lastName","Last name","text",true)}

          {field("email","Email","email")}{field("mobile","Mobile number")}

          {field("joiningDate","Joining date","date",true)}{field("dateOfBirth","Date of birth","date")}

          <label>Department<select required value={form.department} onChange={e=>setForm({...form,department:e.target.value,designation:""})}><option value="">Select department</option>{departments.filter(d=>d.active).map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></label>

          <label>Designation<select required value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}><option value="">Select designation</option>{validDesignations.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></label>

          <label>Employment type<select value={form.employmentType} onChange={e=>setForm({...form,employmentType:e.target.value})}>{["FULL_TIME","PART_TIME","CONTRACT","INTERN"].map(x=><option key={x}>{x}</option>)}</select></label>

          <label>Gender<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="">Select</option>{["Male","Female","Other","Prefer not to say"].map(x=><option key={x}>{x}</option>)}</select></label>

        </div><Notice message={err}/><div className="modal-actions"><button type="button" className="outline" onClick={()=>setModal(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving...":editId?"Save Changes":"Create Employee"}</button></div></form>

      </div></div>}

    </section>

  </>;

}



function Master({ type }) {



  const isDepartment = type === "departments";



  const label = isDepartment ? "Department" : "Designation";



  const emptyForm = () => ({ code: "", name: "", department: "", active: true });



  const [rows, setRows] = useState([]);



  const [departments, setDepartments] = useState([]);



  const [form, setForm] = useState(emptyForm);



  const [edit, setEdit] = useState(null);



  const [modal, setModal] = useState(false);



  const [err, setErr] = useState("");



  const [msg, setMsg] = useState("");



  const [saving, setSaving] = useState(false);



  const [refresh, setRefresh] = useState(0);







  useEffect(() => {



    let active = true;



    const requests = [api.get("/masters/" + type)];



    if (!isDepartment) requests.push(api.get("/masters/departments"));



    Promise.all(requests)



      .then(([list, deptList]) => {



        if (!active) return;



        setRows(list.data || []);



        setDepartments(deptList?.data || []);



      })



      .catch(e => { if (active) setErr(errorText(e)); });



    return () => { active = false; };



  }, [type, refresh, isDepartment]);







  function openNew() {



    setEdit(null);



    setForm(emptyForm());



    setErr("");



    setModal(true);



  }







  function openEdit(row) {



    setEdit(row._id);



    setForm({



      code: row.code || "",



      name: row.name || "",



      active: row.active !== false,



      department: row.department?._id || row.department || "",



    });



    setErr("");



    setModal(true);



  }







  async function save(e) {



    e.preventDefault();



    setSaving(true);



    setErr("");



    try {



      const payload = {



        code: form.code.trim(),



        name: form.name.trim(),



        active: form.active,



      };



      if (!isDepartment) payload.department = form.department || null;



      if (edit) await api.patch("/masters/" + type + "/" + edit, payload);



      else await api.post("/masters/" + type, payload);



      setModal(false);



      setMsg(label + " saved successfully");



      setRefresh(v => v + 1);



    } catch (e) {



      setErr(errorText(e));



    } finally {



      setSaving(false);



    }



  }







  return <>



    <PageHead



      eyebrow="ORGANIZATION"



      title={label + " Master"}



      desc={isDepartment ? "Manage departments." : "Create designations and assign each to a department."}



      action={<button className="primary" onClick={openNew}><Plus size={16}/> Add {label}</button>}



    />



    <Notice message={msg} type="success" />



    {!modal && <Notice message={err} />}



    <div className="card table-wrap">



      <table>



        <thead><tr><th>Code</th><th>Name</th>{!isDepartment && <th>Department</th>}<th>Status</th><th>Action</th></tr></thead>



        <tbody>



          {rows.map(row => <tr key={row._id}>



            <td className="mono">{row.code}</td>



            <td>{row.name}</td>



            {!isDepartment && <td>{row.department?.name || "Not assigned"}</td>}



            <td><span className={"status " + (row.active ? "active" : "inactive")}>{row.active ? "Active" : "Inactive"}</span></td>



            <td><button className="outline" onClick={() => openEdit(row)}><Pencil size={15}/> Edit</button></td>



          </tr>)}



          {!rows.length && <tr><td colSpan={isDepartment ? 4 : 5} className="empty">No records found.</td></tr>}



        </tbody>



      </table>



    </div>



    {modal && <div className="modal-backdrop"><div className="modal compact">



      <div className="modal-head"><h2>{edit ? "Edit" : "Add"} {label}</h2><button className="icon-btn" onClick={() => setModal(false)}><X/></button></div>



      <form onSubmit={save}>



        <div className="form-grid">



          <label>Code<input required maxLength={30} value={form.code} onChange={e => setForm({...form, code:e.target.value})}/></label>



          <label>Name<input required maxLength={150} value={form.name} onChange={e => setForm({...form, name:e.target.value})}/></label>



          {!isDepartment && <label>Department



            <select value={form.department || ""} onChange={e => setForm({...form,department:e.target.value})}>



              <option value="">Select department (optional)</option>



              {departments.filter(d => d.active || String(d._id) === String(form.department)).map(d => <option key={d._id} value={d._id}>{d.code} — {d.name}</option>)}



            </select>



          </label>}



          <label>Active<select value={String(form.active)} onChange={e => setForm({...form,active:e.target.value === "true"})}><option value="true">Active</option><option value="false">Inactive</option></select></label>



        </div>



        <Notice message={err} />



        <div className="modal-actions">



          <button type="button" className="outline" onClick={() => setModal(false)}>Cancel</button>



          <button className="primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>



        </div>



      </form>



    </div></div>}



  </>;



}







function Components(){const[rows,setRows]=useState([]),[err,setErr]=useState(""),[modal,setModal]=useState(false),[form,setForm]=useState({code:"",name:"",type:"EARNING",calculationType:"FIXED",proratable:true}),[refresh,setRefresh]=useState(0);useEffect(()=>{api.get("/config/salary-components").then(r=>setRows(r.data)).catch(e=>setErr(errorText(e)))},[refresh]);async function save(e){e.preventDefault();try{await api.post("/config/salary-components",form);setModal(false);setRefresh(x=>x+1)}catch(e){setErr(errorText(e))}}return <><PageHead eyebrow="PAYROLL CONFIGURATION" title="Salary Components" desc="Dynamic earning and deduction component definitions." action={<button className="primary" onClick={()=>setModal(true)}><Plus size={16}/> Add Component</button>}/><Notice message={err}/><div className="card table-wrap"><table><thead><tr><th>Code</th><th>Component</th><th>Type</th><th>Calculation</th><th>Proratable</th></tr></thead><tbody>{rows.map(r=><tr key={r._id}><td className="mono">{r.code}</td><td>{r.name}</td><td>{r.type}</td><td>{r.calculationType}</td><td>{r.proratable?"Yes":"No"}</td></tr>)}{!rows.length&&<tr><td colSpan="5" className="empty">No salary components configured.</td></tr>}</tbody></table></div>{modal&&<div className="modal-backdrop"><div className="modal compact"><div className="modal-head"><h2>Add Salary Component</h2><button className="icon-btn" onClick={()=>setModal(false)}><X/></button></div><form onSubmit={save}><div className="form-grid"><label>Code<input required value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></label><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>EARNING</option><option>DEDUCTION</option></select></label><label>Calculation<select value={form.calculationType} onChange={e=>setForm({...form,calculationType:e.target.value})}>{["FIXED","PERCENTAGE","FORMULA","MANUAL"].map(x=><option key={x}>{x}</option>)}</select></label><label>Proratable<select value={String(form.proratable)} onChange={e=>setForm({...form,proratable:e.target.value==="true"})}><option value="true">Yes</option><option value="false">No</option></select></label></div><Notice message={err}/><div className="modal-actions"><button type="button" className="outline" onClick={()=>setModal(false)}>Cancel</button><button className="primary">Save</button></div></form></div></div>}</>}



function Rules(){const[rows,setRows]=useState([]),[err,setErr]=useState(""),[refresh,setRefresh]=useState(0),[modal,setModal]=useState(false),[form,setForm]=useState({code:"",name:"",category:"ATTENDANCE",effectiveFrom:new Date().toISOString().slice(0,10),config:"{}"});useEffect(()=>{api.get("/config/rules").then(r=>setRows(r.data)).catch(e=>setErr(errorText(e)))},[refresh]);async function save(e){e.preventDefault();try{const config=JSON.parse(form.config);if(!config||Array.isArray(config)||typeof config!=="object")throw Error("Config must be a JSON object");await api.post("/config/rules",{...form,config});setModal(false);setErr("");setRefresh(x=>x+1)}catch(e){setErr(errorText(e))}}return <><PageHead eyebrow="DYNAMIC CONFIGURATION" title="Payroll Rules" desc="Versioned attendance, deduction, statutory and approval rule definitions." action={<button className="primary" onClick={()=>setModal(true)}><Plus size={16}/> New Rule Version</button>}/><div className="info"><AlertCircle size={18}/> These rules are stored in MongoDB but are not evaluated by a payroll calculation engine in Phase 1.</div><Notice message={err}/><div className="card table-wrap"><table><thead><tr><th>Rule Code</th><th>Name</th><th>Category</th><th>Version</th><th>Effective From</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r._id}><td className="mono">{r.code}</td><td>{r.name}</td><td>{r.category}</td><td>v{r.version}</td><td>{r.effectiveFrom?.slice(0,10)}</td><td>{r.active?"Active":"Inactive"}</td></tr>)}{!rows.length&&<tr><td colSpan="6" className="empty">No rules defined.</td></tr>}</tbody></table></div>{modal&&<div className="modal-backdrop"><div className="modal compact"><div className="modal-head"><h2>Create Rule Version</h2><button className="icon-btn" onClick={()=>setModal(false)}><X/></button></div><form onSubmit={save}><div className="form-grid"><label>Rule code<input required value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></label><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["ATTENDANCE","EARNING","DEDUCTION","STATUTORY","APPROVAL"].map(x=><option key={x}>{x}</option>)}</select></label><label>Effective from<input type="date" required value={form.effectiveFrom} onChange={e=>setForm({...form,effectiveFrom:e.target.value})}/></label><label className="wide">Rule config (JSON)<textarea rows="6" value={form.config} onChange={e=>setForm({...form,config:e.target.value})}/></label></div><Notice message={err}/><div className="modal-actions"><button type="button" className="outline" onClick={()=>setModal(false)}>Cancel</button><button className="primary">Create Version</button></div></form></div></div>}</>}



function Settings(){const[rows,setRows]=useState([]),[values,setValues]=useState({}),[err,setErr]=useState(""),[msg,setMsg]=useState("");useEffect(()=>{api.get("/config/settings").then(r=>{setRows(r.data);setValues(Object.fromEntries(r.data.map(x=>[x.key,typeof x.value==="object"?JSON.stringify(x.value):String(x.value)])))}).catch(e=>setErr(errorText(e)))},[]);async function save(row){try{let value=values[row.key];if(typeof row.value==="boolean"){if(!["true","false"].includes(value))throw Error("Enter true or false");value=value==="true"}else if(typeof row.value==="number"){value=Number(value);if(!Number.isFinite(value))throw Error("Invalid number")}else if(typeof row.value==="object"){value=JSON.parse(value)}await api.put("/config/settings/"+encodeURIComponent(row.key),{value,description:row.description});setMsg(row.key+" saved");setErr("")}catch(e){setErr(errorText(e))}}return <><PageHead eyebrow="ORGANIZATION" title="Company Settings" desc="MongoDB-backed company and payroll policy values."/><div className="info"><AlertCircle size={18}/> These values are editable in the backend. Payroll calculation and policy-lock enforcement are not yet implemented.</div><Notice message={err}/><Notice message={msg} type="success"/><div className="card settings-list">{rows.map(r=><div className="setting-row" key={r._id}><div><b>{r.key}</b><small>{r.description||"System configuration"}</small></div><input value={values[r.key]??""} onChange={e=>setValues({...values,[r.key]:e.target.value})}/><button className="outline" onClick={()=>save(r)}>Save</button></div>)}</div></>}



export default function App(){const[user,setUser]=useState(getUser);const navigate=useNavigate();function logout(){localStorage.removeItem("tv_payroll_token");localStorage.removeItem("tv_payroll_user");setUser(null);navigate("/login")}return <Routes><Route path="/login" element={user?<Navigate to="/"/>:<Login onLogin={setUser}/>}/><Route path="/*" element={!user?<Navigate to="/login"/>:<Shell user={user} onLogout={logout}><Routes><Route path="/" element={<Dashboard/>}/><Route path="/employees" element={<Employees/>}/><Route path="/departments" element={<Master type="departments"/>}/><Route path="/sites" element={<SiteMaster/>}/><Route path="/designations" element={<Master type="designations"/>}/><Route path="/salary-components" element={<Components/>}/><Route path="/salary-structures" element={<SalaryStructures/>}/><Route path="/payroll" element={<PayrollWorkspace/>}/><Route path="/payroll-operations" element={<Navigate to="/salary-structures" replace/>}/><Route path="/site-attendance" element={<SiteAttendanceReview/>}/><Route path="/payslips" element={<Payslips/>}/><Route path="/payroll-policy" element={<PayrollPolicy/>}/><Route path="/rules" element={<Rules/>}/><Route path="/settings" element={<CompanySettings/>}/><Route path="/users-access" element={["ADMIN", "SUPER_ADMIN"].includes(user?.role)?<UserManagement/>:<Navigate to="/"/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></Shell>}/></Routes>}
