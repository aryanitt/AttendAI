import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Camera, Upload, Users, ClipboardList, 
  Settings, Bell, Search, ChevronRight, User, LogOut,
  CheckCircle2, AlertCircle, TrendingUp, Download, Eye,
  Scan, Maximize2, MoreHorizontal, Filter, Zap, FileText
} from 'lucide-react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart as ReBarChart, Bar, Cell 
} from 'recharts';
import { toast, Toaster } from 'react-hot-toast';

const API_BASE = "http://localhost:8000";

// --- Components ---

const GlassCard = ({ children, className = "", noPadding = false }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] overflow-hidden ${!noPadding ? 'p-6' : ''} shadow-premium ${className}`}
  >
    {children}
  </motion.div>
);

const SidebarItem = ({ id, name, icon: Icon, current, setPage }) => {
  const isActive = current === id;
  return (
    <button
      onClick={() => setPage(id)}
      className={`relative w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
        isActive 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={20} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
      <span className="font-semibold text-sm">{name}</span>
      {isActive && (
        <motion.div 
          layoutId="sidebar-accent"
          className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
        />
      )}
    </button>
  );
};

const Layout = ({ children, page, setPage }) => {
  return (
    <div className="flex bg-[#0a0f1c] min-h-screen text-slate-200 font-sans selection:bg-primary-500/30">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-[#0d1221]/50 backdrop-blur-xl sticky top-0 h-screen p-6 flex flex-col">
        <div className="flex items-center gap-3 px-2 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/20">
            <Scan size={24} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">Attend<span className="text-primary-500">AI</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem id="dashboard" name="Overview" icon={LayoutDashboard} current={page} setPage={setPage} />
          <SidebarItem id="live" name="Live Scanner" icon={Camera} current={page} setPage={setPage} />
          <SidebarItem id="upload" name="Batch Upload" icon={Upload} current={page} setPage={setPage} />
          <SidebarItem id="manage" name="Students" icon={Users} current={page} setPage={setPage} />
          <SidebarItem id="logs" name="Records" icon={ClipboardList} current={page} setPage={setPage} />
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/5 pt-6">
          <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white transition-colors">
            <Settings size={20} />
            <span className="font-semibold text-sm">Settings</span>
          </button>
          <div className="p-4 bg-white/5 rounded-3xl mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">AG</div>
              <div>
                <p className="text-xs font-bold text-white">Aryan Gupta</p>
                <p className="text-[10px] text-slate-500">Administrator</p>
              </div>
            </div>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-400 transition-all flex items-center justify-center gap-2">
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#0a0f1c]/50 backdrop-blur-md z-10">
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search students, records..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary-500 focus:bg-white/[0.08] transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all relative">
              <Bell size={20} className="text-slate-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-[#0a0f1c]"></span>
            </button>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <button className="flex items-center gap-3 bg-white/5 border border-white/10 p-1.5 pr-4 rounded-xl hover:bg-white/10 transition-all">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-indigo-500"></div>
              <span className="text-sm font-bold text-white">Admin Console</span>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

// --- Pages ---

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const chartData = [
    { name: 'Mon', count: 42 }, { name: 'Tue', count: 58 },
    { name: 'Wed', count: 45 }, { name: 'Thu', count: 70 },
    { name: 'Fri', count: 65 }, { name: 'Sat', count: 20 },
    { name: 'Sun', count: 15 },
  ];

  useEffect(() => {
    axios.get(`${API_BASE}/stats`)
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <div className="p-10 text-slate-500 animate-pulse">Initializing Dashboard...</div>;

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-400 mt-2 font-medium">Monitoring system health and attendance metrics.</p>
        </div>
        <div className="flex gap-3">
            <button className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">History</button>
            <button className="bg-primary-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/30">Generate Report</button>
        </div>
      </div>
      
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Enrolled', value: stats.total_students, icon: Users, gradient: 'from-blue-600/20 to-indigo-600/5', iconCol: 'text-blue-400' },
          { label: 'Present Today', value: stats.present_today, icon: CheckCircle2, gradient: 'from-emerald-600/20 to-emerald-600/5', iconCol: 'text-emerald-400' },
          { label: 'System Alerts', value: stats.absent_today, icon: AlertCircle, gradient: 'from-rose-600/20 to-rose-600/5', iconCol: 'text-rose-400' },
          { label: 'Growth rate', value: `${stats.attendance_rate.toFixed(1)}%`, icon: TrendingUp, gradient: 'from-amber-600/20 to-amber-600/5', iconCol: 'text-amber-400' },
        ].map((card, i) => (
          <GlassCard key={i} className={`relative group cursor-default transition-all duration-300 hover:scale-[1.02] active:scale-95`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <card.icon size={26} className={card.iconCol} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Live</span>
                </div>
                <p className="text-sm font-bold text-slate-400">{card.label}</p>
                <p className="text-4xl font-black text-white mt-2 leading-none">{card.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-white">Attendance Trends</h3>
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    {['1W', '1M', '1Y'].map(t => (
                        <button key={t} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${t === '1W' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                    ))}
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                        />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>

        <GlassCard>
            <h3 className="text-xl font-bold text-white mb-6">Recognition Peak</h3>
            <div className="space-y-6">
                {[
                    { slot: '09:00 AM', count: 12, label: 'Morning Shift' },
                    { slot: '02:00 PM', count: 8, label: 'Afternoon' },
                    { slot: '06:00 PM', count: 5, label: 'Evening' },
                ].map((s, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-primary-500">{s.slot.split(':')[0]}</div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">{s.slot}</p>
                            <p className="text-xs text-slate-500">{s.label}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-white">{s.count}</p>
                            <p className="text-[10px] text-emerald-500 font-bold">+2.4%</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                Detailed Analytics <ChevronRight size={16} />
            </button>
        </GlassCard>
      </div>
    </div>
  );
};

const LiveCamera = () => {
  const webcamRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [status, setStatus] = useState("System Standby");

  const capture = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setStatus("Syncing with Neural Engine...");
    
    try {
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'scan.jpg');

      const res = await axios.post(`${API_BASE}/attendance/scan`, formData);
      if (res.data.detected > 0) {
        if (res.data.recorded.length > 0) {
            setStatus(`Verified: ${res.data.recorded.join(', ')}`);
            toast.success(`Access Granted: ${res.data.recorded[0]}`, {
                icon: '🔑',
                style: { background: '#0f172a', color: '#10b981', border: '1px solid #10b981/20' }
            });
        } else {
            setStatus("Face detected, but no match found.");
        }
      } else {
        setStatus("No face detected in frame.");
      }
    } catch (err) {
      console.error("Capture Error:", err);
      setStatus("Neural Link Interrupted.");
    }
  };

  useEffect(() => {
    let interval;
    if (capturing) {
      interval = setInterval(capture, 2000); // Faster interval for optimized model
    }
    return () => clearInterval(interval);
  }, [capturing]);

  const videoConstraints = {
      width: 640,
      height: 480,
      facingMode: "user"
  };

  return (
    <div className="p-10 max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col">
        <div className="grid lg:grid-cols-3 gap-8 flex-1">
            <div className="lg:col-span-2 relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent rounded-[40px] pointer-events-none"></div>
                <div className="w-full h-full bg-slate-900/50 rounded-[40px] border border-white/10 overflow-hidden relative shadow-2xl">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full h-full object-cover grayscale-[30%]"
                    />
                    
                    {/* HUD Overlay */}
                    <div className="absolute inset-x-8 top-8 flex justify-between pointer-events-none">
                        <div className="flex gap-4">
                            <div className="px-4 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${capturing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                                <span className="text-slate-400">Status:</span>
                                <span className="text-white">{status}</span>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-primary-500/10 backdrop-blur-xl rounded-2xl border border-primary-500/20">
                            <span className="text-[10px] font-black text-primary-400 tracking-widest uppercase">Neural Link Active</span>
                        </div>
                    </div>

                    {/* Corner Bracket Graphics */}
                    <div className="absolute top-12 left-12 w-12 h-12 border-t-2 border-l-2 border-primary-500/30 rounded-tl-lg"></div>
                    <div className="absolute top-12 right-12 w-12 h-12 border-t-2 border-r-2 border-primary-500/30 rounded-tr-lg"></div>
                    <div className="absolute bottom-12 left-12 w-12 h-12 border-b-2 border-l-2 border-primary-500/30 rounded-bl-lg"></div>
                    <div className="absolute bottom-12 right-12 w-12 h-12 border-b-2 border-r-2 border-primary-500/30 rounded-br-lg"></div>

                    {/* Scanning Laser Line */}
                    {capturing && (
                        <motion.div 
                            animate={{ top: ['20%', '80%', '20%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20"
                        />
                    )}

                    {!capturing && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 z-30">
                            <div className="w-24 h-24 bg-primary-600/20 rounded-[40px] flex items-center justify-center mb-8 border border-primary-500/30 shadow-2xl shadow-primary-500/20">
                                <Camera size={40} className="text-primary-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Scanner Interfaced</h2>
                            <p className="text-slate-400 mt-3 max-w-sm text-sm font-medium leading-relaxed">Neural biometric identification is on standby. Initialize to begin live packet analysis.</p>
                            <button 
                                onClick={() => setCapturing(true)}
                                className="mt-10 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-10 py-4 rounded-[20px] font-black hover:opacity-90 transition-all flex items-center gap-3 shadow-2xl shadow-primary-600/30"
                            >
                                <Scan size={20} /> Initialize Neural Scanner
                            </button>
                        </div>
                    )}

                    {capturing && (
                        <div className="absolute inset-x-0 bottom-8 flex justify-center z-30">
                            <button 
                                onClick={() => setCapturing(false)}
                                className="bg-rose-500/10 hover:bg-rose-500/20 backdrop-blur-xl border border-rose-500/20 text-rose-500 px-8 py-3 rounded-2xl font-black transition-all flex items-center gap-2 group"
                            >
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse group-hover:scale-125 transition-transform"></div>
                                Disconnect Neural Link
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-8">
                <GlassCard className="bg-primary-500/5 border-primary-500/10">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Pipeline Diagnostics</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Latency', value: '42ms', color: 'text-emerald-400' },
                            { label: 'Precision', value: '99.2%', color: 'text-primary-400' },
                            { label: 'Encryption', value: 'AES-256', color: 'text-slate-400' },
                        ].map((stat, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                <span className="text-xs font-bold text-slate-500 uppercase">{stat.label}</span>
                                <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard className="bg-emerald-500/5 border-emerald-500/10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <CheckCircle2 size={18} />
                        </div>
                        <h4 className="text-sm font-black text-white">System Optimized</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">MTCNN downscaling and biometric indexing are currently tuned for high-speed local processing.</p>
                </GlassCard>
            </div>
        </div>
    </div>
  );
};

const ManageStudents = () => {
    const [name, setName] = useState('');
    const [roll, setRoll] = useState('');
    const [files, setFiles] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_BASE}/students`);
            setStudents(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleFileChange = (e) => setFiles(e.target.files);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('roll_number', roll);
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            await axios.post(`${API_BASE}/students/register`, formData);
            toast.success("Identity Training Complete");
            setName(''); setRoll(''); setFiles([]);
            fetchStudents();
        } catch (err) {
            console.error(err);
            toast.error("Deep Learning error during training.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadStudentReport = async (name) => {
        try {
            const res = await axios.get(`${API_BASE}/attendance/export/student/${name}`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_${name}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Individual Report Generated");
        } catch (err) {
            console.error(err);
            toast.error("No records found for this student.");
        }
    };

    const handleDelete = async (roll_number) => {
        if (!window.confirm("Are you sure? This will delete all attendance records for this student.")) return;
        try {
            await axios.delete(`${API_BASE}/students/${roll_number}`);
            toast.success("Student removed from registry");
            fetchStudents();
        } catch (err) {
            console.error(err);
            toast.error("Deletion failed.");
        }
    };

    return (
        <div className="p-10 max-w-5xl mx-auto space-y-12">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-10">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Registry Center</h1>
                        <p className="text-slate-400 mt-2 font-medium">Training new neural clusters for students.</p>
                    </div>

                    <GlassCard>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Full Legal Name</label>
                                <input 
                                    type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe"
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-[20px] p-4 text-sm focus:outline-none focus:border-primary-500 focus:bg-white/[0.08] transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">System Roll Identity</label>
                                <input 
                                    type="text" value={roll} onChange={e => setRoll(e.target.value)} required placeholder="S-00123"
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-[20px] p-4 text-sm focus:outline-none focus:border-primary-500 focus:bg-white/[0.08] transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Training Biometrics (1-5 Photos)</label>
                                <div className="grid grid-cols-5 gap-2 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${files[i] ? 'border-primary-500/50 bg-primary-500/10' : 'border-white/5 bg-white/5'}`}>
                                            {files[i] ? (
                                                <img 
                                                    src={URL.createObjectURL(files[i])} 
                                                    alt="preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-slate-700 font-bold text-xs">{i + 1}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input 
                                        type="file" multiple onChange={handleFileChange} required id="reg-file"
                                        accept="image/*" className="hidden"
                                    />
                                    <label htmlFor="reg-file" className="w-full flex items-center justify-between bg-white/5 border border-white/10 text-slate-400 rounded-[20px] p-4 text-sm cursor-pointer hover:bg-white/10 transition-all">
                                        <span>{files.length > 0 ? `${files.length} Samples Selected` : 'Select 1 to 5 clear face photos'}</span>
                                        <Camera size={18} />
                                    </label>
                                </div>
                                {files.length > 5 && <p className="text-rose-500 text-[10px] mt-2 font-bold uppercase tracking-widest">Maximum 5 photos allowed</p>}
                                <p className="text-[9px] text-slate-500 mt-2 italic">* Use Ctrl/Shift to select multiple photos in the explorer.</p>
                            </div>
                            <button 
                                type="submit" disabled={loading || files.length < 1 || files.length > 5}
                                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-5 rounded-[24px] font-black hover:opacity-90 transition-all shadow-xl shadow-primary-600/20 disabled:opacity-50"
                            >
                                {loading ? 'Initializing Neural Network...' : 'Commit Identity to Registry'}
                            </button>
                        </form>
                    </GlassCard>
                </div>

                <div className="space-y-10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Active Registry</h2>
                        <p className="text-slate-400 mt-2 font-medium">Currently identified students in this cluster.</p>
                    </div>

                    <GlassCard noPadding className="border-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/40 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-slate-500 font-black uppercase tracking-widest text-[9px] border-b border-white/5">Student</th>
                                    <th className="p-4 text-slate-500 font-black uppercase tracking-widest text-[9px] border-b border-white/5 text-right flex justify-end"><Settings size={14} /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {students.map((student) => (
                                    <tr key={student._id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <p className="text-white font-bold text-sm">{student.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{student.roll_number}</p>
                                        </td>
                                        <td className="p-4 text-right flex items-center justify-end gap-1">
                                            <button 
                                                onClick={() => handleDownloadStudentReport(student.name)}
                                                className="p-2 text-primary-500/50 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all"
                                                title="Download Student History"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(student.roll_number)}
                                                className="p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                title="Remove student"
                                            >
                                                <LogOut size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="p-10 text-center text-slate-600 text-xs italic">Registry is empty.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

const BatchAttendance = () => {
    const [files, setFiles] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
        setResults(null);
    };

    const processBatch = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setResults(null);
        let allRecorded = [];
        let totalDetected = 0;

        setProgress({ current: 0, total: files.length });

        for (let i = 0; i < files.length; i++) {
            setProgress(prev => ({ ...prev, current: i + 1 }));
            const formData = new FormData();
            formData.append('file', files[i]);

            try {
                const res = await axios.post(`${API_BASE}/attendance/scan`, formData);
                allRecorded = [...new Set([...allRecorded, ...res.data.recorded])];
                totalDetected += res.data.detected;
            } catch (err) {
                console.error(`Error processing file ${i + 1}:`, err);
                toast.error(`Failed to process: ${files[i].name}`);
            }
        }

        setResults({ recorded: allRecorded, detected: totalDetected });
        setLoading(false);
        if (allRecorded.length > 0) {
            toast.success(`Sequential Analysis Complete. ${allRecorded.length} Unique Identities Logged.`);
        }
    };

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-black text-white tracking-tight">Batch Neural Analysis</h1>
                <p className="text-slate-400 text-lg font-medium">Upload one or more group photos for massive identity verification.</p>
            </div>

            <GlassCard className="border-primary-500/10 bg-primary-500/5">
                <div className="space-y-8">
                    <div 
                        className="border-2 border-dashed border-white/10 rounded-[32px] p-12 text-center hover:border-primary-500/50 transition-all group cursor-pointer bg-black/20"
                        onClick={() => document.getElementById('batch-file').click()}
                    >
                        <input 
                            type="file" id="batch-file" className="hidden" multiple
                            accept="image/*" onChange={handleFileChange} 
                        />
                        <div className="bg-primary-500/10 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-2xl shadow-primary-500/20">
                            <Upload className="text-primary-500" size={32} />
                        </div>
                        <h3 className="text-white text-xl font-black mb-2">{files.length > 0 ? `${files.length} Packages Staged` : 'Drop Photo Bundles Here'}</h3>
                        <p className="text-slate-500 font-medium">Supports multiple High-Resolution JPG/PNG clusters</p>
                    </div>

                    {files.length > 0 && (
                        <div className="grid grid-cols-6 gap-3">
                            {files.map((f, i) => (
                                <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group">
                                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        BATCH {i+1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button 
                        onClick={processBatch}
                        disabled={loading || files.length === 0}
                        className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-6 rounded-[28px] font-black hover:opacity-90 transition-all shadow-2xl shadow-primary-600/30 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Analysing Bundle {progress.current}/{progress.total}...
                            </>
                        ) : (
                            <>
                                <Zap size={24} />
                                Execute Batch Processing
                            </>
                        )}
                    </button>
                </div>
            </GlassCard>

            {results && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard className="border-green-500/20 bg-green-500/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-green-500/10 p-5 rounded-[24px]">
                                <CheckCircle className="text-green-500" size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">Batch Analysis Complete</h3>
                                <p className="text-slate-400 font-medium">Found {results.detected} biometric signatures. Successfully logged {results.recorded.length} identities.</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {results.recorded.map(name => (
                                        <span key={name} className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-xs font-black uppercase tracking-wider border border-green-500/20">
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            )}
        </div>
    );
};

const AttendanceLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        axios.get(`${API_BASE}/attendance/logs`)
            .then(res => setLogs(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleExport = async () => {
        try {
            const res = await axios.get(`${API_BASE}/attendance/export`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Attendance_Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Master Ledger Exported");
        } catch (err) {
            console.error(err);
            toast.error("Export failed. No records available.");
        }
    };

    return (
        <div className="p-10 space-y-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Ledger Matrix</h1>
                    <p className="text-slate-400 mt-2 font-medium">Immutable identification logs.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex gap-1">
                        {['Daily', 'Weekly', 'Global'].map(t => (
                            <button key={t} className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all ${t === 'Global' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-3.5 rounded-2xl hover:bg-emerald-600 transition-all font-black shadow-lg shadow-emerald-500/20"
                    >
                        <Download size={22} className="text-white" />
                        Export Ledger
                    </button>
                </div>
            </div>

            <GlassCard noPadding className="border-white/5">
                <div className="p-6 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all border border-white/5">
                            <Filter size={14} /> Filter
                        </button>
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                        Displaying <span className="text-white">{logs.length}</span> verified entries
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/40">
                                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-white/5">Operator</th>
                                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-white/5">Chronology</th>
                                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-white/5">Session Time</th>
                                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-white/5">Verification</th>
                                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-white/5">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center font-black text-xs text-white shadow-inner">{log.student_name[0]}</div>
                                            <span className="text-white font-bold text-sm tracking-tight">{log.student_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-sm text-slate-400 font-medium font-mono">{log.date}</td>
                                    <td className="p-6 text-sm text-slate-400 font-medium font-mono">{log.time}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 min-w-[100px] h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${log.confidence * 100}%` }}
                                                    className="h-full bg-gradient-to-r from-primary-600 to-emerald-400"
                                                ></motion.div>
                                            </div>
                                            <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-1 rounded-md">{(log.confidence * 100).toFixed(0)}% Match</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <button className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-600">
                        <ClipboardList size={48} className="mb-4 opacity-10" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">Registry is empty for this cluster.</p>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <Layout page={page} setPage={setPage}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'live' && <LiveCamera />}
        {page === 'upload' && <BatchAttendance />}
        {page === 'manage' && <ManageStudents />}
        {page === 'logs' && <AttendanceLogs />}
    </Layout>
  );
}
