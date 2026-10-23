import React, { useCallback, useEffect, useState } from 'react';
import { api, errorText } from './api';

const tz = 'Asia/Kolkata';
const fmtDate = value => value ? new Intl.DateTimeFormat('en-IN', {timeZone:tz, day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)) : '—';
const fmtTime = value => value ? new Intl.DateTimeFormat('en-IN', {timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(value)) : '—';
const duration = r => !r.checkedOutAt || !r.checkedInAt ? '—' : (() => {
  const minutes = Math.max(0, Math.floor((new Date(r.checkedOutAt)-new Date(r.checkedInAt))/60000));
  return `${Math.floor(minutes/60)}h ${minutes%60}m`;
})();
const toIso = (date, nextDay=false) => {
  if (!date) return undefined;
  const base = new Date(`${date}T00:00:00+05:30`);
  if (nextDay) base.setTime(base.getTime()+86400000);
  return base.toISOString();
};
const asText = x => String(x ?? '').replace(/\r?\n/g,' ');
const tableStyle = {borderCollapse:'collapse',minWidth:1100,width:'100%',fontSize:13};
const cellStyle = {padding:'11px 9px',borderBottom:'1px solid #e6e9ee',textAlign:'left',verticalAlign:'top'};
const inputStyle = {minWidth:140,padding:9,border:'1px solid #d9e0e7',borderRadius:7};

function Status({value}) {
  const colors={PENDING:['#FFF2DE','#8A5200'],APPROVED:['#E2F7EC','#126A37'],REJECTED:['#FFE6E5','#A12723']};
  const [bg,fg]=colors[value] || ['#EFF2F6','#43566A'];
  return <span style={{background:bg,color:fg,borderRadius:14,padding:'5px 10px',fontWeight:600,whiteSpace:'nowrap'}}>{value||'—'}</span>;
}

export default function SiteAttendanceReview() {
  const [rows,setRows]=useState([]),[total,setTotal]=useState(0),[page,setPage]=useState(1);
  const [status,setStatus]=useState('ALL'),[visit,setVisit]=useState('ALL');
  const [from,setFrom]=useState(''),[to,setTo]=useState('');
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [selected,setSelected]=useState(null),[decision,setDecision]=useState('APPROVED'),[note,setNote]=useState('');
  const limit=50;
  const refresh = useCallback(async()=>{
    setLoading(true);setError('');
    try {
      const params={page,limit,status,visit};
      if(from) params.from=toIso(from);
      if(to) params.to=toIso(to,true);
      const {data}=await api.get('/admin/site-attendance',{params});
      setRows(Array.isArray(data?.attendance)?data.attendance:[]);
      setTotal(Number(data?.total)||0);
    } catch(e) {setError(errorText(e));}
    finally {setLoading(false);}
  },[page,status,visit,from,to]);
  useEffect(()=>{refresh();},[refresh]);
  const change=(setter,value)=>{setter(value);setPage(1);};
  async function review() {
    if(!selected || busy) return;
    if ((selected.checkInMethod==='HR_EXCEPTION'||selected.checkOutMethod==='HR_EXCEPTION') && decision==='APPROVED' && note.trim().length<20){
      setError('Indoor attendance approval requires at least 20 characters describing independent verification.');return;
    }
    if(!window.confirm(`${decision==='APPROVED'?'Approve':'Reject'} this attendance record?`)) return;
    setBusy(true);setError('');setMessage('');
    try {
      await api.patch(`/admin/site-attendance/${selected._id}/review`,{status:decision,note:note.trim()});
      setSelected(null);setNote('');setMessage('Attendance review saved. TA payment is not created automatically.');
      await refresh();
    } catch(e){setError(errorText(e));} finally {setBusy(false);}
  }
  const safeCsv = value => {
    const v=asText(value);
    // Prevent spreadsheet formula injection when CSV is opened in Excel.
    const clean=/^[\s]*[=+@\-]/.test(v)?`'${v}`:v;
    return `"${clean.replace(/"/g,'""')}"`;
  };
  function exportCsv(){
    const headers=['Employee','Site','Date IST','Check in IST','Check out IST','Duration','Check in method','Check out method','Check-in accuracy m','Check-out accuracy m','Check-in distance m','Check-out distance m','HR status','Indoor reasons','Review note','Site TA policy','Indicative fixed daily TA INR'];
    const data=rows.map(r=>[
      `${r.employee?.employeeCode||'—'} ${r.employee?.firstName||''} ${r.employee?.lastName||''}`,
      r.siteSnapshot?.name||r.site?.name,fmtDate(r.checkedInAt),fmtTime(r.checkedInAt),fmtTime(r.checkedOutAt),duration(r),
      r.checkInMethod||'GPS',r.checkOutMethod||'',r.checkIn?.accuracyMeters,r.checkOut?.accuracyMeters,
      r.checkIn?.distanceMeters,r.checkOut?.distanceMeters,r.verificationStatus,
      [r.indoorCheckInReason,r.indoorCheckOutReason].filter(Boolean).join(' | '),r.reviewNote,r.site?.taPolicy,r.site?.fixedDailyTA
    ]);
    const content=[headers,...data].map(x=>x.map(safeCsv).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8;'}));
    const link=document.createElement('a');link.href=url;link.download=`site-attendance-page-${page}.csv`;link.click();URL.revokeObjectURL(url);
  }
  const open=rows.filter(r=>r.open).length;
  const pending=rows.filter(r=>r.verificationStatus==='PENDING').length;
  const approved=rows.filter(r=>r.verificationStatus==='APPROVED').length;
  const card=(label,value)=> <div style={{background:'white',border:'1px solid #e3e7ed',borderRadius:12,padding:17,flex:'1 1 150px'}}><small style={{color:'#66788a'}}>{label}</small><div style={{fontSize:25,fontWeight:750,marginTop:6}}>{value}</div></div>;
  return <div style={{padding:24,display:'grid',gap:18}}>
    <div><h2 style={{marginBottom:6}}>Site Attendance / TA</h2><p style={{color:'#66788a',margin:0}}>Attendance is fetched from the Android app's MongoDB records. HR reviews the completed visits.</p></div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>{card('Total matching visits',total)}{card('Open visits on this page',open)}{card('Pending on this page',pending)}{card('Approved on this page',approved)}</div>
    <section className="card" style={{padding:20,display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
      <label>From (IST)<br/><input style={inputStyle} type="date" value={from} onChange={e=>change(setFrom,e.target.value)}/></label>
      <label>To (IST)<br/><input style={inputStyle} type="date" value={to} onChange={e=>change(setTo,e.target.value)}/></label>
      <label>HR status<br/><select style={inputStyle} value={status} onChange={e=>change(setStatus,e.target.value)}>{['ALL','PENDING','APPROVED','REJECTED'].map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Visit<br/><select style={inputStyle} value={visit} onChange={e=>change(setVisit,e.target.value)}>{['ALL','OPEN','CLOSED'].map(s=><option key={s}>{s}</option>)}</select></label>
      <button type="button" onClick={refresh} disabled={loading||busy}>{loading?'Loading…':'Refresh from App'}</button>
      <button type="button" onClick={exportCsv} disabled={!rows.length}>Export visible page CSV</button>
    </section>
    {error && <div role="alert" style={{color:'#b42318'}}>{error}</div>}{message&&<div style={{color:'#176534'}}>{message}</div>}
    <section className="card" style={{padding:20,overflowX:'auto'}}><h3>App attendance records</h3>
      <table style={tableStyle}><thead><tr>{['Employee','Site','Date','Check In','Check Out','Duration','GPS / Indoor','Verification','Site TA Policy','Actions'].map(k=><th key={k} style={{...cellStyle,background:'#f4f6f8'}}>{k}</th>)}</tr></thead>
      <tbody>{rows.map(r=>{
        const indoor=r.checkInMethod==='HR_EXCEPTION'||r.checkOutMethod==='HR_EXCEPTION';
        const policy=r.site?.taPolicy||'—';
        return <tr key={r._id}>
          <td style={cellStyle}><strong>{r.employee?.employeeCode||'—'}</strong><div>{r.employee?.firstName} {r.employee?.lastName}</div></td>
          <td style={cellStyle}>{r.siteSnapshot?.name||r.site?.name||'—'}<div style={{color:'#66788a'}}>{r.siteSnapshot?.city||r.site?.city||''}</div></td>
          <td style={cellStyle}>{fmtDate(r.checkedInAt)}</td><td style={cellStyle}>{fmtTime(r.checkedInAt)}</td>
          <td style={cellStyle}>{r.open?'Not completed':fmtTime(r.checkedOutAt)}</td><td style={cellStyle}>{duration(r)}</td>
          <td style={cellStyle}>{indoor?<span style={{color:'#9a5613'}}>Indoor / HR verification</span>: 'GPS'}<div style={{fontSize:12,color:'#64748b'}}>In ±{r.checkIn?.accuracyMeters ?? '—'} m; out ±{r.checkOut?.accuracyMeters ?? '—'} m</div></td>
          <td style={cellStyle}><Status value={r.verificationStatus}/></td>
          <td style={cellStyle}>{policy}{(policy==='FIXED'||policy==='BOTH')&&<div style={{fontSize:11,color:'#64748b'}}>Configured ₹{Number(r.site?.fixedDailyTA||0)} / day*</div>}</td>
          <td style={cellStyle}><button type="button" onClick={()=>{setSelected(r);setDecision('APPROVED');setNote('');setError('');}}>View / Review</button></td>
        </tr>})}</tbody></table>
      {!loading&&!rows.length&&<p>No Android attendance records match these filters.</p>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:18}}>
        <small>Page {page} of {Math.max(1,Math.ceil(total/limit))} · {total} matching records</small>
        <div style={{display:'flex',gap:8}}><button type="button" disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><button type="button" disabled={page*limit>=total||loading} onClick={()=>setPage(p=>p+1)}>Next</button></div>
      </div>
    </section>
    <p style={{fontSize:12,color:'#64748b',margin:0}}>* Configured fixed daily TA is informational only. HR approval of attendance does not create payroll TA, establish payable eligibility, or prevent duplicate allowances. Historical manual operations remain unchanged in their original records.</p>
    {selected&&<section className="card" style={{padding:22,border:'2px solid #f38a22'}}>
      <h3>Visit details / HR review</h3>
      <p><strong>{selected.employee?.employeeCode}</strong> · {selected.siteSnapshot?.name} · {fmtDate(selected.checkedInAt)}</p>
      <p>Check-in: {fmtTime(selected.checkedInAt)} ({selected.checkInMethod}) · Checkout: {fmtTime(selected.checkedOutAt)} ({selected.checkOutMethod||'—'})</p>
      <p>Check-in GPS: {selected.checkIn ? `${selected.checkIn.latitude}, ${selected.checkIn.longitude} · ±${selected.checkIn.accuracyMeters} m · ${selected.checkIn.distanceMeters ?? '—'} m from site` : 'Not verified'}</p>
      <p>Checkout GPS: {selected.checkOut ? `${selected.checkOut.latitude}, ${selected.checkOut.longitude} · ±${selected.checkOut.accuracyMeters} m · ${selected.checkOut.distanceMeters ?? '—'} m from site` : 'Not verified'}</p>
      {selected.indoorCheckInReason&&<p>Indoor check-in reason: {selected.indoorCheckInReason}</p>}
      {selected.indoorCheckOutReason&&<p>Indoor checkout reason: {selected.indoorCheckOutReason}</p>}
      {selected.reviewReasons?.length>0&&<p>Review flags: {selected.reviewReasons.join(', ')}</p>}
      {selected.verificationStatus==='PENDING'&&!selected.open ? <>
        <label>Decision <select style={inputStyle} value={decision} onChange={e=>setDecision(e.target.value)}><option value="APPROVED">Approve</option><option value="REJECTED">Reject</option></select></label>
        <div style={{marginTop:12}}><label>HR verification note<br/><textarea style={{width:'100%',minHeight:80,padding:10,marginTop:5}} maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="For indoor exceptions, describe how employee presence was independently verified"/></label></div>
        <button className="primary" type="button" disabled={busy} onClick={review}>{busy?'Saving…':'Save HR Review'}</button>
      </> : <p>{selected.open?'Cannot approve until checkout is completed.':`Already ${selected.verificationStatus}. ${selected.reviewNote||''}`}</p>}
      <button type="button" style={{marginLeft:10}} onClick={()=>setSelected(null)}>Close</button>
    </section>}
  </div>;
}
