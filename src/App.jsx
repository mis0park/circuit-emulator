import React, { useState, useRef } from 'react';
import { Activity, Battery, Zap, Triangle, Trash2, Plus } from 'lucide-react';
import Draggable from 'react-draggable';

// --- CONFIGURATION ---
// 1. Denser Grid: 20px instead of 40px
const GRID_SIZE = 20; 

const CircuitComponent = ({ data, updateValue, handleDrag, deleteComponent, onPortClick }) => {
  const nodeRef = useRef(null);
  
  const getIcon = () => {
    switch(data.type) {
      case 'Battery': return <Battery className="text-red-500" size={24} />;
      case 'Ground': return <Triangle className="text-green-600 fill-current" size={24} />;
      default: return <Activity className="text-blue-500" size={24} />;
    }
  };

  // Dimensions must be multiples of 20 (GRID_SIZE)
  // Standard: 160px (8 cells) x 80px (4 cells)
  // Ground: 80px (4 cells) x 80px (4 cells)
  const isGround = data.type === 'Ground';
  const widthClass = isGround ? 'w-20' : 'w-40'; 
  const heightClass = 'h-20'; 

  return (
    <Draggable 
      nodeRef={nodeRef} 
      grid={[GRID_SIZE, GRID_SIZE]} 
      bounds="parent" 
      position={{x: data.x, y: data.y}} 
      onDrag={(e, ui) => handleDrag(data.id, ui.x, ui.y)}
      cancel=".no-drag"
    >
      <div 
        ref={nodeRef}
        className={`absolute bg-white border-2 border-slate-900 rounded-lg shadow-md hover:shadow-xl hover:border-blue-500 transition-all group z-10 flex items-center justify-center
        ${widthClass} ${heightClass}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); deleteComponent(data.id); }}
          className="no-drag absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 z-50 cursor-pointer"
        >
          <Trash2 size={10} />
        </button>

        <div className="flex flex-col items-center justify-center gap-1 pointer-events-none w-full">
          {getIcon()}
          {data.type !== 'Ground' && (
            <div className="flex items-center gap-1 font-mono font-bold text-xs pointer-events-auto">
              <input 
                type="number" 
                className="w-12 bg-transparent border-none p-0 text-center focus:ring-0 outline-none no-drag"
                value={data.value}
                onChange={(e) => updateValue(data.id, e.target.value)}
              />
              <span className="text-slate-400">{data.unit}</span>
            </div>
          )}
        </div>
        
        {/* PORTS */}
        <div 
          onClick={(e) => { e.stopPropagation(); onPortClick(data.id, 'left'); }}
          className="no-drag absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform"
          title="Left Port"
        >
          <div className="w-3 h-3 bg-slate-900 rounded-full border-2 border-white hover:bg-blue-500" />
        </div>

        <div 
          onClick={(e) => { e.stopPropagation(); onPortClick(data.id, 'right'); }}
          className="no-drag absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform"
          title="Right Port"
        >
          <div className="w-3 h-3 bg-slate-900 rounded-full border-2 border-white hover:bg-blue-500" />
        </div>
      </div>
    </Draggable>
  );
};

const App = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [components, setComponents] = useState([
    { id: 1, type: 'Battery', value: 9, x: 60, y: 100, unit: 'V' }, // Aligned to 20px grid
    { id: 2, type: 'Resistor', value: 100, x: 300, y: 60, unit: 'Ω' },
    { id: 3, type: 'Resistor', value: 220, x: 300, y: 180, unit: 'Ω' },
    { id: 4, type: 'Ground', value: 0, x: 540, y: 120, unit: 'V' },
  ]);

  const [wires, setWires] = useState([]); 
  const [drawingWire, setDrawingWire] = useState(null); 

  const addComponent = (type) => {
    const newId = Math.max(...components.map(c => c.id), 0) + 1;
    setComponents([...components, { 
      id: newId, 
      type, 
      value: type === 'Resistor' ? 100 : 0, 
      x: 140, 
      y: 140, 
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
      const snapX = Math.round((e.clientX - 80) / GRID_SIZE) * GRID_SIZE;
      const snapY = Math.round(e.clientY / GRID_SIZE) * GRID_SIZE;
      setMousePos({ x: snapX, y: snapY }); 
    }
  };

  const getPortPosition = (id, side) => {
    const comp = components.find(c => c.id === id);
    if (!comp) return { x: 0, y: 0 };
    const isGround = comp.type === 'Ground';
    const width = isGround ? 80 : 160; 
    const height = 80; 
    return { 
      x: side === 'right' ? (comp.x + width) : comp.x, 
      y: comp.y + (height / 2) 
    };
  };

  // --- AGGRESSIVE ROUTER (Fixes the "It Doesn't" issue) ---
  const generatePath = (start, end, sourcePort, targetPort) => {
    const STUB = 20; // Short stub for the denser grid
    
    let startStubX = sourcePort === 'right' ? start.x + STUB : start.x - STUB;
    let endStubX = targetPort === 'right' ? end.x + STUB : end.x - STUB;

    let midX;
    
    // Check if we are doing a "U-Turn" (Connecting same sides)
    const isSameSide = sourcePort === targetPort;
    const isCloseX = Math.abs(start.x - end.x) < 100; // Components are roughly in the same column

    if (isSameSide && isCloseX) {
        // AGGRESSIVE PUSH: Force the wire 60px out to clear the components
        const pushDir = sourcePort === 'right' ? 1 : -1;
        const pushDistance = 60; 
        
        // Find the "outermost" point and add the push distance
        if (sourcePort === 'right') {
            midX = Math.max(start.x, end.x) + 160 + pushDistance; // Clear the whole component width
        } else {
            midX = Math.min(start.x, end.x) - pushDistance;
        }
    } else {
        // Standard split (normal behavior)
        midX = (startStubX + endStubX) / 2;
    }

    return `M ${start.x} ${start.y} 
            L ${startStubX} ${start.y} 
            L ${midX} ${start.y} 
            L ${midX} ${end.y} 
            L ${endStubX} ${end.y} 
            L ${end.x} ${end.y}`;
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900" onMouseMove={handleMouseMove}>
      
      {/* SIDEBAR */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-20 shadow-sm">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg mb-4"><Zap size={24} fill="currentColor" /></div>
        
        {['Resistor', 'Battery', 'Ground'].map(type => (
          <button key={type} onClick={() => addComponent(type)} className="group flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-all">
            <div className="w-10 h-10 border-2 border-slate-200 rounded-lg flex items-center justify-center bg-white group-hover:border-blue-400 group-hover:scale-110 transition-all">
              <Plus size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide">{type === 'Ground' ? 'GND' : type}</span>
          </button>
        ))}
      </div>

      {/* CANVAS: 20px Grid Size */}
      <div className="relative flex-grow bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:20px_20px] [background-position:0px_0px]">
        
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {wires.map(wire => {
            const start = getPortPosition(wire.source, wire.sourcePort);
            const end = getPortPosition(wire.target, wire.targetPort);
            return <path key={wire.id} d={generatePath(start, end, wire.sourcePort, wire.targetPort)} stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
          })}
          
          {drawingWire && (() => {
            const start = getPortPosition(drawingWire.sourceId, drawingWire.sourcePort);
            const targetPort = mousePos.x > start.x ? 'left' : 'right';
            return <path d={generatePath(start, mousePos, drawingWire.sourcePort, targetPort)} stroke="#94a3b8" strokeWidth="3" strokeDasharray="6,6" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
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

        <div className="absolute top-8 left-8 pointer-events-none opacity-50">
           <h1 className="text-3xl font-black text-slate-300 italic uppercase tracking-tighter">MISO<span className="text-blue-400">SIM</span></h1>
           <p className="text-[10px] font-mono text-slate-400 tracking-[0.2em] mt-1">DENSITY: HIGH // 20px</p>
        </div>
      </div>
    </div>
  );
};

export default App;