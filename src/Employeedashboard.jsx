import { useState, useEffect, useCallback } from "react";
import { taskAPI, attendanceAPI, dashboardAPI, authAPI } from "./api";
import ThemeToggle from "./ThemeToggle";

const PRIORITY_COLORS   = { Low:"#22d3ee", Medium:"#a78bfa", High:"#f59e0b", Critical:"#ef4444" };
const STATUS_COLORS_TASK = { Pending:"#f59e0b", "In Progress":"#38bdf8", Completed:"#10b981" };

const Badge = ({ color, children }) => (
  <span style={{ fontSize:"10px",fontWeight:"700",color,background:color+"20",border:`1px solid ${color}40`,borderRadius:"5px",padding:"2px 8px",fontFamily:"monospace",whiteSpace:"nowrap" }}>{children}</span>
);
const ProgressRing = ({ value, size=80, stroke=7, color="#4fd1c5" }) => {
  const r=(size-stroke)/2, circ=2*Math.PI*r, offset=circ-(value/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease-out" }}/>
    </svg>
  );
};
const StarRating = ({ rating, max=5 }) => (
  <div style={{ display:"flex",gap:"3px" }}>
    {Array.from({length:max}).map((_,i)=>(
      <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i<Math.floor(rating)?"#f59e0b":"none"} stroke="#f59e0b" strokeWidth="1.5">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>
    ))}
  </div>
);
const Spinner = () => <div style={{ width:"32px",height:"32px",border:"3px solid rgba(79,209,197,0.15)",borderTopColor:"#4fd1c5",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"60px auto" }}/>;

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id:"tasks",      label:"My Tasks",    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id:"performance", label:"Performance", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id:"attendance", label:"Attendance",   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id:"profile",    label:"My Profile",  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function EmployeeDashboard({ onLogout, currentUser, theme, toggleTheme }) {
  const t = theme || { name:'dark', bg:'#060e1a', bgSidebar:'rgba(6,12,24,0.97)', bgCard:'rgba(255,255,255,0.02)', bgCardHover:'rgba(255,255,255,0.04)', bgInput:'rgba(255,255,255,0.04)', bgModal:'#0a1628', bgTopbar:'rgba(6,12,24,0.8)', border:'rgba(255,255,255,0.07)', borderInput:'rgba(255,255,255,0.09)', borderSide:'rgba(255,255,255,0.06)', textPrimary:'#f1f5f9', textSecondary:'#94a3b8', textMuted:'#64748b', textFaint:'#475569', textDim:'#334155', accent:'#4fd1c5', accentAmber:'#f59e0b', accentGreen:'#10b981', accentRed:'#ef4444', selectBg:'#0d1f35', scrollThumb:'rgba(79,209,197,0.2)' };
  const [activeTab,     setActiveTab]     = useState("dashboard");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [loading,       setLoading]       = useState(true);
  const [notification,  setNotification]  = useState(null);

  // Data from backend
  const [dashData,    setDashData]    = useState(null);
  const [tasks,       setTasks]       = useState([]);
  const [attendance,  setAttendance]  = useState([]);
  const [attSummary,  setAttSummary]  = useState({});
  const [profile,     setProfile]     = useState(null);
  const [taskFilter,  setTaskFilter]  = useState("All");

  // Attendance actions
  const [checkedIn,   setCheckedIn]   = useState(false);
  const [checkedOut,  setCheckedOut]  = useState(false);
  const [attLoading,  setAttLoading]  = useState(false);

  const notify = (msg, color="#10b981") => { setNotification({msg,color}); setTimeout(()=>setNotification(null),3000); };

  // ── Load all data ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [dashRes, taskRes, attRes, meRes] = await Promise.all([
        dashboardAPI.employeeStats(),
        taskAPI.getAll({ limit:100 }),
        attendanceAPI.getMy(now.getMonth()+1, now.getFullYear()),
        authAPI.getMe(),
      ]);
      setDashData(dashRes);
      setTasks(taskRes.tasks||[]);
      setAttendance(attRes.records||[]);
      setAttSummary(attRes.summary||{});
      setProfile(meRes.user);

      // Check today's attendance
      const todayStr = now.toISOString().split("T")[0];
      const todayRec = (attRes.records||[]).find(r => r.date?.split("T")[0]===todayStr);
      if (todayRec) { setCheckedIn(!!todayRec.checkIn); setCheckedOut(!!todayRec.checkOut); }
    } catch (err) { notify("Failed to load: "+err.message,"#ef4444"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Task status update ──
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus, progress: newStatus==="Completed"?100:newStatus==="Pending"?0:undefined });
      setTasks(prev => prev.map(t => t._id===taskId ? { ...t, status:newStatus, progress:newStatus==="Completed"?100:newStatus==="Pending"?0:t.progress } : t));
      notify(`✓ Task marked as ${newStatus}`);
    } catch (err) { notify(err.message,"#ef4444"); }
  };

  // ── Check in / out ──
  const handleCheckIn = async () => {
    setAttLoading(true);
    try { await attendanceAPI.checkIn(); setCheckedIn(true); notify("✓ Checked in successfully"); fetchAll(); }
    catch (err) { notify(err.message,"#ef4444"); }
    setAttLoading(false);
  };
  const handleCheckOut = async () => {
    setAttLoading(true);
    try { await attendanceAPI.checkOut(); setCheckedOut(true); notify("✓ Checked out successfully"); fetchAll(); }
    catch (err) { notify(err.message,"#ef4444"); }
    setAttLoading(false);
  };

  const stats    = dashData?.stats || {};
  const emp      = profile || currentUser || {};
  const filteredTasks = taskFilter==="All" ? tasks : tasks.filter(t=>t.status===taskFilter);

  // Today's attendance record
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAtt = attendance.find(r => r.date?.split("T")[0]===todayStr);

  const DEPT_COLOR = { Engineering:"#38bdf8", Marketing:"#a78bfa", HR:"#f472b6", Finance:"#10b981", Operations:"#fb923c" };
  const empColor = DEPT_COLOR[emp.department]||"#4fd1c5";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%;font-family:'Syne',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(79,209,197,0.2);border-radius:2px}
        .nav-item{transition:all 0.18s;cursor:pointer;border-radius:10px}.nav-item:hover{background:rgba(128,128,128,0.08)!important}
        .nav-item.active{background:rgba(79,209,197,0.1)!important}
        .task-card{transition:all 0.2s}.task-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.3)}
        select option{background:#0d1f35}
      `}</style>

      <div style={{ display:"flex",height:"100vh",background:t.bg,overflow:"hidden" }}>
        {/* Sidebar */}
        <div style={{ width:sidebarOpen?"220px":"64px",flexShrink:0,background:t.bgSidebar,borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",transition:"width 0.3s ease",overflow:"hidden" }}>
          <div style={{ padding:"20px 16px",borderBottom:`1px solid ${t.borderSide}`,display:"flex",alignItems:"center",gap:"10px",flexShrink:0 }}>
            <div style={{ width:"32px",height:"32px",borderRadius:"9px",background:"linear-gradient(135deg,#4fd1c5,#38bdf8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 18L9 12L13 16L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {sidebarOpen&&<div style={{ fontSize:"15px",fontWeight:"800",color:t.textPrimary,whiteSpace:"nowrap" }}>PerformOS</div>}
          </div>
          {sidebarOpen&&(
            <div style={{ margin:"12px 12px 0",padding:"10px 12px",background:"rgba(79,209,197,0.08)",border:"1px solid rgba(79,209,197,0.2)",borderRadius:"10px" }}>
              <div style={{ fontSize:"9px",color:"#4fd1c5",fontFamily:"monospace",letterSpacing:"0.1em" }}>◆ EMPLOYEE</div>
              <div style={{ fontSize:"13px",fontWeight:"700",color:t.textPrimary,marginTop:"2px" }}>{emp.name||"Employee"}</div>
              <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",marginTop:"1px" }}>{emp.designation||emp.role}</div>
            </div>
          )}
          <nav style={{ flex:1,padding:"12px 10px",overflowY:"auto" }}>
            {NAV.map(item=>(
              <div key={item.id} className={`nav-item ${activeTab===item.id?"active":""}`} onClick={()=>setActiveTab(item.id)}
                style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px",marginBottom:"2px",color:activeTab===item.id?"#4fd1c5":"#64748b" }}>
                <span style={{ flexShrink:0 }}>{item.icon}</span>
                {sidebarOpen&&<span style={{ fontSize:"13px",fontWeight:activeTab===item.id?"700":"500",whiteSpace:"nowrap" }}>{item.label}</span>}
                {sidebarOpen&&activeTab===item.id&&<div style={{ marginLeft:"auto",width:"4px",height:"4px",borderRadius:"50%",background:"#4fd1c5" }}/>}
              </div>
            ))}
          </nav>
          <div style={{ padding:"4px 10px" }}>
            {/* Theme toggle */}
            <div className="nav-item" onClick={toggleTheme}
              style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px",marginBottom:"2px",
                color: t.name==="dark" ? "#f59e0b" : "#7c3aed",
                background: t.name==="dark" ? "rgba(245,158,11,0.08)" : "rgba(124,58,237,0.08)",
                border: `1px solid ${t.name==="dark" ? "rgba(245,158,11,0.2)" : "rgba(124,58,237,0.2)"}`,
                borderRadius:"10px", cursor:"pointer" }}>
              {t.name==="dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
              {sidebarOpen && <span style={{ fontSize:"13px",fontWeight:"700",fontFamily:"monospace",whiteSpace:"nowrap" }}>
                {t.name==="dark" ? "Light Mode" : "Dark Mode"}
              </span>}
            </div>
            <div className="nav-item" onClick={()=>onLogout&&onLogout()} style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px",color:"#ef4444" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {sidebarOpen&&<span style={{ fontSize:"13px",fontWeight:"600" }}>Log Out</span>}
            </div>
          </div>
          <div style={{ padding:"12px 10px",borderTop:`1px solid ${t.borderSide}` }}>
            <div className="nav-item" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px",color:t.textFaint }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {sidebarOpen?<><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></>:<><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>}
              </svg>
              {sidebarOpen&&<span style={{ fontSize:"12px",fontFamily:"monospace" }}>Collapse</span>}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          {/* Topbar */}
          <div style={{ height:"60px",borderBottom:`1px solid ${t.borderSide}`,display:"flex",alignItems:"center",padding:"0 24px",gap:"16px",flexShrink:0,background:t.bgTopbar,backdropFilter:"blur(12px)" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"17px",fontWeight:"800",color:t.textPrimary }}>Welcome back, <span style={{ color:"#4fd1c5" }}>{(emp.name||"").split(" ")[0]} 👋</span></div>
              <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace" }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
            <div style={{ display:"flex",gap:"8px" }}>
              {stats.pendingTasks>0&&<div style={{ padding:"5px 12px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:"8px",fontSize:"11px",color:"#f59e0b",fontFamily:"monospace" }}>{stats.pendingTasks} pending</div>}
              {stats.inProgressTasks>0&&<div style={{ padding:"5px 12px",background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.25)",borderRadius:"8px",fontSize:"11px",color:"#38bdf8",fontFamily:"monospace" }}>{stats.inProgressTasks} in progress</div>}
            </div>
            {/* Check in / out buttons */}
            {!checkedIn&&!checkedOut&&(
              <button onClick={handleCheckIn} disabled={attLoading} style={{ padding:"7px 14px",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:"9px",color:"#10b981",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>
                {attLoading?"...":"⏱ Check In"}
              </button>
            )}
            {checkedIn&&!checkedOut&&(
              <button onClick={handleCheckOut} disabled={attLoading} style={{ padding:"7px 14px",background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:"9px",color:"#f59e0b",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>
                {attLoading?"...":"⏹ Check Out"}
              </button>
            )}
            {checkedIn&&checkedOut&&(
              <div style={{ padding:"7px 14px",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"9px",fontSize:"11px",color:"#10b981",fontFamily:"monospace" }}>✓ Done for today</div>
            )}
            <button onClick={fetchAll} title="Refresh" style={{ padding:"8px",background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textMuted,cursor:"pointer",display:"flex",alignItems:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
            <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",background:"rgba(79,209,197,0.08)",border:"1px solid rgba(79,209,197,0.2)",borderRadius:"10px" }}>
              <div style={{ width:"26px",height:"26px",borderRadius:"7px",background:"linear-gradient(135deg,#4fd1c5,#38bdf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:"#0a1628" }}>{(emp.avatar||emp.name||"E")[0]}</div>
              <span style={{ fontSize:"12px",fontWeight:"700",color:"#4fd1c5" }}>{(emp.name||"").split(" ")[0]}</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1,overflowY:"auto",padding:"24px" }}>
            {loading ? <Spinner/> : (
              <>
                {/* ── DASHBOARD ── */}
                {activeTab==="dashboard"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"flex",gap:"16px",marginBottom:"24px" }}>
                      {[
                        { label:"TOTAL TASKS", value:stats.totalTasks||0, color:"#a78bfa", sub:"assigned to you", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
                        { label:"COMPLETED", value:stats.completedTasks||0, color:"#10b981", sub:`${stats.totalTasks?Math.round((stats.completedTasks/stats.totalTasks)*100):0}% rate`, icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
                        { label:"IN PROGRESS", value:stats.inProgressTasks||0, color:"#38bdf8", sub:"currently active", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                        { label:"DAYS PRESENT", value:stats.presentDays||0, color:"#4fd1c5", sub:"this month", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                      ].map((s,i)=>(
                        <div key={i} style={{ flex:1,background:t.bgCard,border:`1px solid ${s.color}25`,borderRadius:"16px",padding:"18px 20px",position:"relative",overflow:"hidden",animation:`fadeUp 0.4s ${i*0.07}s both` }}>
                          <div style={{ position:"absolute",top:"-16px",right:"-16px",width:"70px",height:"70px",background:s.color+"10",borderRadius:"50%" }}/>
                          <div style={{ color:s.color,marginBottom:"10px" }}>{s.icon}</div>
                          <div style={{ fontSize:"30px",fontWeight:"800",color:t.textPrimary,lineHeight:1 }}>{s.value}</div>
                          <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",letterSpacing:"0.1em",marginTop:"4px" }}>{s.label}</div>
                          <div style={{ fontSize:"10px",color:s.color,marginTop:"4px",fontFamily:"monospace" }}>{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:"20px" }}>
                      {/* Recent tasks */}
                      <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
                          <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary }}>My Tasks</div>
                          <button onClick={()=>setActiveTab("tasks")} style={{ fontSize:"11px",color:"#4fd1c5",background:"none",border:"none",cursor:"pointer",fontFamily:"monospace" }}>View all →</button>
                        </div>
                        {(dashData?.recentTasks||[]).map((task,i)=>(
                          <div key={task._id} style={{ padding:"12px",background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"12px",marginBottom:"8px",animation:`fadeUp 0.4s ${0.1+i*0.07}s both` }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px" }}>
                              <div style={{ fontSize:"13px",fontWeight:"600",color:t.textPrimary,flex:1,marginRight:"8px" }}>{task.title}</div>
                              <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                            </div>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px" }}>
                              <span style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace" }}>Due: {task.deadline?new Date(task.deadline).toLocaleDateString("en-IN"):"-"}</span>
                              <Badge color={STATUS_COLORS_TASK[task.status]}>{task.status}</Badge>
                            </div>
                            <div style={{ height:"4px",background:"rgba(255,255,255,0.05)",borderRadius:"2px",overflow:"hidden" }}>
                              <div style={{ height:"100%",width:`${task.progress||0}%`,background:task.status==="Completed"?"#10b981":"linear-gradient(90deg,#38bdf8,#4fd1c5)",borderRadius:"2px",transition:"width 1s" }}/>
                            </div>
                          </div>
                        ))}
                        {!(dashData?.recentTasks?.length)&&<div style={{ textAlign:"center",color:t.textFaint,fontFamily:"monospace",fontSize:"12px",padding:"20px" }}>No tasks yet</div>}
                      </div>

                      {/* Performance + today attendance */}
                      <div style={{ display:"flex",flexDirection:"column",gap:"16px" }}>
                        <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                          <div style={{ fontSize:"13px",fontWeight:"700",color:t.textPrimary,marginBottom:"14px" }}>My Performance</div>
                          <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px" }}>
                            <div style={{ position:"relative",width:"80px",height:"80px",flexShrink:0 }}>
                              <ProgressRing value={emp.performance||75} color={empColor}/>
                              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                                <div style={{ fontSize:"16px",fontWeight:"800",color:empColor }}>{emp.performance||75}%</div>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary }}>{emp.name}</div>
                              <div style={{ fontSize:"11px",color:t.textMuted,fontFamily:"monospace",marginBottom:"6px" }}>{emp.designation}</div>
                              <StarRating rating={Math.round((emp.performance||75)/20)} />
                              <div style={{ fontSize:"10px",color:t.textSecondary,fontFamily:"monospace",marginTop:"2px" }}>{((emp.performance||75)/20).toFixed(1)} / 5.0</div>
                            </div>
                          </div>
                        </div>

                        {/* Today's attendance */}
                        <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"16px" }}>
                          <div style={{ fontSize:"13px",fontWeight:"700",color:t.textPrimary,marginBottom:"12px" }}>Today's Attendance</div>
                          {todayAtt ? (
                            <div style={{ display:"flex",gap:"10px" }}>
                              <div style={{ flex:1,padding:"10px",background:"rgba(79,209,197,0.06)",border:"1px solid rgba(79,209,197,0.15)",borderRadius:"10px",textAlign:"center" }}>
                                <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",marginBottom:"4px" }}>CHECK IN</div>
                                <div style={{ fontSize:"16px",fontWeight:"800",color:"#4fd1c5",fontFamily:"monospace" }}>{todayAtt.checkIn||"--"}</div>
                              </div>
                              <div style={{ flex:1,padding:"10px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:"10px",textAlign:"center" }}>
                                <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",marginBottom:"4px" }}>CHECK OUT</div>
                                <div style={{ fontSize:"16px",fontWeight:"800",color:"#f59e0b",fontFamily:"monospace" }}>{todayAtt.checkOut||"--"}</div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign:"center",color:t.textFaint,fontFamily:"monospace",fontSize:"12px",padding:"10px" }}>
                              {checkedIn?"Checked in — remember to check out!":"Not checked in yet"}
                            </div>
                          )}
                          <div style={{ marginTop:"10px",fontSize:"11px",color:t.textMuted,fontFamily:"monospace",textAlign:"center" }}>
                            {attSummary.presentDays||0} days present this month
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── MY TASKS ── */}
                {activeTab==="tasks"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap",alignItems:"center" }}>
                      <div style={{ fontSize:"13px",color:t.textMuted,fontFamily:"monospace" }}>Filter:</div>
                      {["All","Pending","In Progress","Completed"].map(f=>(
                        <button key={f} onClick={()=>setTaskFilter(f)} style={{ padding:"7px 16px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"'Syne',sans-serif",border:"1px solid",
                          background:taskFilter===f?( f==="Completed"?"rgba(16,185,129,0.15)":f==="In Progress"?"rgba(56,189,248,0.15)":f==="Pending"?"rgba(245,158,11,0.15)":"rgba(79,209,197,0.15)" ):"rgba(255,255,255,0.03)",
                          borderColor:taskFilter===f?( f==="Completed"?"#10b981":f==="In Progress"?"#38bdf8":f==="Pending"?"#f59e0b":"#4fd1c5" )+"60":"rgba(255,255,255,0.08)",
                          color:taskFilter===f?( f==="Completed"?"#10b981":f==="In Progress"?"#38bdf8":f==="Pending"?"#f59e0b":"#4fd1c5" ):"#64748b" }}>
                          {f} ({f==="All"?tasks.length:tasks.filter(t=>t.status===f).length})
                        </button>
                      ))}
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
                      {filteredTasks.map((task,i)=>(
                        <div key={task._id} className="task-card" style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"14px",padding:"20px",animation:`fadeUp 0.3s ${i*0.05}s both` }}>
                          <div style={{ display:"flex",gap:"14px",alignItems:"flex-start" }}>
                            <div style={{ width:"10px",height:"10px",borderRadius:"50%",background:STATUS_COLORS_TASK[task.status],marginTop:"5px",flexShrink:0,boxShadow:`0 0 8px ${STATUS_COLORS_TASK[task.status]}60` }}/>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px",gap:"12px" }}>
                                <div style={{ fontSize:"15px",fontWeight:"700",color:t.textPrimary }}>{task.title}</div>
                                <div style={{ display:"flex",gap:"6px",flexShrink:0 }}>
                                  <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                                  <Badge color={STATUS_COLORS_TASK[task.status]}>{task.status}</Badge>
                                </div>
                              </div>
                              {task.description&&<div style={{ fontSize:"12px",color:t.textMuted,fontFamily:"monospace",marginBottom:"12px",lineHeight:1.5 }}>{task.description}</div>}
                              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px" }}>
                                <div style={{ display:"flex",gap:"16px" }}>
                                  <span style={{ fontSize:"11px",color:t.textFaint,fontFamily:"monospace" }}><span style={{ color:t.textMuted }}>ID:</span> {task.taskId}</span>
                                  <span style={{ fontSize:"11px",color:t.textFaint,fontFamily:"monospace" }}><span style={{ color:t.textMuted }}>Due:</span> {task.deadline?new Date(task.deadline).toLocaleDateString("en-IN"):"-"}</span>
                                </div>
                                <select value={task.status} onChange={e=>handleStatusUpdate(task._id,e.target.value)}
                                  style={{ background:t.selectBg,border:`1px solid ${STATUS_COLORS_TASK[task.status]}40`,borderRadius:"8px",color:STATUS_COLORS_TASK[task.status],fontSize:"11px",fontFamily:"monospace",padding:"5px 10px",outline:"none",cursor:"pointer" }}>
                                  <option>Pending</option><option>In Progress</option><option>Completed</option>
                                </select>
                              </div>
                              <div style={{ marginTop:"10px" }}>
                                <div style={{ display:"flex",justifyContent:"space-between",fontSize:"10px",color:t.textFaint,fontFamily:"monospace",marginBottom:"4px" }}>
                                  <span>Progress</span><span style={{ color:task.status==="Completed"?"#10b981":"#64748b" }}>{task.progress||0}%</span>
                                </div>
                                <div style={{ height:"5px",background:"rgba(255,255,255,0.05)",borderRadius:"3px",overflow:"hidden" }}>
                                  <div style={{ height:"100%",width:`${task.progress||0}%`,background:task.status==="Completed"?"linear-gradient(90deg,#10b981,#34d399)":task.status==="In Progress"?"linear-gradient(90deg,#38bdf8,#4fd1c5)":"rgba(255,255,255,0.1)",borderRadius:"3px",transition:"width 0.8s ease-out" }}/>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredTasks.length===0&&<div style={{ padding:"60px",textAlign:"center",color:t.textFaint,fontFamily:"monospace" }}>No tasks found.</div>}
                    </div>
                  </div>
                )}

                {/* ── PERFORMANCE ── */}
                {activeTab==="performance"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px" }}>
                      <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"28px",display:"flex",alignItems:"center",gap:"24px" }}>
                        <div style={{ position:"relative",width:"110px",height:"110px",flexShrink:0 }}>
                          <ProgressRing value={emp.performance||75} size={110} stroke={9} color={empColor}/>
                          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                            <div style={{ fontSize:"24px",fontWeight:"800",color:empColor }}>{emp.performance||75}%</div>
                            <div style={{ fontSize:"9px",color:t.textMuted,fontFamily:"monospace" }}>OVERALL</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:"18px",fontWeight:"800",color:t.textPrimary,marginBottom:"4px" }}>{emp.name}</div>
                          <div style={{ fontSize:"12px",color:t.textMuted,fontFamily:"monospace",marginBottom:"10px" }}>{emp.designation} · {emp.department}</div>
                          <StarRating rating={Math.round((emp.performance||75)/20)}/>
                          <div style={{ fontSize:"13px",color:t.textSecondary,fontFamily:"monospace",marginTop:"4px" }}>{((emp.performance||75)/20).toFixed(1)} / 5.0 rating</div>
                          {emp.manager&&<div style={{ fontSize:"11px",color:t.textFaint,marginTop:"6px",fontFamily:"monospace" }}>Manager: {emp.manager.name}</div>}
                        </div>
                      </div>
                      <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                        <div style={{ fontSize:"13px",fontWeight:"700",color:t.textPrimary,marginBottom:"16px" }}>Task Stats</div>
                        {[
                          { label:"Total Assigned", value:stats.totalTasks||0, color:"#a78bfa" },
                          { label:"Completed", value:stats.completedTasks||0, color:"#10b981" },
                          { label:"In Progress", value:stats.inProgressTasks||0, color:"#38bdf8" },
                          { label:"Pending", value:stats.pendingTasks||0, color:"#f59e0b" },
                        ].map(s=>(
                          <div key={s.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${t.border}` }}>
                            <span style={{ fontSize:"12px",color:t.textSecondary,fontFamily:"monospace" }}>{s.label}</span>
                            <span style={{ fontSize:"16px",fontWeight:"800",color:s.color,fontFamily:"monospace" }}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                      <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary,marginBottom:"14px" }}>Completed Tasks</div>
                      {tasks.filter(t=>t.status==="Completed").map((task,i)=>(
                        <div key={task._id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:"10px",marginBottom:"8px",animation:`fadeUp 0.3s ${i*0.08}s both` }}>
                          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
                            <div style={{ width:"20px",height:"20px",borderRadius:"50%",background:"rgba(16,185,129,0.2)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize:"13px",fontWeight:"600",color:t.textPrimary }}>{task.title}</div>
                              <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace" }}>Due: {task.deadline?new Date(task.deadline).toLocaleDateString("en-IN"):"-"}</div>
                            </div>
                          </div>
                          <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                        </div>
                      ))}
                      {tasks.filter(t=>t.status==="Completed").length===0&&<div style={{ textAlign:"center",color:t.textFaint,fontFamily:"monospace",fontSize:"12px",padding:"20px" }}>No completed tasks yet</div>}
                    </div>
                  </div>
                )}

                {/* ── ATTENDANCE ── */}
                {activeTab==="attendance"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"flex",gap:"16px",marginBottom:"20px" }}>
                      {[
                        { label:"PRESENT DAYS", value:attSummary.presentDays||0, color:"#10b981" },
                        { label:"LEAVE DAYS", value:attSummary.leaveDays||0, color:"#f59e0b" },
                        { label:"TOTAL HOURS", value:`${attSummary.totalHours||0}h`, color:"#4fd1c5" },
                        { label:"THIS MONTH", value:new Date().toLocaleString("en-IN",{month:"short",year:"numeric"}), color:"#a78bfa" },
                      ].map((s,i)=>(
                        <div key={i} style={{ flex:1,background:t.bgCard,border:`1px solid ${s.color}25`,borderRadius:"14px",padding:"18px",animation:`fadeUp 0.4s ${i*0.07}s both` }}>
                          <div style={{ fontSize:"26px",fontWeight:"800",color:s.color,fontFamily:"monospace" }}>{s.value}</div>
                          <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",letterSpacing:"0.1em",marginTop:"4px" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Check in/out big card */}
                    <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px",marginBottom:"20px" }}>
                      <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary,marginBottom:"14px" }}>Today — {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
                      <div style={{ display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap" }}>
                        <div style={{ flex:1,padding:"14px",background:"rgba(79,209,197,0.06)",border:"1px solid rgba(79,209,197,0.15)",borderRadius:"12px",textAlign:"center" }}>
                          <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",marginBottom:"6px" }}>CHECK IN</div>
                          <div style={{ fontSize:"20px",fontWeight:"800",color:"#4fd1c5",fontFamily:"monospace" }}>{todayAtt?.checkIn||"--:--"}</div>
                        </div>
                        <div style={{ flex:1,padding:"14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:"12px",textAlign:"center" }}>
                          <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",marginBottom:"6px" }}>CHECK OUT</div>
                          <div style={{ fontSize:"20px",fontWeight:"800",color:"#f59e0b",fontFamily:"monospace" }}>{todayAtt?.checkOut||"--:--"}</div>
                        </div>
                        <div style={{ flex:1,padding:"14px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:"12px",textAlign:"center" }}>
                          <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",marginBottom:"6px" }}>HOURS</div>
                          <div style={{ fontSize:"20px",fontWeight:"800",color:"#10b981",fontFamily:"monospace" }}>{todayAtt?.hoursWorked||"0"}h</div>
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                          {!checkedIn&&<button onClick={handleCheckIn} disabled={attLoading} style={{ padding:"10px 20px",background:"linear-gradient(135deg,#10b981,#34d399)",border:"none",borderRadius:"10px",color:"#0a1628",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>{attLoading?"...":"⏱ Check In"}</button>}
                          {checkedIn&&!checkedOut&&<button onClick={handleCheckOut} disabled={attLoading} style={{ padding:"10px 20px",background:"linear-gradient(135deg,#f59e0b,#fb923c)",border:"none",borderRadius:"10px",color:"#0a1628",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>{attLoading?"...":"⏹ Check Out"}</button>}
                          {checkedIn&&checkedOut&&<div style={{ padding:"10px 20px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"10px",fontSize:"12px",color:"#10b981",fontFamily:"monospace",textAlign:"center" }}>✓ Complete</div>}
                        </div>
                      </div>
                    </div>

                    {/* Monthly records */}
                    <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",overflow:"hidden" }}>
                      <div style={{ padding:"16px 20px",borderBottom:`1px solid ${t.borderSide}`,fontSize:"14px",fontWeight:"700",color:t.textPrimary }}>Monthly Records</div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",padding:"10px 20px",borderBottom:`1px solid ${t.border}` }}>
                        {["Date","Check In","Check Out","Hours","Status"].map(h=><div key={h} style={{ fontSize:"10px",fontWeight:"700",color:t.textFaint,fontFamily:"monospace",letterSpacing:"0.08em" }}>{h}</div>)}
                      </div>
                      {attendance.length===0&&<div style={{ padding:"32px",textAlign:"center",color:t.textFaint,fontFamily:"monospace",fontSize:"12px" }}>No attendance records this month.</div>}
                      {attendance.map((a,i)=>(
                        <div key={a._id} style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",padding:"12px 20px",borderBottom:`1px solid ${t.border}`,alignItems:"center",animation:`fadeUp 0.3s ${i*0.03}s both` }}>
                          <div style={{ fontSize:"12px",fontWeight:"600",color:t.textPrimary }}>{new Date(a.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                          <div style={{ fontSize:"12px",color:a.checkIn?"#4fd1c5":"#334155",fontFamily:"monospace" }}>{a.checkIn||"--"}</div>
                          <div style={{ fontSize:"12px",color:a.checkOut?"#94a3b8":"#334155",fontFamily:"monospace" }}>{a.checkOut||"--"}</div>
                          <div style={{ fontSize:"12px",color:a.hoursWorked>0?"#e2e8f0":"#334155",fontFamily:"monospace" }}>{a.hoursWorked>0?`${a.hoursWorked}h`:"--"}</div>
                          <Badge color={a.status==="Present"?"#10b981":a.status==="Leave"?"#f59e0b":"#334155"}>{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PROFILE ── */}
                {activeTab==="profile"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out",maxWidth:"680px" }}>
                    <div style={{ background:t.bgCard,border:`1px solid ${empColor}20`,borderRadius:"18px",padding:"28px",marginBottom:"16px",display:"flex",gap:"24px",alignItems:"center" }}>
                      <div style={{ width:"80px",height:"80px",borderRadius:"20px",background:`linear-gradient(135deg,${empColor},${empColor}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",fontWeight:"800",color:"#0a1628",flexShrink:0 }}>
                        {emp.avatar||emp.name?.[0]||"E"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:t.textPrimary }}>{emp.name}</div>
                        <div style={{ fontSize:"13px",color:t.textMuted,fontFamily:"monospace",marginTop:"2px" }}>{emp.employeeId} · {emp.designation}</div>
                        <div style={{ display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap" }}>
                          <Badge color={empColor}>{emp.department}</Badge>
                          <Badge color="#10b981">{emp.status||"Active"}</Badge>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"28px",fontWeight:"800",color:empColor }}>{emp.performance||75}%</div>
                        <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace" }}>Performance</div>
                        <div style={{ marginTop:"6px" }}><StarRating rating={Math.round((emp.performance||75)/20)}/></div>
                      </div>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px" }}>
                      {[
                        { label:"Employee ID", value:emp.employeeId||"-" },
                        { label:"Email", value:emp.email||"-" },
                        { label:"Department", value:emp.department||"-" },
                        { label:"Designation", value:emp.designation||"-" },
                        { label:"Manager", value:emp.manager?.name||"-" },
                        { label:"Joined", value:emp.joinedDate?new Date(emp.joinedDate).toLocaleDateString("en-IN"):"-" },
                      ].map(f=>(
                        <div key={f.label} style={{ padding:"14px 16px",background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"12px" }}>
                          <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace",letterSpacing:"0.1em",marginBottom:"5px" }}>{f.label.toUpperCase()}</div>
                          <div style={{ fontSize:"13px",fontWeight:"600",color:t.textPrimary }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                      <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary,marginBottom:"14px" }}>Task Summary</div>
                      <div style={{ display:"flex",gap:"12px",flexWrap:"wrap" }}>
                        {[{label:"Total",value:stats.totalTasks||0,color:"#a78bfa"},{label:"Completed",value:stats.completedTasks||0,color:"#10b981"},{label:"In Progress",value:stats.inProgressTasks||0,color:"#38bdf8"},{label:"Pending",value:stats.pendingTasks||0,color:"#f59e0b"}].map(s=>(
                          <div key={s.label} style={{ flex:1,minWidth:"80px",padding:"12px",background:`${s.color}10`,border:`1px solid ${s.color}25`,borderRadius:"10px",textAlign:"center" }}>
                            <div style={{ fontSize:"22px",fontWeight:"800",color:s.color,fontFamily:"monospace" }}>{s.value}</div>
                            <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",marginTop:"2px" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {notification&&(
        <div style={{ position:"fixed",bottom:"24px",right:"24px",zIndex:2000,padding:"12px 20px",background:t.bgModal,border:`1px solid ${notification.color}40`,borderRadius:"12px",color:notification.color,fontSize:"13px",fontWeight:"600",fontFamily:"'Syne',sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"toastIn 0.3s ease-out" }}>
          {notification.msg}
        </div>
      )}
    </>
  );
}