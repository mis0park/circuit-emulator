import React, { useState, useRef } from 'react';
import { Activity, Battery, Zap, Settings, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import Draggable from 'react-draggable';

// --- COMPONENT BOX (Now reports position!) ---
const CircuitComponent = ({ data, updateValue, handleDrag }) => {
  const nodeRef = useRef(null);

  return (
    <Draggable 
      nodeRef={nodeRef} 
      grid={[20, 20]} 
      bounds="parent" 
      position={{x: data.x, y: data.y}} // FORCE position from state
      onDrag={(e, ui) => handleDrag(data.id, ui.x, ui.y)} // Tell App where we are
    >
      <div 
        ref={nodeRef}
        className="absolute p-4 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] cursor-grab active:cursor-grabbing hover:border-blue-500 transition-colors group w-40 z-10"
      >
        <div className="flex items-center gap-3">
          {data.type === 'Battery' ? <Battery className="text-red-500" size={20} /> : <Activity className="text-blue-500" size={20} />}
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
        </div>
        {/* Connector Nodes (Visual Only) */}
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
    { id: 1, type: 'Resistor', value: 100, x: 400, y: 100, unit: 'Ω' },
    { id: 2, type: 'Battery', value: 9, x: 100, y: 300, unit: 'V' },
  ]);

  // Update numbers (Resistance/Voltage)
  const updateValue = (id, newValue) => {
    setComponents(components.map(c => c.id === id ? { ...c, value: parseFloat(newValue) || 0 } : c));
  };

  // Update position (X/Y coordinates)
  const handleDrag = (id, x, y) => {
    setComponents(components.map(c => c.id === id ? { ...c, x, y } : c));
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8 z-20 shadow-sm">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg"><Zap size={24} fill="currentColor" /></div>
        <div className="h-[1px] w-10 bg-slate-200" />
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors">
          <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center"><Plus size={20} /></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Add</span>
        </button>
      </div>

      {/* CANVAS */}
      <div className="relative flex-grow bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px]">
        <div className="absolute top-8 left-8 pointer-events-none">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 italic uppercase">MISO<span className="text-blue-600 font-sans">CIRCUITS</span></h1>
          <p className="text-[10px] font-mono text-slate-400 tracking-[0.2em]">SYSTEM_STATUS: CONNECTED</p>
        </div>

        {/* --- WIRE LAYER --- */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <line 
            // START: Right side of Battery (Component 2)
            // We use components[1] because that's the Battery in your list
            x1={components[1].x + 160} 
            y1={components[1].y + 40} 
            
            // END: Left side of Resistor (Component 1)
            // We use components[0] because that's the Resistor
            x2={components[0].x} 
            y2={components[0].y + 40} 
            
            stroke="#3b82f6" 
            strokeWidth="4" 
          />
        </svg>
        
        {components.map((comp) => (
          <CircuitComponent key={comp.id} data={comp} updateValue={updateValue} handleDrag={handleDrag} />
        ))}
      </div>

      {/* MATH SLIDE-OUT */}
      <button onClick={() => setShowMath(!showMath)} className="absolute bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl hover:scale-105 transition-all z-50 font-bold">
        {showMath ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
        {showMath ? "Hide Solver" : "Want to see the Math?"}
      </button>

      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl border-l border-slate-200 transition-all duration-500 ${showMath ? 'w-[450px]' : 'w-0'} overflow-hidden z-40`}>
        <div className="p-10 w-[450px]">
          <div className="flex items-center gap-3 mb-8 font-sans">
            <div className="p-2 bg-blue-100 rounded-lg"><Settings className="text-blue-600" size={20} /></div>
            <h2 className="text-xl font-bold italic tracking-tight uppercase">Matrix Analysis</h2>
          </div>
          <div className="space-y-8 font-sans">
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Admittance Matrix (G)</h3>
              <div className="bg-slate-900 text-blue-400 p-6 rounded-2xl font-mono text-sm shadow-inner overflow-x-auto whitespace-nowrap">
                [ {(1/components[0].value).toFixed(4)}  -{(1/components[0].value).toFixed(4)} ] <br/>
                [ -{(1/components[0].value).toFixed(4)}  {(1/components[0].value).toFixed(4)} ]
              </div>
            </section>
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Constant Vector (b)</h3>
              <div className="bg-slate-100 p-6 rounded-2xl font-mono text-sm border border-slate-200 whitespace-nowrap">
                [ {components[1].value}V ] <br/>
                [ 0 ]
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;