import React, { useState, useRef } from 'react';
import { Activity, Battery, Zap, Settings, ChevronRight, ChevronLeft, Plus, Triangle, Trash2 } from 'lucide-react';
import Draggable from 'react-draggable';

// --- COMPONENT BOX ---
const CircuitComponent = ({ data, updateValue, handleDrag, deleteComponent }) => {
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
        className={`absolute bg-white border-2 border-slate-900 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:border-blue-500 transition-colors group z-10 
        ${data.type === 'Ground' ? 'w-24 h-24 flex justify-center items-center' : 'w-40 p-4'}`}
      >
        {/* Delete Button (Only shows on hover) */}
        <button 
          onClick={(e) => { e.stopPropagation(); deleteComponent(data.id); }}
          className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
        >
          <Trash2 size={12} />
        </button>

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
        
        {/* Ports */}
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
    { id: 1, type: 'Resistor', value: 100, x: 350, y: 100, unit: 'Ω' },
    { id: 2, type: 'Battery', value: 9, x: 50, y: 100, unit: 'V' },
    { id: 3, type: 'Ground', value: 0, x: 600, y: 150, unit: 'V' },
  ]);

  const [wires, setWires] = useState([
    { id: 'w1', source: 2, target: 1 },
    { id: 'w2', source: 1, target: 3 },
  ]);

  // --- ACTIONS ---
  
  // 1. Add New Component
  const addComponent = (type) => {
    const newId = Math.max(...components.map(c => c.id), 0) + 1;
    // Offset slightly so they don't stack perfectly
    const offset = components.length * 20; 
    const newComp = { 
      id: newId, 
      type: type, 
      value: type === 'Resistor' ? 100 : 0, 
      x: 100 + offset, 
      y: 100 + offset, 
      unit: type === 'Resistor' ? 'Ω' : 'V' 
    };
    setComponents([...components, newComp]);
  };

  // 2. Delete Component (and its wires!)
  const deleteComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
    setWires(wires.filter(w => w.source !== id && w.target !== id));
  };

  const updateValue = (id, newValue) => {
    setComponents(components.map(c => c.id === id ? { ...c, value: parseFloat(newValue) || 0 } : c));
  };

  const handleDrag = (id, x, y) => {
    setComponents(components.map(c => c.id === id ? { ...c, x, y } : c));
  };

  // Geometry Helper
  const getPortPosition = (id, isSource) => {
    const comp = components.find(c => c.id === id);
    if (!comp) return { x: 0, y: 0 };
    const isGround = comp.type === 'Ground';
    const width = isGround ? 96 : 160; 
    const height = isGround ? 96 : 80;
    return { 
      x: isSource ? (comp.x + width) : comp.x, 
      y: comp.y + (height / 2) 
    };
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR UI */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-6 z-20 shadow-sm">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg mb-4"><Zap size={24} fill="currentColor" /></div>
        
        {/* Component Buttons */}
        <button onClick={() => addComponent('Resistor')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 hover:scale-105 transition-all">
          <div className="w-10 h-10 border-2 border-slate-200 rounded-lg flex items-center justify-center bg-white"><Activity size={18} /></div>
          <span className="text-[9px] font-bold uppercase">Resistor</span>
        </button>

        <button onClick={() => addComponent('Battery')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 hover:scale-105 transition-all">
          <div className="w-10 h-10 border-2 border-slate-200 rounded-lg flex items-center justify-center bg-white"><Battery size={18} /></div>
          <span className="text-[9px] font-bold uppercase">Battery</span>
        </button>

        <button onClick={() => addComponent('Ground')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-green-600 hover:scale-105 transition-all">
          <div className="w-10 h-10 border-2 border-slate-200 rounded-lg flex items-center justify-center bg-white"><Triangle size={18} /></div>
          <span className="text-[9px] font-bold uppercase">GND</span>
        </button>
      </div>

      {/* CANVAS */}
      <div className="relative flex-grow bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px]">
        {/* Wire Layer */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {wires.map(wire => {
            const start = getPortPosition(wire.source, true);
            const end = getPortPosition(wire.target, false);
            return <line key={wire.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#3b82f6" strokeWidth="4" />;
          })}
        </svg>

        {components.map((comp) => (
          <CircuitComponent key={comp.id} data={comp} updateValue={updateValue} handleDrag={handleDrag} deleteComponent={deleteComponent} />
        ))}
      </div>

      {/* MATH SIDEBAR (Simplified for now) */}
      <button onClick={() => setShowMath(!showMath)} className="absolute bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl hover:scale-105 transition-all z-50 font-bold">
        {showMath ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
        {showMath ? "Hide Solver" : "Want to see the Math?"}
      </button>

      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl border-l border-slate-200 transition-all duration-500 ${showMath ? 'w-[450px]' : 'w-0'} overflow-hidden z-40`}>
        <div className="p-10 w-[450px]">
          <h2 className="text-xl font-bold italic tracking-tight uppercase mb-8">System Stats</h2>
          <div className="space-y-6 font-mono text-sm">
            <div className="bg-slate-100 p-4 rounded-xl">
              <div className="text-slate-500 mb-2 uppercase text-xs font-bold">Total Components</div>
              <div className="text-2xl font-bold">{components.length}</div>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl">
              <div className="text-slate-500 mb-2 uppercase text-xs font-bold">Active Wires</div>
              <div className="text-2xl font-bold text-blue-600">{wires.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;