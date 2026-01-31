import React, { useState, useRef } from 'react';
import { Activity, Battery, Zap, Settings, ChevronRight, ChevronLeft, Plus, Triangle } from 'lucide-react';
import Draggable from 'react-draggable';

// --- COMPONENT BOX ---
const CircuitComponent = ({ data, updateValue, handleDrag }) => {
  const nodeRef = useRef(null);
  
  const getIcon = () => {
    switch(data.type) {
      case 'Battery': return <Battery className="text-red-500" size={20} />;
      case 'Ground': return <Triangle className="text-green-600 fill-current" size={20} />;
      default: return <Activity className="text-blue-500" size={20} />;
    }
  };

  return (
    <Draggable 
      nodeRef={nodeRef} 
      grid={[20, 20]} 
      bounds="parent" 
      position={{x: data.x, y: data.y}} 
      onDrag={(e, ui) => handleDrag(data.id, ui.x, ui.y)}
    >
      <div 
        ref={nodeRef}
        // NOTE: We check type to apply different CSS Width/Height classes
        className={`absolute bg-white border-2 border-slate-900 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:border-blue-500 transition-colors group z-10 
        ${data.type === 'Ground' 
          ? 'w-24 h-24 flex justify-center items-center' // Ground is 96x96px (centered)
          : 'w-40 p-4' // Standard is 160px wide (padding determines height)
        }`}
      >
        <div className="flex items-center gap-3">
          {getIcon()}
          {data.type !== 'Ground' && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">{data.type}</div>
              <div className="flex items-center gap-1 font-mono font-bold">
                <input 
                  type="number" 
                  className="w-16 bg-transparent border-none p-0 focus:ring-0 text-lg outline-none"
                  value={data.value}
                  onChange={(e) => updateValue(data.id, e.target.value)}
                />
                <span>{data.unit}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Visual Connector Ports - Perfectly Centered */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 rounded-full border-2 border-white" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 rounded-full border-2 border-white" />
      </div>
    </Draggable>
  );
};

// --- MAIN APP ---
const App = () => {
  const [showMath, setShowMath] = useState(false);
  
  const [components, setComponents] = useState([
    { id: 1, type: 'Resistor', value: 84, x: 350, y: 100, unit: 'Ω' },
    { id: 2, type: 'Battery', value: 9, x: 50, y: 100, unit: 'V' },
    { id: 3, type: 'Ground', value: 0, x: 600, y: 150, unit: 'V' },
  ]);

  const [wires, setWires] = useState([
    { id: 'w1', source: 2, target: 1 },
    { id: 'w2', source: 1, target: 3 },
  ]);

  const updateValue = (id, newValue) => {
    setComponents(components.map(c => c.id === id ? { ...c, value: parseFloat(newValue) || 0 } : c));
  };

  const handleDrag = (id, x, y) => {
    setComponents(components.map(c => c.id === id ? { ...c, x, y } : c));
  };

  // --- NEW GEOMETRY ENGINE ---
  // Calculates the exact "Port" locations based on component type
  const getPortPosition = (id, isSource) => {
    const comp = components.find(c => c.id === id);
    if (!comp) return { x: 0, y: 0 };

    // 1. Define dimensions based on type (matches CSS classes)
    const isGround = comp.type === 'Ground';
    const width = isGround ? 96 : 160; // w-24 vs w-40
    const height = isGround ? 96 : 80; // h-24 vs approx standard height
    
    // 2. Calculate Vertical Center (Y)
    // The visual port is always at "top-1/2", so strictly Height / 2
    const centerY = comp.y + (height / 2);

    // 3. Calculate Horizontal Side (X)
    // If it's a Source (Start), we use Right Side (x + width)
    // If it's a Target (End), we use Left Side (x)
    // (Note: This is a simple Left-to-Right flow assumption)
    const portX = isSource ? (comp.x + width) : comp.x;

    return { x: portX, y: centerY };
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR UI */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8 z-20 shadow-sm">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg"><Zap size={24} fill="currentColor" /></div>
        <div className="h-[1px] w-10 bg-slate-200" />
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500">
          <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center"><Plus size={20} /></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Add</span>
        </button>
      </div>

      {/* CANVAS */}
      <div className="relative flex-grow bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px]">
        <div className="absolute top-8 left-8 pointer-events-none">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 italic uppercase">MISO<span className="text-blue-600 font-sans">CIRCUITS</span></h1>
          <p className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">NETLIST_SIZE: {wires.length} CONNECTIONS</p>
        </div>

        {/* --- WIRE LAYER --- */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {wires.map(wire => {
            // We now ask specifically for Source vs Target coordinates
            const start = getPortPosition(wire.source, true);  // true = Right Side
            const end = getPortPosition(wire.target, false); // false = Left Side
            
            return (
              <line 
                key={wire.id}
                x1={start.x} 
                y1={start.y} 
                x2={end.x} 
                y2={end.y} 
                stroke="#3b82f6" 
                strokeWidth="4" 
              />
            );
          })}
        </svg>

        {components.map((comp) => (
          <CircuitComponent key={comp.id} data={comp} updateValue={updateValue} handleDrag={handleDrag} />
        ))}
      </div>

      {/* MATH SIDEBAR */}
      <button onClick={() => setShowMath(!showMath)} className="absolute bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl hover:scale-105 transition-all z-50 font-bold">
        {showMath ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
        {showMath ? "Hide Solver" : "Want to see the Math?"}
      </button>

      {/* MATH PANEL */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl border-l border-slate-200 transition-all duration-500 ${showMath ? 'w-[450px]' : 'w-0'} overflow-hidden z-40`}>
        <div className="p-10 w-[450px]">
          <div className="flex items-center gap-3 mb-8 font-sans">
            <div className="p-2 bg-blue-100 rounded-lg"><Settings className="text-blue-600" size={20} /></div>
            <h2 className="text-xl font-bold italic tracking-tight uppercase">Matrix Analysis</h2>
          </div>
          <div className="space-y-8 font-sans">
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Netlist (Graph Edges)</h3>
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-600">
                {wires.map(w => (
                  <div key={w.id}>Node {w.source} → Node {w.target}</div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Admittance Matrix (G)</h3>
              <div className="bg-slate-900 text-blue-400 p-6 rounded-2xl font-mono text-sm shadow-inner overflow-x-auto whitespace-nowrap">
                [ {(1/components[0].value).toFixed(4)}  -{(1/components[0].value).toFixed(4)} ] <br/>
                [ -{(1/components[0].value).toFixed(4)}  {(1/components[0].value).toFixed(4)} ]
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;