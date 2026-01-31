import React, { useState, useRef } from 'react';
import { Activity, Battery, Zap, Settings, ChevronRight, ChevronLeft, Plus, Triangle, Trash2 } from 'lucide-react';
import Draggable from 'react-draggable';

// --- COMPONENT BOX ---
const CircuitComponent = ({ data, updateValue, handleDrag, deleteComponent, onPortClick }) => {
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
      cancel=".no-drag"
    >
      <div 
        ref={nodeRef}
        className={`absolute bg-white border-2 border-slate-900 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:border-blue-500 transition-colors group z-10 
        ${data.type === 'Ground' ? 'w-24 h-24 flex justify-center items-center' : 'w-40 p-4'}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); deleteComponent(data.id); }}
          className="no-drag absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 z-50 cursor-pointer"
        >
          <Trash2 size={12} />
        </button>

        <div className="flex items-center gap-3 pointer-events-none">
          {getIcon()}
          {data.type !== 'Ground' && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">{data.type}</div>
              <div className="flex items-center gap-1 font-mono font-bold pointer-events-auto">
                <input 
                  type="number" 
                  className="w-16 bg-transparent border-none p-0 focus:ring-0 text-lg outline-none no-drag"
                  value={data.value}
                  onChange={(e) => updateValue(data.id, e.target.value)}
                />
                <span>{data.unit}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* INTERACTIVE PORTS */}
        <div 
          onClick={(e) => { e.stopPropagation(); onPortClick(data.id, 'left'); }}
          className="no-drag absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform"
          title="Left Port"
        >
          <div className="w-4 h-4 bg-slate-900 rounded-full border-2 border-white hover:bg-blue-500" />
        </div>

        <div 
          onClick={(e) => { e.stopPropagation(); onPortClick(data.id, 'right'); }}
          className="no-drag absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform"
          title="Right Port"
        >
          <div className="w-4 h-4 bg-slate-900 rounded-full border-2 border-white hover:bg-blue-500" />
        </div>
      </div>
    </Draggable>
  );
};

// --- MAIN APP ---
const App = () => {
  const [showMath, setShowMath] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [components, setComponents] = useState([
    { id: 1, type: 'Resistor', value: 100, x: 300, y: 100, unit: 'Ω' },
    { id: 2, type: 'Battery', value: 9, x: 50, y: 250, unit: 'V' },
    { id: 3, type: 'Ground', value: 0, x: 550, y: 250, unit: 'V' },
  ]);

  const [wires, setWires] = useState([]); 
  const [drawingWire, setDrawingWire] = useState(null); 

  // --- ACTIONS ---
  const addComponent = (type) => {
    const newId = Math.max(...components.map(c => c.id), 0) + 1;
    const offset = components.length * 20; 
    setComponents([...components, { 
      id: newId, 
      type, 
      value: type === 'Resistor' ? 100 : 0, 
      x: 100 + offset, 
      y: 100 + offset, 
      unit: type === 'Resistor' ? 'Ω' : 'V' 
    }]);
  };

  const deleteComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
    setWires(wires.filter(w => w.source !== id && w.target !== id));
  };

  const updateValue = (id, v) => {
    setComponents(components.map(c => c.id === id ? { ...c, value: parseFloat(v) || 0 } : c));
  };

  const handleDrag = (id, x, y) => {
    setComponents(components.map(c => c.id === id ? { ...c, x, y } : c));
  };

  const handlePortClick = (id, port) => {
    if (!drawingWire) {
      setDrawingWire({ sourceId: id, sourcePort: port });
    } else {
      if (drawingWire.sourceId !== id) {
        setWires([...wires, { 
          id: `w_${Date.now()}`, 
          source: drawingWire.sourceId, 
          sourcePort: drawingWire.sourcePort, 
          target: id,
          targetPort: port 
        }]);
      }
      setDrawingWire(null);
    }
  };

  const handleMouseMove = (e) => {
    if (drawingWire) {
      setMousePos({ x: e.clientX - 80, y: e.clientY }); 
    }
  };

  const getPortPosition = (id, side) => {
    const comp = components.find(c => c.id === id);
    if (!comp) return { x: 0, y: 0 };
    const isGround = comp.type === 'Ground';
    const width = isGround ? 96 : 160; 
    const height = isGround ? 96 : 80;
    return { 
      x: side === 'right' ? (comp.x + width) : comp.x, 
      y: comp.y + (height / 2) 
    };
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900" onMouseMove={handleMouseMove}>
      
      {/* SIDEBAR */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-6 z-20 shadow-sm">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg mb-4"><Zap size={24} fill="currentColor" /></div>
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
        
        {/* --- WIRE LAYER --- */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          
          {/* PERMANENT WIRES (Now STEPPED) */}
          {wires.map(wire => {
            const start = getPortPosition(wire.source, wire.sourcePort);
            const end = getPortPosition(wire.target, wire.targetPort);
            
            // --- MANHATTAN ROUTING LOGIC ---
            // 1. Calculate the middle X point between start and end
            const midX = (start.x + end.x) / 2;

            // 2. Create the path: 
            // Move to Start -> Horizontal to Mid -> Vertical to End Height -> Horizontal to End
            const pathData = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;

            return <path key={wire.id} d={pathData} stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
          })}

          {/* GHOST WIRE (Also STEPPED) */}
          {drawingWire && (() => {
            const start = getPortPosition(drawingWire.sourceId, drawingWire.sourcePort);
            const midX = (start.x + mousePos.x) / 2;
            const pathData = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${mousePos.y} L ${mousePos.x} ${mousePos.y}`;

            return <path d={pathData} stroke="#cbd5e1" strokeWidth="4" strokeDasharray="10,10" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
          })()}
        </svg>

        {components.map((comp) => (
          <CircuitComponent 
            key={comp.id} 
            data={comp} 
            updateValue={updateValue} 
            handleDrag={handleDrag} 
            deleteComponent={deleteComponent} 
            onPortClick={handlePortClick} 
          />
        ))}

        <div className="absolute top-8 left-8 pointer-events-none">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 italic uppercase">MISO<span className="text-blue-600 font-sans">CIRCUITS</span></h1>
          <p className="text-[10px] font-mono text-slate-400 tracking-[0.2em] mt-1">
            WIRES: {wires.length} // TYPE: ORTHOGONAL
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;