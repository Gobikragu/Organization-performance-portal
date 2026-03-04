import { useState, useEffect, useCallback } from "react";
import { employeeAPI, taskAPI, dashboardAPI } from "./api";
import ThemeToggle from "./ThemeToggle";

const PRIORITY_COLORS = { Low:"#22d3ee", Medium:"#a78bfa", High:"#f59e0b", Critical:"#ef4444" };
const STATUS_COLORS   = { Active:"#10b981", Inactive:"#64748b", "On Leave":"#f59e0b" };
const TASK_STATUS_COLORS = { Pending:"#f59e0b", "In Progress":"#38bdf8", Completed:"#10b981", Cancelled:"#64748b" };
const DEPT_COLORS = { Engineering:"#38bdf8", Marketing:"#a78bfa", HR:"#f472b6", Finance:"#10b981", Operations:"#fb923c" };
const DEPTS    = ["All","Engineering","Marketing","HR","Finance","Operations"];
const STATUSES = ["All","Active","Inactive","On Leave"];
const PRIORITIES    = ["Low","Medium","High","Critical"];
const TASK_STATUSES = ["Pending","In Progress","Completed"];

const Badge = ({ color, children }) => (
  <span style={{ fontSize:"10px",fontWeight:"700",color,background:color+"20",border:`1px solid ${color}40`,borderRadius:"5px",padding:"2px 8px",fontFamily:"monospace",letterSpacing:"0.05em",whiteSpace:"nowrap" }}>{children}</span>
);
const Avatar = ({ initials, color="#4fd1c5", size=36 }) => (
  <div style={{ width:size,height:size,borderRadius:"10px",background:color+"22",border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.32,fontWeight:"700",color,flexShrink:0,fontFamily:"'Syne',sans-serif" }}>{initials}</div>
);
const Input = ({ value, onChange, placeholder, type="text", style={} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textPrimary,fontSize:"12px",fontFamily:"monospace",padding:"9px 12px",outline:"none",width:"100%",...style }}/>
);
const Select = ({ value, onChange, children, style={} }) => (
  <select value={value} onChange={onChange} style={{ background:t.selectBg,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textPrimary,fontSize:"12px",fontFamily:"monospace",padding:"9px 12px",outline:"none",cursor:"pointer",width:"100%",...style }}>{children}</select>
);
const Modal = ({ title, children, onClose, accentColor="#4fd1c5" }) => (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{ background:t.bgModal,border:`1px solid ${accentColor}30`,borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"500px",maxHeight:"90vh",overflowY:"auto",animation:"fadeUp 0.2s ease-out",boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px" }}>
        <div style={{ fontSize:"18px",fontWeight:"800",color:t.textPrimary,fontFamily:"'Syne',sans-serif" }}>{title}</div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"none",borderRadius:"8px",width:"30px",height:"30px",cursor:"pointer",color:t.textSecondary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);
const Spinner = () => <div style={{ width:"18px",height:"18px",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:"#4fd1c5",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"40px auto" }}/>;

const NAV = [
  { id:"dashboard", label:"Dashboard", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id:"employees", label:"Employees", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id:"tasks",     label:"Assign Tasks", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id:"performance", label:"Performance", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id:"reports",   label:"Reports", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
];

export default function AdminDashboard({ onLogout, currentUser, theme, toggleTheme }) {
  const t = theme || { name:'dark', bg:'#060e1a', bgSidebar:'rgba(8,16,32,0.95)', bgCard:'rgba(255,255,255,0.02)', bgCardHover:'rgba(255,255,255,0.04)', bgInput:'rgba(255,255,255,0.04)', bgModal:'#0a1628', bgTopbar:'rgba(8,16,32,0.8)', border:'rgba(255,255,255,0.07)', borderInput:'rgba(255,255,255,0.09)', borderSide:'rgba(255,255,255,0.06)', textPrimary:'#f1f5f9', textSecondary:'#94a3b8', textMuted:'#64748b', textFaint:'#475569', textDim:'#334155', accent:'#4fd1c5', accentAmber:'#f59e0b', accentGreen:'#10b981', accentRed:'#ef4444', selectBg:'#0d1f35', scrollThumb:'rgba(79,209,197,0.2)' };
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [employees, setEmployees]       = useState([]);
  const [tasks, setTasks]               = useState([]);
  const [dashStats, setDashStats]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [notification, setNotification] = useState(null);

  // filters
  const [searchText,    setSearchText]    = useState("");
  const [filterDept,    setFilterDept]    = useState("All");
  const [filterStatus,  setFilterStatus]  = useState("All");
  const [taskFilter,    setTaskFilter]    = useState("All");

  // modals
  const [showAddEmployee,    setShowAddEmployee]    = useState(false);
  const [showAssignTask,     setShowAssignTask]     = useState(false);
  const [showEditEmployee,   setShowEditEmployee]   = useState(null);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(null);

  // forms
  const [newEmp,  setNewEmp]  = useState({ name:"", email:"", password:"", department:"Engineering", designation:"", status:"Active" });
  const [showNewEmpPass, setShowNewEmpPass] = useState(false);
  const [newTask, setNewTask] = useState({ title:"", description:"", assignedTo:"", priority:"Medium", deadline:"", department:"Engineering" });
  const [saving, setSaving]   = useState(false);

  const notify = (msg, color="#10b981") => { setNotification({ msg, color }); setTimeout(() => setNotification(null), 3000); };

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, taskRes, dashRes] = await Promise.all([
        employeeAPI.getAll({ limit: 100 }),
        taskAPI.getAll({ limit: 100 }),
        dashboardAPI.adminStats(),
      ]);
      setEmployees(empRes.employees || []);
      setTasks(taskRes.tasks || []);
      setDashStats(dashRes);
    } catch (err) { notify("Failed to load data: " + err.message, "#ef4444"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered employees ──
  const filteredEmployees = employees.filter(e => {
    const matchText = !searchText || e.name?.toLowerCase().includes(searchText.toLowerCase()) || e.employeeId?.toLowerCase().includes(searchText.toLowerCase()) || e.designation?.toLowerCase().includes(searchText.toLowerCase());
    const matchDept   = filterDept   === "All" || e.department === filterDept;
    const matchStatus = filterStatus === "All" || e.status     === filterStatus;
    return matchText && matchDept && matchStatus;
  });

  const filteredTasks = taskFilter === "All" ? tasks : tasks.filter(t => t.status === taskFilter);

  // ── Add Employee ──
  const handleAddEmployee = async () => {
    if (!newEmp.name || !newEmp.email || !newEmp.designation) { notify("Fill all required fields", "#ef4444"); return; }
    if (!newEmp.password || newEmp.password.length < 6) { notify("Password must be at least 6 characters", "#ef4444"); return; }
    setSaving(true);
    try {
      await employeeAPI.create(newEmp);
      notify(`✓ ${newEmp.name} added successfully`);
      setNewEmp({ name:"", email:"", password:"", department:"Engineering", designation:"", status:"Active" });
      setShowNewEmpPass(false);
      setShowAddEmployee(false);
      fetchAll();
    } catch (err) { notify(err.message, "#ef4444"); }
    setSaving(false);
  };

  // ── Edit Employee ──
  const handleEditEmployee = async () => {
    if (!showEditEmployee.name) { notify("Name is required", "#ef4444"); return; }
    if (showEditEmployee.newPassword && showEditEmployee.newPassword.length < 6) {
      notify("New password must be at least 6 characters", "#ef4444"); return;
    }
    setSaving(true);
    try {
      const updateData = {
        name: showEditEmployee.name, email: showEditEmployee.email,
        department: showEditEmployee.department, designation: showEditEmployee.designation,
        status: showEditEmployee.status, performance: showEditEmployee.performance,
      };
      if (showEditEmployee.newPassword) updateData.password = showEditEmployee.newPassword;
      await employeeAPI.update(showEditEmployee._id, updateData);
      notify(`✓ ${showEditEmployee.name} updated`);
      setShowEditEmployee(null);
      fetchAll();
    } catch (err) { notify(err.message, "#ef4444"); }
    setSaving(false);
  };

  // ── Delete Employee ──
  const handleDeleteEmployee = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    try {
      await employeeAPI.delete(emp._id);
      notify(`${emp.name} removed`, "#f59e0b");
      fetchAll();
    } catch (err) { notify(err.message, "#ef4444"); }
  };

  // ── Assign Task ──
  const handleAssignTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.deadline) { notify("Fill all required fields", "#ef4444"); return; }
    setSaving(true);
    try {
      await taskAPI.create(newTask);
      const emp = employees.find(e => e._id === newTask.assignedTo);
      notify(`✓ Task assigned to ${emp?.name}`);
      setNewTask({ title:"", description:"", assignedTo:"", priority:"Medium", deadline:"", department:"Engineering" });
      setShowAssignTask(false);
      fetchAll();
    } catch (err) { notify(err.message, "#ef4444"); }
    setSaving(false);
  };

  // ── Update Task Status ──
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) { notify(err.message, "#ef4444"); }
  };

  const stats = dashStats?.stats || {};
  const topPerformers = dashStats?.topPerformers || [];
  const deptDist = dashStats?.deptDistribution || [];
  const recentEmployees = dashStats?.recentEmployees || [];
  const recentTasks = dashStats?.recentTasks || [];

  const FormLabel = ({ children }) => (
    <label style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace",display:"block",marginBottom:"5px",letterSpacing:"0.1em" }}>{children}</label>
  );
  const SaveBtn = ({ onClick, color="linear-gradient(135deg,#4fd1c5,#38bdf8)", label="Save" }) => (
    <button onClick={onClick} disabled={saving} style={{ flex:1,padding:"11px",background:saving?"rgba(255,255,255,0.04)":color,border:"none",borderRadius:"10px",color:saving?"#64748b":"#0a1628",fontSize:"13px",fontWeight:"700",cursor:saving?"not-allowed":"pointer",fontFamily:"'Syne',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px" }}>
      {saving&&<div style={{ width:"13px",height:"13px",border:"2px solid #475569",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>}
      {saving?"Saving...":label}
    </button>
  );
  const CancelBtn = ({ onClick }) => (
    <button onClick={onClick} style={{ flex:1,padding:"11px",background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textMuted,fontSize:"13px",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>Cancel</button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;font-family:'Syne',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:t.scrollThumb;border-radius:2px}
        .nav-item{transition:all 0.18s;cursor:pointer;border-radius:10px}.nav-item:hover{background:rgba(128,128,128,0.08)!important}
        .nav-item.active{background:rgba(79,209,197,0.12)!important}
        .emp-row{transition:background 0.15s;cursor:pointer}.emp-row:hover{background:rgba(128,128,128,0.08)!important}
        .action-btn{transition:all 0.15s;cursor:pointer}.action-btn:hover{opacity:0.8;transform:scale(1.05)}
        .task-card{transition:all 0.2s}.task-card:hover{transform:translateY(-1px);border-color:rgba(79,209,197,0.3)!important}
        select option{background:#0d1f35}input::placeholder{color:#94a3b8}textarea::placeholder{color:#94a3b8}
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
            <div style={{ margin:"12px 12px 0",padding:"10px 12px",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px" }}>
              <div style={{ fontSize:"9px",color:"#f59e0b",fontFamily:"monospace",letterSpacing:"0.1em" }}>◆ ADMINISTRATOR</div>
              <div style={{ fontSize:"12px",fontWeight:"700",color:t.textPrimary,marginTop:"2px" }}>{currentUser?.name || "Admin"}</div>
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
            {/* Theme toggle in sidebar */}
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
              <div style={{ fontSize:"18px",fontWeight:"800",color:t.textPrimary }}>{NAV.find(n=>n.id===activeTab)?.label}</div>
              <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace" }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
            <button onClick={()=>setShowAddEmployee(true)} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"8px 14px",background:"linear-gradient(135deg,#4fd1c5,#38bdf8)",border:"none",borderRadius:"10px",color:"#0a1628",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Employee
            </button>
            <button onClick={()=>setShowAssignTask(true)} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"8px 14px",background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:"10px",color:"#f59e0b",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Assign Task
            </button>
            <button onClick={fetchAll} title="Refresh" style={{ padding:"8px",background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textMuted,cursor:"pointer",display:"flex",alignItems:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
            <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px" }}>
              <div style={{ width:"26px",height:"26px",borderRadius:"7px",background:"linear-gradient(135deg,#f59e0b,#fb923c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:"#0a1628" }}>
                {currentUser?.name?.[0]||"A"}
              </div>
              <span style={{ fontSize:"12px",fontWeight:"700",color:"#f59e0b" }}>Admin</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1,overflowY:"auto",padding:"24px" }}>
            {loading ? <Spinner/> : (
              <>
                {/* ── DASHBOARD ── */}
                {activeTab==="dashboard"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"flex",gap:"16px",marginBottom:"24px",flexWrap:"wrap" }}>
                      {[
                        { label:"TOTAL EMPLOYEES", value:stats.totalEmployees||0, color:"#38bdf8", sub:`${stats.activeEmployees||0} active`, icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
                        { label:"TASKS ASSIGNED", value:stats.totalTasks||0, color:"#a78bfa", sub:`${stats.completedTasks||0} completed`, icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
                        { label:"TASKS PENDING", value:stats.pendingTasks||0, color:"#f59e0b", sub:"needs action", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                        { label:"AVG PERFORMANCE", value:`${stats.avgPerformance||0}%`, color:"#10b981", sub:`${employees.length} employees`, icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                      ].map((s,i)=>(
                        <div key={i} style={{ flex:1,minWidth:"140px",background:t.bgCard,border:`1px solid ${s.color}30`,borderRadius:"16px",padding:"18px 20px",position:"relative",overflow:"hidden",animation:`fadeUp 0.5s ${i*0.05}s both` }}>
                          <div style={{ position:"absolute",top:"-20px",right:"-20px",width:"80px",height:"80px",background:s.color+"10",borderRadius:"50%" }}/>
                          <div style={{ color:s.color,marginBottom:"10px" }}>{s.icon}</div>
                          <div style={{ fontSize:"28px",fontWeight:"800",color:t.textPrimary,fontFamily:"'Syne',sans-serif",lineHeight:1 }}>{s.value}</div>
                          <div style={{ fontSize:"11px",color:t.textSecondary,marginTop:"4px",fontFamily:"monospace" }}>{s.label}</div>
                          <div style={{ fontSize:"10px",color:s.color,marginTop:"6px",fontFamily:"monospace" }}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px" }}>
                      {/* Recent Employees */}
                      <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
                          <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary }}>Recent Employees</div>
                          <button onClick={()=>setActiveTab("employees")} style={{ fontSize:"11px",color:"#4fd1c5",background:"none",border:"none",cursor:"pointer",fontFamily:"monospace" }}>View all →</button>
                        </div>
                        {recentEmployees.map(emp=>(
                          <div key={emp._id} className="emp-row" onClick={()=>setShowEmployeeDetail(emp)} style={{ display:"flex",alignItems:"center",gap:"12px",padding:"10px",borderRadius:"10px",marginBottom:"4px" }}>
                            <Avatar initials={emp.avatar||emp.name?.[0]} color={DEPT_COLORS[emp.department]||"#4fd1c5"}/>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:"13px",fontWeight:"600",color:t.textPrimary }}>{emp.name}</div>
                              <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace" }}>{emp.designation} · {emp.department}</div>
                            </div>
                            <Badge color={STATUS_COLORS[emp.status]}>{emp.status}</Badge>
                          </div>
                        ))}
                      </div>
                      {/* Recent Tasks */}
                      <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
                          <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary }}>Recent Tasks</div>
                          <button onClick={()=>setActiveTab("tasks")} style={{ fontSize:"11px",color:"#4fd1c5",background:"none",border:"none",cursor:"pointer",fontFamily:"monospace" }}>View all →</button>
                        </div>
                        {recentTasks.map(task=>(
                          <div key={task._id} style={{ padding:"10px",borderRadius:"10px",marginBottom:"6px",background:t.bgCard,border:`1px solid ${t.border}` }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px" }}>
                              <div style={{ fontSize:"12px",fontWeight:"600",color:t.textPrimary,flex:1 }}>{task.title}</div>
                              <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                            </div>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"6px" }}>
                              <div style={{ fontSize:"10px",color:t.textMuted,fontFamily:"monospace" }}>{task.assignedTo?.name||"Unassigned"}</div>
                              <Badge color={TASK_STATUS_COLORS[task.status]}>{task.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Dept Distribution */}
                      <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                        <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary,marginBottom:"16px" }}>Department Distribution</div>
                        {deptDist.map(d=>{
                          const pct = Math.round((d.count/(stats.totalEmployees||1))*100);
                          const color = DEPT_COLORS[d._id]||"#64748b";
                          return (
                            <div key={d._id} style={{ marginBottom:"12px" }}>
                              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"11px",color:t.textSecondary,marginBottom:"4px",fontFamily:"monospace" }}>
                                <span>{d._id}</span><span>{d.count} emp · {pct}%</span>
                              </div>
                              <div style={{ height:"6px",background:"rgba(255,255,255,0.05)",borderRadius:"3px",overflow:"hidden" }}>
                                <div style={{ height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:"3px",transition:"width 1s" }}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Leaderboard */}
                      <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px" }}>
                        <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary,marginBottom:"16px" }}>Performance Leaderboard</div>
                        {topPerformers.map((emp,i)=>(
                          <div key={emp._id} style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px" }}>
                            <div style={{ width:"22px",height:"22px",borderRadius:"6px",background:i===0?"rgba(245,158,11,0.2)":i===1?"rgba(148,163,184,0.15)":"rgba(251,146,60,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:i===0?"#f59e0b":i===1?"#94a3b8":"#fb923c",flexShrink:0,fontFamily:"monospace" }}>{i+1}</div>
                            <Avatar initials={emp.avatar||emp.name?.[0]} color={DEPT_COLORS[emp.department]||"#4fd1c5"} size={30}/>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:"12px",fontWeight:"600",color:t.textPrimary }}>{emp.name}</div>
                              <div style={{ height:"4px",background:"rgba(255,255,255,0.05)",borderRadius:"2px",marginTop:"4px",overflow:"hidden" }}>
                                <div style={{ height:"100%",width:`${emp.performance}%`,background:emp.performance>=90?"#10b981":emp.performance>=75?"#38bdf8":"#f59e0b",borderRadius:"2px" }}/>
                              </div>
                            </div>
                            <span style={{ fontSize:"13px",fontWeight:"800",color:emp.performance>=90?"#10b981":emp.performance>=75?"#38bdf8":"#f59e0b",fontFamily:"monospace",flexShrink:0 }}>{emp.performance}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── EMPLOYEES ── */}
                {activeTab==="employees"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"20px",marginBottom:"20px" }}>
                      <div style={{ display:"flex",gap:"12px",flexWrap:"wrap" }}>
                        <div style={{ flex:"2 1 200px",position:"relative" }}>
                          <div style={{ position:"absolute",left:"11px",top:"50%",transform:"translateY(-50%)",color:t.textFaint,pointerEvents:"none" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                          <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Search name, ID, role..."
                            style={{ width:"100%",padding:"9px 12px 9px 34px",background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textPrimary,fontSize:"12px",fontFamily:"monospace",outline:"none" }}/>
                        </div>
                        <Select value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={{ flex:"1 1 130px" }}>{DEPTS.map(d=><option key={d}>{d}</option>)}</Select>
                        <Select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ flex:"1 1 130px" }}>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select>
                        <button onClick={()=>{setSearchText("");setFilterDept("All");setFilterStatus("All");}} style={{ padding:"9px 16px",background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textMuted,fontSize:"12px",cursor:"pointer",fontFamily:"monospace" }}>Reset</button>
                        <button onClick={()=>setShowAddEmployee(true)} style={{ padding:"9px 16px",background:"linear-gradient(135deg,#4fd1c5,#38bdf8)",border:"none",borderRadius:"10px",color:"#0a1628",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>+ Add Employee</button>
                      </div>
                      <div style={{ marginTop:"10px",fontSize:"11px",color:t.textFaint,fontFamily:"monospace" }}>Showing {filteredEmployees.length} of {employees.length} employees</div>
                    </div>
                    <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",overflow:"hidden" }}>
                      <div style={{ display:"grid",gridTemplateColumns:"40px 1fr 1fr 1fr 100px 80px 100px",padding:"12px 20px",borderBottom:`1px solid ${t.borderSide}`,gap:"12px" }}>
                        {["#","Employee","Department","Role","Performance","Status","Actions"].map(h=><div key={h} style={{ fontSize:"10px",fontWeight:"700",color:t.textFaint,fontFamily:"monospace",letterSpacing:"0.08em" }}>{h}</div>)}
                      </div>
                      {filteredEmployees.map((emp,i)=>(
                        <div key={emp._id} className="emp-row" style={{ display:"grid",gridTemplateColumns:"40px 1fr 1fr 1fr 100px 80px 100px",padding:"14px 20px",borderBottom:`1px solid ${t.border}`,gap:"12px",alignItems:"center",animation:`fadeUp 0.3s ${i*0.03}s both` }}>
                          <div style={{ fontSize:"11px",color:t.textFaint,fontFamily:"monospace" }}>{i+1}</div>
                          <div style={{ display:"flex",alignItems:"center",gap:"10px" }} onClick={()=>setShowEmployeeDetail(emp)}>
                            <Avatar initials={emp.avatar||emp.name?.[0]} color={DEPT_COLORS[emp.department]||"#4fd1c5"} size={32}/>
                            <div>
                              <div style={{ fontSize:"13px",fontWeight:"600",color:t.textPrimary }}>{emp.name}</div>
                              <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace" }}>{emp.employeeId}</div>
                            </div>
                          </div>
                          <div><Badge color={DEPT_COLORS[emp.department]||"#64748b"}>{emp.department}</Badge></div>
                          <div style={{ fontSize:"12px",color:t.textSecondary,fontFamily:"monospace" }}>{emp.designation}</div>
                          <div>
                            <div style={{ fontSize:"12px",fontWeight:"700",color:emp.performance>=90?"#10b981":emp.performance>=75?"#38bdf8":"#f59e0b",fontFamily:"monospace",marginBottom:"3px" }}>{emp.performance}%</div>
                            <div style={{ height:"3px",background:"rgba(255,255,255,0.05)",borderRadius:"2px",overflow:"hidden" }}><div style={{ height:"100%",width:`${emp.performance}%`,background:emp.performance>=90?"#10b981":emp.performance>=75?"#38bdf8":"#f59e0b" }}/></div>
                          </div>
                          <div><Badge color={STATUS_COLORS[emp.status]}>{emp.status}</Badge></div>
                          <div style={{ display:"flex",gap:"6px" }}>
                            <button className="action-btn" onClick={()=>setShowEmployeeDetail(emp)} title="View" style={{ width:"28px",height:"28px",borderRadius:"7px",background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.2)",cursor:"pointer",color:"#38bdf8",display:"flex",alignItems:"center",justifyContent:"center" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="action-btn" onClick={()=>setShowEditEmployee({...emp})} title="Edit" style={{ width:"28px",height:"28px",borderRadius:"7px",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",cursor:"pointer",color:"#a78bfa",display:"flex",alignItems:"center",justifyContent:"center" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="action-btn" onClick={()=>handleDeleteEmployee(emp)} title="Delete" style={{ width:"28px",height:"28px",borderRadius:"7px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",cursor:"pointer",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredEmployees.length===0&&<div style={{ padding:"48px",textAlign:"center",color:t.textFaint,fontFamily:"monospace",fontSize:"13px" }}>No employees found.</div>}
                    </div>
                  </div>
                )}

                {/* ── TASKS ── */}
                {activeTab==="tasks"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"10px" }}>
                      <div style={{ display:"flex",gap:"8px",flexWrap:"wrap" }}>
                        {["All","Pending","In Progress","Completed"].map(s=>(
                          <button key={s} onClick={()=>setTaskFilter(s)} style={{ padding:"6px 14px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",cursor:"pointer",background:taskFilter===s?"rgba(79,209,197,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${taskFilter===s?"rgba(79,209,197,0.4)":"rgba(255,255,255,0.08)"}`,color:taskFilter===s?"#4fd1c5":"#64748b",fontFamily:"monospace" }}>
                            {s} ({s==="All"?tasks.length:tasks.filter(t=>t.status===s).length})
                          </button>
                        ))}
                      </div>
                      <button onClick={()=>setShowAssignTask(true)} style={{ padding:"9px 16px",background:"linear-gradient(135deg,#f59e0b,#fb923c)",border:"none",borderRadius:"10px",color:"#0a1628",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>+ Assign New Task</button>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"16px" }}>
                      {filteredTasks.map((task,i)=>(
                        <div key={task._id} className="task-card" style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"14px",padding:"18px",animation:`fadeUp 0.3s ${i*0.04}s both` }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px" }}>
                            <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary,flex:1,marginRight:"8px" }}>{task.title}</div>
                            <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                          </div>
                          {task.description&&<div style={{ fontSize:"12px",color:t.textMuted,fontFamily:"monospace",marginBottom:"12px",lineHeight:1.5 }}>{task.description}</div>}
                          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px" }}>
                            <Avatar initials={task.assignedTo?.avatar||task.assignedTo?.name?.[0]} color={DEPT_COLORS[task.assignedTo?.department]||"#4fd1c5"} size={26}/>
                            <div>
                              <div style={{ fontSize:"11px",fontWeight:"600",color:t.textSecondary }}>{task.assignedTo?.name||"Unassigned"}</div>
                              <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace" }}>Due: {task.deadline?new Date(task.deadline).toLocaleDateString("en-IN"):"-"}</div>
                            </div>
                            <Badge color={DEPT_COLORS[task.department]||"#64748b"}>{task.department}</Badge>
                          </div>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                            <Select value={task.status} onChange={e=>handleUpdateTaskStatus(task._id,e.target.value)} style={{ width:"140px",padding:"6px 10px",fontSize:"11px",color:TASK_STATUS_COLORS[task.status],border:`1px solid ${TASK_STATUS_COLORS[task.status]}40` }}>
                              {TASK_STATUSES.map(s=><option key={s}>{s}</option>)}
                            </Select>
                            <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace" }}>{task.taskId}</div>
                          </div>
                        </div>
                      ))}
                      {filteredTasks.length===0&&<div style={{ padding:"40px",textAlign:"center",color:t.textFaint,fontFamily:"monospace",gridColumn:"1/-1" }}>No tasks found.</div>}
                    </div>
                  </div>
                )}

                {/* ── PERFORMANCE ── */}
                {activeTab==="performance"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px" }}>
                      {employees.map((emp,i)=>(
                        <div key={emp._id} style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"14px",padding:"18px",animation:`fadeUp 0.3s ${i*0.04}s both`,display:"flex",gap:"16px",alignItems:"center" }}>
                          <Avatar initials={emp.avatar||emp.name?.[0]} color={DEPT_COLORS[emp.department]||"#4fd1c5"} size={44}/>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px" }}>
                              <div>
                                <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary }}>{emp.name}</div>
                                <div style={{ fontSize:"11px",color:t.textMuted,fontFamily:"monospace" }}>{emp.designation} · {emp.department}</div>
                              </div>
                              <div style={{ fontSize:"22px",fontWeight:"800",color:emp.performance>=90?"#10b981":emp.performance>=75?"#38bdf8":"#f59e0b",fontFamily:"monospace" }}>{emp.performance}%</div>
                            </div>
                            <div style={{ height:"6px",background:"rgba(255,255,255,0.05)",borderRadius:"3px",overflow:"hidden",marginBottom:"8px" }}>
                              <div style={{ height:"100%",width:`${emp.performance}%`,background:emp.performance>=90?"linear-gradient(90deg,#10b981,#34d399)":emp.performance>=75?"linear-gradient(90deg,#38bdf8,#7dd3fc)":"linear-gradient(90deg,#f59e0b,#fcd34d)",borderRadius:"3px" }}/>
                            </div>
                            <div style={{ display:"flex",gap:"8px",flexWrap:"wrap" }}>
                              <Badge color={STATUS_COLORS[emp.status]}>{emp.status}</Badge>
                              <button onClick={()=>setShowEditEmployee({...emp})} style={{ fontSize:"10px",color:"#a78bfa",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:"5px",padding:"2px 8px",cursor:"pointer",fontFamily:"monospace" }}>Edit Score</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── REPORTS ── */}
                {activeTab==="reports"&&(
                  <div style={{ animation:"fadeUp 0.4s ease-out" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"24px" }}>
                      {[
                        { label:"Total Headcount", value:stats.totalEmployees||0, color:"#38bdf8", icon:"👥" },
                        { label:"Active Employees", value:stats.activeEmployees||0, color:"#10b981", icon:"✅" },
                        { label:"On Leave", value:stats.onLeave||0, color:"#f59e0b", icon:"🏖️" },
                        { label:"Total Tasks", value:stats.totalTasks||0, color:"#a78bfa", icon:"📋" },
                        { label:"Tasks Completed", value:stats.completedTasks||0, color:"#10b981", icon:"✔️" },
                        { label:"Tasks In Progress", value:stats.inProgressTasks||0, color:"#38bdf8", icon:"⚡" },
                      ].map((r,i)=>(
                        <div key={r.label} style={{ background:t.bgCard,border:`1px solid ${r.color}25`,borderRadius:"14px",padding:"20px",animation:`fadeUp 0.3s ${i*0.05}s both` }}>
                          <div style={{ fontSize:"24px",marginBottom:"8px" }}>{r.icon}</div>
                          <div style={{ fontSize:"32px",fontWeight:"800",color:r.color,fontFamily:"'Syne',sans-serif" }}>{r.value}</div>
                          <div style={{ fontSize:"11px",color:t.textMuted,fontFamily:"monospace",marginTop:"4px" }}>{r.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:"16px",padding:"24px" }}>
                      <div style={{ fontSize:"14px",fontWeight:"700",color:t.textPrimary,marginBottom:"20px" }}>Department Performance Overview</div>
                      {deptDist.map(d=>{
                        const color = DEPT_COLORS[d._id]||"#64748b";
                        const avg = Math.round(d.avgPerformance||0);
                        return (
                          <div key={d._id} style={{ marginBottom:"16px" }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px" }}>
                              <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
                                <Badge color={color}>{d._id}</Badge>
                                <span style={{ fontSize:"11px",color:t.textMuted,fontFamily:"monospace" }}>{d.count} employees</span>
                              </div>
                              <span style={{ fontSize:"14px",fontWeight:"800",color,fontFamily:"monospace" }}>{avg}%</span>
                            </div>
                            <div style={{ height:"8px",background:"rgba(255,255,255,0.05)",borderRadius:"4px",overflow:"hidden" }}>
                              <div style={{ height:"100%",width:`${avg}%`,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:"4px",transition:"width 1s" }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD EMPLOYEE MODAL ── */}
      {showAddEmployee&&(
        <Modal title="Add New Employee" onClose={()=>setShowAddEmployee(false)} accentColor="#4fd1c5">
          <div style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
            <div><FormLabel>FULL NAME *</FormLabel><Input value={newEmp.name} onChange={e=>setNewEmp({...newEmp,name:e.target.value})} placeholder="e.g. Rahul Verma"/></div>
            <div><FormLabel>EMAIL *</FormLabel><Input value={newEmp.email} onChange={e=>setNewEmp({...newEmp,email:e.target.value})} placeholder="rahul@company.com" type="email"/></div>
            <div>
              <FormLabel>PASSWORD *</FormLabel>
              <div style={{ position:"relative" }}>
                <input
                  type={showNewEmpPass ? "text" : "password"}
                  value={newEmp.password}
                  onChange={e => setNewEmp({...newEmp, password: e.target.value})}
                  placeholder="Min 6 characters"
                  style={{ background:t.bgCardHover,border:`1px solid ${newEmp.password && newEmp.password.length < 6 ? "#ef4444" : "rgba(255,255,255,0.09)"}`,borderRadius:"10px",color:t.textPrimary,fontSize:"12px",fontFamily:"monospace",padding:"9px 40px 9px 12px",outline:"none",width:"100%" }}
                />
                <button type="button" onClick={()=>setShowNewEmpPass(!showNewEmpPass)}
                  style={{ position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:t.textFaint,padding:0,display:"flex" }}>
                  {showNewEmpPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {/* Password strength bar */}
              {newEmp.password && (
                <div style={{ marginTop:"6px" }}>
                  <div style={{ display:"flex", gap:"4px", marginBottom:"3px" }}>
                    {[1,2,3,4].map(i => {
                      const len = newEmp.password.length;
                      const hasUpper = /[A-Z]/.test(newEmp.password);
                      const hasNum   = /[0-9]/.test(newEmp.password);
                      const hasSpec  = /[^A-Za-z0-9]/.test(newEmp.password);
                      const strength = (len >= 6 ? 1 : 0) + (len >= 8 ? 1 : 0) + (hasUpper || hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                      const color = strength <= 1 ? "#ef4444" : strength === 2 ? "#f59e0b" : strength === 3 ? "#38bdf8" : "#10b981";
                      return <div key={i} style={{ flex:1, height:"3px", borderRadius:"2px", background: i <= strength ? color : "rgba(255,255,255,0.08)", transition:"background 0.2s" }}/>;
                    })}
                  </div>
                  <div style={{ fontSize:"10px", fontFamily:"monospace", color:
                    newEmp.password.length < 6 ? "#ef4444" :
                    newEmp.password.length < 8 ? "#f59e0b" :
                    /[^A-Za-z0-9]/.test(newEmp.password) ? "#10b981" : "#38bdf8"
                  }}>
                    {newEmp.password.length < 6 ? "Too short (min 6 chars)" :
                     newEmp.password.length < 8 ? "Weak — add numbers or symbols" :
                     /[^A-Za-z0-9]/.test(newEmp.password) ? "Strong password ✓" : "Good — add symbols for stronger"}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px" }}>
              <div><FormLabel>DEPARTMENT</FormLabel>
                <Select value={newEmp.department} onChange={e=>setNewEmp({...newEmp,department:e.target.value})}>
                  {DEPTS.filter(d=>d!=="All").map(d=><option key={d}>{d}</option>)}
                </Select>
              </div>
              <div><FormLabel>STATUS</FormLabel>
                <Select value={newEmp.status} onChange={e=>setNewEmp({...newEmp,status:e.target.value})}>
                  {STATUSES.filter(s=>s!=="All").map(s=><option key={s}>{s}</option>)}
                </Select>
              </div>
            </div>
            <div><FormLabel>ROLE / DESIGNATION *</FormLabel><Input value={newEmp.designation} onChange={e=>setNewEmp({...newEmp,designation:e.target.value})} placeholder="e.g. Software Engineer"/></div>
            <div style={{ display:"flex",gap:"10px",marginTop:"8px" }}>
              <CancelBtn onClick={()=>setShowAddEmployee(false)}/>
              <SaveBtn onClick={handleAddEmployee} label="Add Employee"/>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ASSIGN TASK MODAL ── */}
      {showAssignTask&&(
        <Modal title="Assign New Task" onClose={()=>setShowAssignTask(false)} accentColor="#f59e0b">
          <div style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
            <div><FormLabel>ASSIGN TO *</FormLabel>
              <Select value={newTask.assignedTo} onChange={e=>setNewTask({...newTask,assignedTo:e.target.value})}>
                <option value="">-- Select Employee --</option>
                {employees.filter(e=>e.status==="Active").map(e=><option key={e._id} value={e._id}>{e.name} ({e.department})</option>)}
              </Select>
            </div>
            <div><FormLabel>TASK TITLE *</FormLabel><Input value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} placeholder="e.g. Q2 Performance Review"/></div>
            <div><FormLabel>DESCRIPTION</FormLabel>
              <textarea value={newTask.description} onChange={e=>setNewTask({...newTask,description:e.target.value})} placeholder="Describe the task..."
                style={{ width:"100%",padding:"9px 12px",background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"10px",color:t.textPrimary,fontSize:"12px",fontFamily:"monospace",outline:"none",minHeight:"80px",resize:"vertical" }}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px" }}>
              <div><FormLabel>PRIORITY</FormLabel>
                <Select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}>
                  {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                </Select>
              </div>
              <div><FormLabel>DEADLINE *</FormLabel><Input type="date" value={newTask.deadline} onChange={e=>setNewTask({...newTask,deadline:e.target.value})}/></div>
            </div>
            <div><FormLabel>DEPARTMENT</FormLabel>
              <Select value={newTask.department} onChange={e=>setNewTask({...newTask,department:e.target.value})}>
                {DEPTS.filter(d=>d!=="All").map(d=><option key={d}>{d}</option>)}
              </Select>
            </div>
            <div style={{ display:"flex",gap:"10px",marginTop:"8px" }}>
              <CancelBtn onClick={()=>setShowAssignTask(false)}/>
              <SaveBtn onClick={handleAssignTask} color="linear-gradient(135deg,#f59e0b,#fb923c)" label="Assign Task"/>
            </div>
          </div>
        </Modal>
      )}

      {/* ── EDIT EMPLOYEE MODAL ── */}
      {showEditEmployee&&(
        <Modal title="Edit Employee" onClose={()=>setShowEditEmployee(null)} accentColor="#a78bfa">
          <div style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
            <div><FormLabel>FULL NAME</FormLabel><Input value={showEditEmployee.name} onChange={e=>setShowEditEmployee({...showEditEmployee,name:e.target.value})}/></div>
            <div><FormLabel>EMAIL</FormLabel><Input value={showEditEmployee.email} onChange={e=>setShowEditEmployee({...showEditEmployee,email:e.target.value})}/></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px" }}>
              <div><FormLabel>DEPARTMENT</FormLabel>
                <Select value={showEditEmployee.department} onChange={e=>setShowEditEmployee({...showEditEmployee,department:e.target.value})}>
                  {DEPTS.filter(d=>d!=="All").map(d=><option key={d}>{d}</option>)}
                </Select>
              </div>
              <div><FormLabel>STATUS</FormLabel>
                <Select value={showEditEmployee.status} onChange={e=>setShowEditEmployee({...showEditEmployee,status:e.target.value})}>
                  {STATUSES.filter(s=>s!=="All").map(s=><option key={s}>{s}</option>)}
                </Select>
              </div>
            </div>
            <div><FormLabel>DESIGNATION</FormLabel><Input value={showEditEmployee.designation} onChange={e=>setShowEditEmployee({...showEditEmployee,designation:e.target.value})}/></div>
            {/* Reset Password */}
            <div style={{ padding:"12px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px" }}>
              <FormLabel>RESET PASSWORD (leave blank to keep current)</FormLabel>
              <div style={{ position:"relative" }}>
                <input
                  type={showEditEmployee._showPass ? "text" : "password"}
                  value={showEditEmployee.newPassword || ""}
                  onChange={e => setShowEditEmployee({...showEditEmployee, newPassword: e.target.value})}
                  placeholder="Enter new password to reset..."
                  style={{ background:t.bgCardHover,border:`1px solid ${t.borderInput}`,borderRadius:"8px",color:t.textPrimary,fontSize:"12px",fontFamily:"monospace",padding:"8px 36px 8px 10px",outline:"none",width:"100%" }}
                />
                <button type="button" onClick={()=>setShowEditEmployee({...showEditEmployee,_showPass:!showEditEmployee._showPass})}
                  style={{ position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:t.textFaint,padding:0,display:"flex" }}>
                  {showEditEmployee._showPass
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {showEditEmployee.newPassword && showEditEmployee.newPassword.length < 6 && (
                <div style={{ fontSize:"10px",color:"#ef4444",fontFamily:"monospace",marginTop:"4px" }}>⚠ Min 6 characters</div>
              )}
              {showEditEmployee.newPassword && showEditEmployee.newPassword.length >= 6 && (
                <div style={{ fontSize:"10px",color:"#10b981",fontFamily:"monospace",marginTop:"4px" }}>✓ Password will be updated</div>
              )}
            </div>
            <div>
              <FormLabel>PERFORMANCE SCORE: {showEditEmployee.performance}%</FormLabel>
              <input type="range" min="0" max="100" value={showEditEmployee.performance} onChange={e=>setShowEditEmployee({...showEditEmployee,performance:Number(e.target.value)})} style={{ width:"100%",accentColor:"#a78bfa",marginTop:"4px" }}/>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"10px",color:t.textFaint,fontFamily:"monospace",marginTop:"2px" }}><span>0%</span><span style={{ color:"#a78bfa",fontWeight:"700" }}>{showEditEmployee.performance}%</span><span>100%</span></div>
            </div>
            <div style={{ display:"flex",gap:"10px",marginTop:"8px" }}>
              <CancelBtn onClick={()=>setShowEditEmployee(null)}/>
              <SaveBtn onClick={handleEditEmployee} color="linear-gradient(135deg,#a78bfa,#818cf8)" label="Save Changes"/>
            </div>
          </div>
        </Modal>
      )}

      {/* ── EMPLOYEE DETAIL MODAL ── */}
      {showEmployeeDetail&&(
        <Modal title="Employee Profile" onClose={()=>setShowEmployeeDetail(null)} accentColor={DEPT_COLORS[showEmployeeDetail.department]||"#4fd1c5"}>
          <div style={{ display:"flex",gap:"16px",alignItems:"center",marginBottom:"20px",padding:"16px",background:`${DEPT_COLORS[showEmployeeDetail.department]||"#4fd1c5"}10`,borderRadius:"12px",border:`1px solid ${DEPT_COLORS[showEmployeeDetail.department]||"#4fd1c5"}25` }}>
            <Avatar initials={showEmployeeDetail.avatar||showEmployeeDetail.name?.[0]} color={DEPT_COLORS[showEmployeeDetail.department]||"#4fd1c5"} size={52}/>
            <div>
              <div style={{ fontSize:"18px",fontWeight:"800",color:t.textPrimary }}>{showEmployeeDetail.name}</div>
              <div style={{ fontSize:"12px",color:t.textSecondary,fontFamily:"monospace" }}>{showEmployeeDetail.employeeId} · {showEmployeeDetail.designation}</div>
              <div style={{ display:"flex",gap:"6px",marginTop:"6px" }}>
                <Badge color={DEPT_COLORS[showEmployeeDetail.department]||"#4fd1c5"}>{showEmployeeDetail.department}</Badge>
                <Badge color={STATUS_COLORS[showEmployeeDetail.status]}>{showEmployeeDetail.status}</Badge>
              </div>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px" }}>
            {[
              { label:"Email", value:showEmployeeDetail.email },
              { label:"Employee ID", value:showEmployeeDetail.employeeId },
              { label:"Performance", value:`${showEmployeeDetail.performance}%` },
              { label:"Tasks", value:`${showEmployeeDetail.taskCount||0} assigned` },
            ].map(f=>(
              <div key={f.label} style={{ padding:"12px",background:t.bgCard,borderRadius:"10px" }}>
                <div style={{ fontSize:"10px",color:t.textFaint,fontFamily:"monospace",marginBottom:"4px",letterSpacing:"0.08em" }}>{f.label.toUpperCase()}</div>
                <div style={{ fontSize:"13px",fontWeight:"600",color:t.textPrimary }}>{f.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",gap:"10px" }}>
            <button onClick={()=>{setShowEmployeeDetail(null);setShowEditEmployee({...showEmployeeDetail});}} style={{ flex:1,padding:"10px",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:"10px",color:"#a78bfa",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>Edit Employee</button>
            <button onClick={()=>{setShowEmployeeDetail(null);setNewTask({...newTask,assignedTo:showEmployeeDetail._id});setShowAssignTask(true);}} style={{ flex:1,padding:"10px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px",color:"#f59e0b",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Syne',sans-serif" }}>Assign Task</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {notification&&(
        <div style={{ position:"fixed",bottom:"24px",right:"24px",zIndex:2000,padding:"12px 20px",background:t.bgModal,border:`1px solid ${notification.color}40`,borderRadius:"12px",color:notification.color,fontSize:"13px",fontWeight:"600",fontFamily:"'Syne',sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"toastIn 0.3s ease-out" }}>
          {notification.msg}
        </div>
      )}
    </>
  );
}