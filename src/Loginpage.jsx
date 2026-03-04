import { useState, useEffect } from "react";
import { authAPI } from "./api";
import ThemeToggle from "./ThemeToggle";

const NODE_COUNT = 18;
function generateNodes() {
  return Array.from({ length: NODE_COUNT }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, vx: (Math.random() - 0.5) * 0.03, vy: (Math.random() - 0.5) * 0.03, size: Math.random() * 3 + 1.5 }));
}
function NetworkCanvas() {
  const [nodes, setNodes] = useState(generateNodes);
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => prev.map(n => {
        let nx = n.x + n.vx, ny = n.y + n.vy, nvx = n.vx, nvy = n.vy;
        if (nx < 0 || nx > 100) nvx = -nvx; if (ny < 0 || ny > 100) nvy = -nvy;
        return { ...n, x: Math.max(0, Math.min(100, nx)), y: Math.max(0, Math.min(100, ny)), vx: nvx, vy: nvy };
      }));
    }, 40);
    return () => clearInterval(interval);
  }, []);
  const edges = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < 22) edges.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y, opacity: ((22-dist)/22)*0.35 });
  }
  return (
    <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      {edges.map((e,i) => <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#4fd1c5" strokeWidth="0.12" opacity={e.opacity}/>)}
      {nodes.map(n => <circle key={n.id} cx={n.x} cy={n.y} r={n.size*0.11} fill="#4fd1c5" opacity="0.6"/>)}
    </svg>
  );
}

const ROLES = [
  { id:"admin", label:"Administrator", subtitle:"Full system access & controls", color:"#f59e0b", glow:"rgba(245,158,11,0.3)", border:"rgba(245,158,11,0.5)", bg:"rgba(245,158,11,0.08)",
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    badge:"ADMIN", permissions:["All Departments","Analytics","User Management"] },
  { id:"employee", label:"Employee", subtitle:"Personal dashboard & tasks", color:"#4fd1c5", glow:"rgba(79,209,197,0.3)", border:"rgba(79,209,197,0.5)", bg:"rgba(79,209,197,0.08)",
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    badge:"STAFF", permissions:["My Goals","Performance","Team View"] },
];

export default function LoginPage({ onLogin, theme, toggleTheme }) {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [shake, setShake] = useState(false);
  const [step, setStep] = useState("role");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedRole = ROLES.find(r => r.id === role);
  const accentColor = selectedRole?.color || "#4fd1c5";

  const handleRoleSelect = (r) => { setRole(r); setErrorMsg(""); setTimeout(() => setStep("credentials"), 300); };
  const handleBack = () => { setStep("role"); setTimeout(() => setRole(null), 300); setEmail(""); setPassword(""); setErrorMsg(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setLoading(true); setErrorMsg("");
    try {
      const data = await authAPI.login(email, password);
      if (data.user.role !== role) {
        setErrorMsg(`This account is not a ${role}. Please select the correct role.`);
        setLoading(false); setShake(true); setTimeout(() => setShake(false), 500); return;
      }
      onLogin(data.user.role, data.user);
    } catch (err) {
      setErrorMsg(err.message || "Invalid email or password");
      setLoading(false); setShake(true); setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;overflow:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-ring{0%{transform:scale(0.95);opacity:0.6}70%{transform:scale(1.08);opacity:0}100%{transform:scale(0.95);opacity:0}}
        @keyframes slideLeft{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(79,209,197,0.15)}50%{box-shadow:0 0 40px rgba(79,209,197,0.3)}}
        .card-mounted{animation:fadeUp 0.7s 0.1s both ease-out,glow 4s ease-in-out infinite}
        .card-shake{animation:shake 0.4s ease-in-out !important}
        .step-role{animation:slideRight 0.35s ease-out}
        .step-creds{animation:slideLeft 0.35s ease-out}
        .role-card{cursor:pointer;transition:all 0.25s ease}
        .role-card:hover{transform:translateY(-2px)}
        .role-card-admin:hover{border-color:rgba(245,158,11,0.6)!important;box-shadow:0 8px 32px rgba(245,158,11,0.2)!important}
        .role-card-admin.selected{border-color:rgba(245,158,11,0.8)!important;background:rgba(245,158,11,0.1)!important}
        .role-card-employee:hover{border-color:rgba(79,209,197,0.6)!important;box-shadow:0 8px 32px rgba(79,209,197,0.2)!important}
        .role-card-employee.selected{border-color:rgba(79,209,197,0.8)!important;background:rgba(79,209,197,0.1)!important}
        .submit-btn{transition:all 0.2s}.submit-btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.1)}
        .back-btn{transition:color 0.2s}.back-btn:hover{color:#e2e8f0!important}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0px 1000px #0a1628 inset!important;-webkit-text-fill-color:#e2e8f0!important}
      `}</style>
      <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#060d14 0%,#0a1628 50%,#050e1a 100%)",fontFamily:"'Syne',sans-serif",position:"relative",overflow:"hidden" }}>
        <NetworkCanvas />
        {/* Theme Toggle */}
        {toggleTheme && <div style={{ position:"absolute",top:"16px",right:"16px",zIndex:20 }}><ThemeToggle theme={theme||{name:"dark"}} toggleTheme={toggleTheme}/></div>}
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"700px",height:"700px",pointerEvents:"none",background:`radial-gradient(circle,${selectedRole?selectedRole.glow.replace("0.3","0.07"):"rgba(79,209,197,0.06)"} 0%,transparent 65%)`,transition:"background 0.5s ease" }} />

        <div className={`card-mounted ${shake?"card-shake":""}`} style={{ width:"460px",maxWidth:"calc(100vw - 32px)",background:"rgba(10,20,38,0.92)",border:`1px solid ${selectedRole?selectedRole.border.replace("0.5","0.25"):"rgba(79,209,197,0.18)"}`,borderRadius:"26px",padding:"44px 40px",backdropFilter:"blur(28px)",position:"relative",zIndex:10,transition:"border-color 0.4s,box-shadow 0.4s" }}>
          {/* Logo */}
          <div style={{ marginBottom:"32px",textAlign:"center" }}>
            <div style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:"52px",height:"52px",borderRadius:"15px",background:selectedRole?`linear-gradient(135deg,${selectedRole.color},${selectedRole.color}aa)`:"linear-gradient(135deg,#4fd1c5,#38bdf8)",marginBottom:"16px",position:"relative",transition:"background 0.4s" }}>
              <div style={{ position:"absolute",inset:"-4px",borderRadius:"19px",border:`2px solid ${accentColor}44`,animation:"pulse-ring 2.5s ease-out infinite" }} />
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 18L9 12L13 16L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 7H21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontSize:"21px",fontWeight:"800",color:"#f1f5f9",letterSpacing:"-0.4px" }}>PerformOS</div>
            <div style={{ fontSize:"10px",color:accentColor,fontFamily:"monospace",letterSpacing:"0.18em",marginTop:"3px",transition:"color 0.4s" }}>ORGANISATIONAL INTELLIGENCE</div>
          </div>

          {step === "role" && (
            <div className="step-role">
              <div style={{ marginBottom:"24px",textAlign:"center" }}>
                <div style={{ fontSize:"20px",fontWeight:"700",color:"#f1f5f9" }}>Select your role</div>
                <div style={{ fontSize:"12px",color:"#64748b",marginTop:"5px",fontFamily:"monospace" }}>Choose how you want to sign in</div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:"14px",marginBottom:"28px" }}>
                {ROLES.map(r => (
                  <div key={r.id} className={`role-card role-card-${r.id} ${role===r.id?"selected":""}`} onClick={() => handleRoleSelect(r.id)}
                    style={{ padding:"18px 20px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:"16px" }}>
                      <div style={{ width:"48px",height:"48px",borderRadius:"14px",flexShrink:0,background:r.bg,border:`1px solid ${r.border.replace("0.5","0.3")}`,display:"flex",alignItems:"center",justifyContent:"center",color:r.color }}>{r.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px" }}>
                          <span style={{ fontSize:"15px",fontWeight:"700",color:"#f1f5f9" }}>{r.label}</span>
                          <span style={{ fontSize:"9px",fontWeight:"700",color:r.color,background:r.bg,border:`1px solid ${r.border.replace("0.5","0.3")}`,borderRadius:"4px",padding:"1px 6px",fontFamily:"monospace" }}>{r.badge}</span>
                        </div>
                        <div style={{ fontSize:"11px",color:"#64748b",fontFamily:"monospace",marginBottom:"8px" }}>{r.subtitle}</div>
                        <div style={{ display:"flex",gap:"6px",flexWrap:"wrap" }}>
                          {r.permissions.map(p => <span key={p} style={{ fontSize:"9px",color:"#475569",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"4px",padding:"2px 7px",fontFamily:"monospace" }}>{p}</span>)}
                        </div>
                      </div>
                      <div style={{ color:r.color,opacity:0.7,flexShrink:0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop:"20px",borderTop:"1px solid rgba(255,255,255,0.06)",textAlign:"center" }}>
                <div style={{ fontSize:"10px",color:"#475569",fontFamily:"monospace",marginBottom:"12px",letterSpacing:"0.1em" }}>OR SIGN IN WITH SSO</div>
                <div style={{ display:"flex",gap:"8px" }}>
                  {[{label:"Google",icon:"G"},{label:"Microsoft",icon:"M"},{label:"Okta",icon:"O"}].map(p => (
                    <button key={p.label} style={{ flex:1,padding:"9px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",color:"#64748b",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Syne',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px" }}>
                      <span style={{ fontWeight:"800" }}>{p.icon}</span>{p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "credentials" && selectedRole && (
            <div className="step-creds">
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px" }}>
                <button className="back-btn" onClick={handleBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:"12px",fontFamily:"monospace",display:"flex",alignItems:"center",gap:"5px",padding:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Back
                </button>
                <div style={{ display:"flex",alignItems:"center",gap:"8px",background:selectedRole.bg,border:`1px solid ${selectedRole.border.replace("0.5","0.3")}`,borderRadius:"10px",padding:"6px 12px" }}>
                  <span style={{ color:selectedRole.color }}>{selectedRole.icon}</span>
                  <span style={{ fontSize:"12px",fontWeight:"700",color:selectedRole.color,fontFamily:"monospace" }}>{selectedRole.badge}</span>
                  <span style={{ fontSize:"12px",color:"#94a3b8" }}>{selectedRole.label}</span>
                </div>
              </div>
              <div style={{ marginBottom:"24px" }}>
                <div style={{ fontSize:"20px",fontWeight:"700",color:"#f1f5f9" }}>Welcome back</div>
                <div style={{ fontSize:"12px",color:"#64748b",marginTop:"4px",fontFamily:"monospace" }}>Sign in as <span style={{ color:selectedRole.color }}>{selectedRole.label}</span></div>
              </div>

              {errorMsg && (
                <div style={{ marginBottom:"16px",padding:"10px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"10px",fontSize:"12px",color:"#f87171",fontFamily:"monospace" }}>
                  ⚠ {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:"14px" }}>
                  <label style={{ display:"block",fontSize:"10px",color:"#94a3b8",marginBottom:"7px",fontFamily:"monospace",letterSpacing:"0.12em" }}>EMAIL ADDRESS</label>
                  <div style={{ position:"relative" }}>
                    <div style={{ position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:focused==="email"?accentColor:"#475569",pointerEvents:"none",transition:"color 0.2s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocused("email")} onBlur={()=>setFocused(null)}
                      placeholder={role==="admin"?"admin@performos.com":"you@performos.com"}
                      style={{ width:"100%",padding:"12px 13px 12px 40px",background:"rgba(255,255,255,0.04)",border:`1px solid ${focused==="email"?accentColor+"99":"rgba(255,255,255,0.09)"}`,borderRadius:"11px",color:"#e2e8f0",fontSize:"13px",fontFamily:"monospace",outline:"none",transition:"all 0.2s" }}/>
                  </div>
                </div>
                <div style={{ marginBottom:"20px" }}>
                  <label style={{ display:"block",fontSize:"10px",color:"#94a3b8",marginBottom:"7px",fontFamily:"monospace",letterSpacing:"0.12em" }}>PASSWORD</label>
                  <div style={{ position:"relative" }}>
                    <div style={{ position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:focused==="pass"?accentColor:"#475569",pointerEvents:"none",transition:"color 0.2s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} onFocus={()=>setFocused("pass")} onBlur={()=>setFocused(null)} placeholder="••••••••••"
                      style={{ width:"100%",padding:"12px 40px 12px 40px",background:"rgba(255,255,255,0.04)",border:`1px solid ${focused==="pass"?accentColor+"99":"rgba(255,255,255,0.09)"}`,borderRadius:"11px",color:"#e2e8f0",fontSize:"13px",fontFamily:"monospace",outline:"none",transition:"all 0.2s" }}/>
                    <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:"absolute",right:"13px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#475569",padding:0 }}>
                      {showPass?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
                  <label style={{ display:"flex",alignItems:"center",gap:"7px",cursor:"pointer" }}>
                    <div style={{ width:"15px",height:"15px",borderRadius:"4px",border:`1px solid ${accentColor}55`,background:`${accentColor}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize:"11px",color:"#64748b",fontFamily:"monospace" }}>Remember me</span>
                  </label>
                  <button type="button" style={{ background:"none",border:"none",fontSize:"11px",color:accentColor,cursor:"pointer",fontFamily:"monospace" }}>Forgot password?</button>
                </div>
                <button type="submit" disabled={loading} className="submit-btn"
                  style={{ width:"100%",padding:"13px",background:loading?"rgba(255,255,255,0.06)":role==="admin"?"linear-gradient(135deg,#f59e0b,#fb923c)":"linear-gradient(135deg,#4fd1c5,#38bdf8)",border:"none",borderRadius:"12px",color:loading?"#64748b":"#0a1628",fontSize:"13px",fontWeight:"700",fontFamily:"'Syne',sans-serif",letterSpacing:"0.06em",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"9px" }}>
                  {loading?<><div style={{ width:"15px",height:"15px",border:"2px solid #475569",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>AUTHENTICATING...</>
                  :role==="admin"?"ACCESS ADMIN PANEL →":"GO TO MY DASHBOARD →"}
                </button>
              </form>
              {role==="admin"&&(<div style={{ marginTop:"16px",padding:"10px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:"10px",display:"flex",alignItems:"center",gap:"8px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize:"10px",color:"#92400e",fontFamily:"monospace" }}>Admin access is monitored and logged for security.</span>
              </div>)}
            </div>
          )}
          <div style={{ marginTop:"24px",paddingTop:"16px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"center",gap:"20px" }}>
            {["Privacy","Terms","Support"].map(item=><span key={item} style={{ fontSize:"10px",color:"#334155",fontFamily:"monospace",cursor:"pointer" }}>{item}</span>)}
          </div>
        </div>
      </div>
    </>
  );
}