import React,{useEffect,useState} from "react";
import {Plus,Search,RefreshCcw,History,X,Wallet} from "lucide-react";
import {api,errorText} from "./api";
const money=n=>Number(n||0).toLocaleString("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2});
const localToday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export default function SalaryStructures(){
 const [advances,setAdvances]=useState([]),[recoveries,setRecoveries]=useState([]),[advanceAmount,setAdvanceAmount]=useState(""),[advanceDate,setAdvanceDate]=useState(localToday()),[advanceReason,setAdvanceReason]=useState(""),[advanceReference,setAdvanceReference]=useState(""),[recoveryAdvance,setRecoveryAdvance]=useState(""),[recoveryAmount,setRecoveryAmount]=useState(""),[recoveryYear,setRecoveryYear]=useState(new Date().getFullYear()),[recoveryMonth,setRecoveryMonth]=useState(new Date().getMonth()+1),[people,setPeople]=useState([]),[components,setComponents]=useState([]),[selected,setSelected]=useState(""),[search,setSearch]=useState(""),[revisions,setRevisions]=useState([]),[current,setCurrent]=useState(null),[date,setDate]=useState(localToday()),[notes,setNotes]=useState(""),[amounts,setAmounts]=useState({}),[editing,setEditing]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[elig,setElig]=useState(null);
 const loadMasters=async()=>{try{const [e,c]=await Promise.all([api.get('/employees',{params:{page:1,limit:100}}),api.get('/config/salary-components')]);setPeople(e.data.data);setComponents(c.data.filter(x=>x.active&&x.type==='EARNING'&&['FIXED','MANUAL'].includes(x.calculationType)));}catch(e){setError(errorText(e))}};
 useEffect(()=>{loadMasters()},[]);
 const loadSalary=async id=>{setLoading(true);setError("");try{const [history,active,eligibility]=await Promise.all([api.get(`/salary-structures/employee/${id}`),api.get(`/salary-structures/employee/${id}/current`,{params:{asOf:localToday()}}),api.get(`/payroll-policy/eligibility/${id}`)]);setRevisions(history.data);setCurrent(active.data.data);setElig(eligibility.data)}catch(e){setError(errorText(e))}finally{setLoading(false)}};
 useEffect(()=>{if(selected){loadSalary(selected);setEditing(false)}else{setCurrent(null);setRevisions([]);setElig(null)}},[selected]);
 const loadAdvances=async()=>{try{const [a,r]=await Promise.all([api.get('/payroll-operations/advances'),api.get('/payroll-operations/recoveries')]);setAdvances((a.data||[]).filter(x=>String(x.employee?._id||x.employee)===String(selected)));setRecoveries((r.data||[]).filter(x=>String(x.employee?._id||x.employee)===String(selected)))}catch(e){setError(errorText(e))}};
 useEffect(()=>{if(selected)loadAdvances();else{setAdvances([]);setRecoveries([])}},[selected]);
 const advanceRun=async(fn)=>{setBusy(true);setError("");setMessage("");try{await fn();await loadAdvances();setMessage("Advance record updated successfully")}catch(e){setError(errorText(e))}finally{setBusy(false)}};
 const createAdvance=e=>{e.preventDefault();advanceRun(()=>api.post('/payroll-operations/advances',{employee:selected,amount:Number(advanceAmount),date:advanceDate,reason:advanceReason,reference:advanceReference}))};
 const createRecovery=e=>{e.preventDefault();advanceRun(()=>api.post('/payroll-operations/recoveries',{advance:recoveryAdvance,year:Number(recoveryYear),month:Number(recoveryMonth),amount:Number(recoveryAmount)}))};
 const markAdvancePaid=id=>{if(window.confirm('Confirm the employee has actually received this advance?'))advanceRun(()=>api.post(`/payroll-operations/advances/${id}/pay`))};
 const decideRecovery=(id,status)=>{if(window.confirm(`${status==="APPROVED"?"Approve":"Reject"} this salary recovery?`))advanceRun(()=>api.post(`/payroll-operations/recoveries/${id}/decision`,{status}))};
 const removeAdvance=id=>{if(window.confirm('Delete this unpaid advance?'))advanceRun(()=>api.delete(`/payroll-operations/advances/${id}`))};
 const removeRecovery=id=>{if(window.confirm('Delete this pending recovery?'))advanceRun(()=>api.delete(`/payroll-operations/recoveries/${id}`))};
 const paiseMoney=n=>money(Number(n||0)/100);
 const filtered=people.filter(p=>`${p.employeeCode} ${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()));
 const selectPerson=id=>{setSelected(id);setMessage("");setError("")};
 
const startNew = () => {
  const pref = {};

  for (const c of components) {
    const old = current?.items.find(
      i => i.componentId === c._id
    );

    pref[c._id] = old?.amount || "0.00";
  }

  setAmounts(pref);

  // Fetch selected employee from Employee Master data
  const selectedEmployee = people.find(
    p => p._id === selected
  );

  const joiningDate = selectedEmployee?.joiningDate
    ? String(selectedEmployee.joiningDate).slice(0, 10)
    : "";

  // First revision uses joining date.
  // Subsequent revisions use today's date by default.
  setDate(
    revisions.length === 0
      ? (joiningDate || localToday())
      : localToday()
  );

  setNotes("");
  setEditing(true);
  setError("");
};

 const sumPaise=components.reduce((sum,c)=>{const raw=String(amounts[c._id]??'0');if(!/^\d+(\.\d{1,2})?$/.test(raw))return sum;const [w,f='']=raw.split('.');return sum+Number(w)*100+Number(f.padEnd(2,'0'))},0);
 const create=async e=>{e.preventDefault();if(!window.confirm('Create a permanent salary revision effective '+date+'? Earlier revisions will remain available.'))return;setBusy(true);setError("");try{const items=components.filter(c=>amounts[c._id]!==undefined&&String(amounts[c._id]).trim()!=="").map(c=>({componentId:c._id,amount:String(amounts[c._id])}));await api.post(`/salary-structures/employee/${selected}`,{effectiveFrom:date,notes,items});setEditing(false);setMessage('Salary revision saved successfully');await loadSalary(selected)}catch(e){setError(errorText(e))}finally{setBusy(false)}};
 const role=(()=>{try{return JSON.parse(localStorage.getItem('tv_payroll_user')||'{}').role}catch{return ''}})();
 const canWrite=['ADMIN','HR'].includes(role);
 const canApprove=['ADMIN','SUPER_ADMIN'].includes(role);
 return <><div className="page-head"><div><span className="eyebrow">PAYROLL / PHASE 2</span><h1>Employee Salary Structures</h1><p>Manage effective-dated earnings without overwriting historical salaries.</p></div><button className="outline" onClick={loadMasters}><RefreshCcw size={16}/> Refresh Employees</button></div>
 {error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}
 <div className="salary-layout"><section className="card salary-people"><h3>Employees</h3><div className="search"><Search size={16}/><input placeholder="Search name or employee code" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="salary-people-list">{filtered.map(p=><button key={p._id} className={'salary-person '+(selected===p._id?'chosen':'')} onClick={()=>selectPerson(p._id)}><b>{p.firstName} {p.lastName}</b><small>{p.employeeCode} · {p.status}</small></button>)}{!filtered.length&&<p>No employees loaded. Employee API is paginated at 100 records; use backend-side search for larger organizations.</p>}</div></section>
 <section className="salary-detail"><div className="card">{!selected?<div className="salary-placeholder"><Wallet size={32}/><h3>Select an employee</h3><p>Select an employee to view and configure the monthly salary structure.</p></div>:<><div className="salary-head"><div><span className="eyebrow">CURRENT SALARY STRUCTURE</span><h3>{people.find(p=>p._id===selected)?.firstName} {people.find(p=>p._id===selected)?.lastName}</h3></div>{canWrite&&<button className="primary" disabled={components.length===0} onClick={startNew}><Plus size={16}/> New Revision</button>}</div>{elig&&<div className="info" style={{marginBottom:12}}>Statutory Eligibility: PF <b>{elig.pf?'Yes':'No'}</b> · ESIC <b>{elig.esic?'Yes':'No'}</b> · PT <b>{elig.pt?'Yes':'No'}</b> · Insurance <b>{elig.insurance?'Yes':'No'}</b> · TDS <b>{elig.tds?`${elig.tdsPercent||0}%`:'No'}</b>. Configure these in Payroll Settings.</div>}{loading?<p>Loading salary structure...</p>:current?<><div className="salary-amount">{money(current.monthlyGross)}<small>Monthly gross · Effective {current.effectiveFrom}</small></div><div className="table-wrap"><table><thead><tr><th>Earning Component</th><th>Monthly Amount</th></tr></thead><tbody>{current.items.map(it=><tr key={it.componentId}><td>{it.name} <small>{it.code}</small></td><td>{money(it.amount)}</td></tr>)}</tbody></table></div></>:<div className="info">No salary revision effective as of today. Create a salary structure or check future revisions below.</div>}</>}</div>
 {selected&&<div className="card" style={{display:"grid",gap:16}}>
 <div><h3>Salary Advances & Recovery</h3><p style={{color:"#64748b"}}>Record paid advances and schedule monthly deductions. Salary structure amounts remain unchanged.</p></div>
 {canWrite&&<form onSubmit={createAdvance} style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"end"}}>
 <label>Advance amount (₹)<input type="number" min="0.01" step="0.01" required value={advanceAmount} onChange={e=>setAdvanceAmount(e.target.value)}/></label>
 <label>Issue date<input type="date" required value={advanceDate} onChange={e=>setAdvanceDate(e.target.value)}/></label>
 <label>Reason<input maxLength={500} value={advanceReason} onChange={e=>setAdvanceReason(e.target.value)}/></label>
 <label>Payment reference<input maxLength={100} value={advanceReference} onChange={e=>setAdvanceReference(e.target.value)}/></label>
 <button className="primary" disabled={busy}>Record Advance</button></form>}
 <div className="table-wrap"><table><thead><tr><th>Issued</th><th>Advance</th><th>Approved recovery</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead><tbody>
 {advances.map(a=>{const approved=recoveries.filter(r=>String(r.advance?._id||r.advance)===String(a._id)&&r.status==="APPROVED").reduce((v,r)=>v+Number(r.amountPaise||0),0);return <tr key={a._id}><td>{a.date}</td><td>{paiseMoney(a.amountPaise)}</td><td>{paiseMoney(approved)}</td><td>{paiseMoney(Math.max(0,Number(a.amountPaise||0)-approved))}</td><td>{a.paid?"Paid":"Not paid"}</td><td><div className="actions">{canWrite&&!a.paid&&<button type="button" disabled={busy} onClick={()=>removeAdvance(a._id)}>Delete</button>}{canApprove&&!a.paid&&<button type="button" disabled={busy} onClick={()=>markAdvancePaid(a._id)}>Mark Paid</button>}</div></td></tr>})}
 {!advances.length&&<tr><td colSpan={6}>No salary advances for this employee.</td></tr>}
 </tbody></table></div>
 {canWrite&&<form onSubmit={createRecovery} style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"end"}}>
 <label>Paid advance<select required value={recoveryAdvance} onChange={e=>setRecoveryAdvance(e.target.value)}><option value="">Select advance</option>{advances.filter(a=>a.paid&&Number(a.amountPaise)>Number(a.recoveredPaise||0)).map(a=><option key={a._id} value={a._id}>{a.date} — {paiseMoney(Number(a.amountPaise)-Number(a.recoveredPaise||0))} remaining</option>)}</select></label>
 <label>Recovery year<input required type="number" min="2020" max="2100" value={recoveryYear} onChange={e=>setRecoveryYear(e.target.value)}/></label>
 <label>Month<select value={recoveryMonth} onChange={e=>setRecoveryMonth(e.target.value)}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{new Date(2026,i,1).toLocaleString("en-IN",{month:"long"})}</option>)}</select></label>
 <label>Deduction amount (₹)<input required type="number" min="0.01" step="0.01" value={recoveryAmount} onChange={e=>setRecoveryAmount(e.target.value)}/></label>
 <button className="primary" disabled={busy}>Schedule Recovery</button></form>}
 <div className="table-wrap"><table><thead><tr><th>Payroll month</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
 {recoveries.map(r=><tr key={r._id}><td>{r.month}/{r.year}</td><td>{paiseMoney(r.amountPaise)}</td><td>{r.status}</td><td><div className="actions">{r.status==="PENDING"&&<>{canApprove&&<><button type="button" disabled={busy} onClick={()=>decideRecovery(r._id,"APPROVED")}>Approve</button><button type="button" disabled={busy} onClick={()=>decideRecovery(r._id,"REJECTED")}>Reject</button></>}{canWrite&&<button type="button" disabled={busy} onClick={()=>removeRecovery(r._id)}>Delete</button>}</>}</div></td></tr>)}
 {!recoveries.length&&<tr><td colSpan={4}>No recoveries scheduled.</td></tr>}
 </tbody></table></div>
 <div className="info">Only paid advances can be recovered. Approved recovery is deducted by Monthly Payroll; historical approved payroll cannot be edited here.</div>
 </div>}
 {selected&&<div className="card"><h3><History size={17} style={{verticalAlign:'middle',marginRight:8}}/>Revision History</h3><div className="table-wrap"><table><thead><tr><th>Revision</th><th>Effective Date</th><th>Gross</th><th>Notes</th></tr></thead><tbody>{revisions.map(r=><tr key={r.id}><td>#{r.revision}</td><td>{r.effectiveFrom}</td><td>{money(r.monthlyGross)}</td><td>{r.notes||'—'}</td></tr>)}{!revisions.length&&<tr><td colSpan="4" className="empty">No revisions created yet.</td></tr>}</tbody></table></div></div>}</section></div>
 {editing&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span className="eyebrow">EMPLOYEE SALARY</span><h2>Create Salary Revision</h2></div><button type="button" className="icon-btn" onClick={()=>setEditing(false)}><X/></button></div><form onSubmit={create}><div className="form-grid"><label>Effective From<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Revision Notes<input value={notes} maxLength={500} onChange={e=>setNotes(e.target.value)} placeholder="Annual increment / new joining"/></label>{components.map(c=><label key={c._id}>{c.name} ({c.code})<input type="number" min="0" max="9999999999.99" step="0.01" required value={amounts[c._id]??''} onChange={e=>setAmounts({...amounts,[c._id]:e.target.value})}/></label>)}</div><div className="salary-amount">{money(sumPaise/100)}<small>Monthly gross total</small></div><div className="info">Salary revisions are immutable. Each new effective date creates a new historical record. Deductions, overtime and net pay will be processed in later phases.</div>{error&&<div className="error">{error}</div>}<div className="modal-actions"><button type="button" className="outline" onClick={()=>setEditing(false)}>Cancel</button><button className="primary" disabled={busy||sumPaise<=0}>{busy?'Saving...':'Save Salary Revision'}</button></div></form></div></div>}
 </>;
}
