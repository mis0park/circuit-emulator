import React, { useState, useRef, useEffect } from 'react';
import { Activity, Battery, Zap, Triangle, Trash2, Plus, X } from 'lucide-react';
import Draggable from 'react-draggable';

// --- CONFIGURATION ---
const GRID_SIZE = 20; 

// --- COMPONENT BOX ---
const CircuitComponent = ({ data, updateValue, handleDrag, deleteComponent, onPortClick }) => {
  const nodeRef = useRef(null);
  
  const getIcon = () => {
    switch(data.type) {
      case 'Battery': return <Battery className="text-red-500" size={24} />;
      case 'Ground': return <Triangle className="text-green-600 fill-current" size={24} />;
      default: return <Activity className="text-blue-500" size={24} />;
    }
  };

  const width = data.type === 'Ground' ? 80 : 160;
  const height = 80;

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
        style={{ width, height }}
        onClick={(e) => e.stopPropagation()} // Prevent dropping a wire node when clicking component
        className="absolute bg-white border-2 border-slate-900 rounded-lg shadow-md hover:shadow-xl hover:border-blue-500 transition-all group z-20 flex items-center justify-center"
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
          className="no-drag absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform bg-white rounded-full border border-slate-200 shadow-sm"
          title="Left Port"
        >
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full hover:bg-blue-500" />
        </div>

        <div 
          onClick={(e) => { e.stopPropagation(); onPortClick(data.id, 'right'); }}
          className="no-drag absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform bg-white rounded-full border border-slate-200 shadow-sm"
          title="Right Port"
        >
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full hover:bg-blue-500" />
        </div>
      </div>
    </Draggable>
  );
};

// --- MAIN APP ---
const App = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [components, setComponents] = useState([
    { id: 1, type: 'Battery', value: 9, x: 60, y: 100, unit: 'V' },
    { id: 2, type: 'Resistor', value: 100, x: 300, y: 60, unit: 'Ω' },
    { id: 3, type: 'Resistor', value: 220, x: 300, y: 180, unit: 'Ω' },
    { id: 4, type: 'Ground', value: 0, x: 540, y: 120, unit: 'V' },
  ]);

  const [wires, setWires] = useState([]); 
  // drawingWire now holds a list of "waypoints" (corners) you've clicked
  const [drawingWire, setDrawingWire] = useState(null); 

  // --- ACTIONS ---
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

  // --- INTERACTIVE WIRING ENGINE ---

  // 1. Click Canvas -> Add Corner (Waypoint)
  const handleCanvasClick = (e) => {
    if (drawingWire) {
      // Don't add a point if we are hovering a port (let handlePortClick handle that)
      const isOverPort = e.target.getAttribute('title')?.includes('Port');
      if (isOverPort) return;

      // Add the current mouse position as a "Hard Corner"
      setDrawingWire({
        ...drawingWire,
        waypoints: [...drawingWire.waypoints, mousePos]
      });
    }
  };

  // 2. Click Port -> Start or Finish Wire
  const handlePortClick = (id, port) => {
    if (!drawingWire) {
      // START NEW WIRE
      setDrawingWire({ 
        sourceId: id, 
        sourcePort: port, 
        waypoints: [] // Start with no corners
      });
    } else {
      // FINISH WIRE
      if (drawingWire.sourceId !== id) {
        setWires([...wires, { 
          id: `w_${Date.now()}`, 
          source: drawingWire.sourceId, 
          sourcePort: drawingWire.sourcePort, 
          target: id,
          targetPort: port,
          waypoints: drawingWire.waypoints // Save the user's path
        }]);
      }
      setDrawingWire(null);
    }
  };

  // 3. Right Click -> Cancel Wire
  const handleRightClick = (e) => {
    e.preventDefault();
    setDrawingWire(null);
  };

  const handleMouseMove = (e) => {
    // Snap mouse to grid
    const snapX = Math.round((e.clientX - 80) / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(e.clientY / GRID_SIZE) * GRID_SIZE;
    setMousePos({ x: snapX, y: snapY }); 
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

  // --- MANUAL PATH GENERATOR ---
  // Connects Start -> Waypoint1 -> Waypoint2 -> ... -> End
  const generateManualPath = (start, end, waypoints) => {
    let d = `M ${start.x} ${start.y}`;
    
    // Draw lines to each waypoint
    waypoints.forEach(pt => {
      d += ` L ${pt.x} ${pt.y}`;
    });

    // Draw line to final destination
    d += ` L ${end.x} ${end.y}`;
    
    return d;
  };

  return (
    <div 
      className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900 select-none"
      onMouseMove={handleMouseMove}
      onClick={handleCanvasClick} // Listen for clicks on the background
      onContextMenu={handleRightClick} // Listen for Right Click to Cancel
    >
      
      {/* SIDEBAR */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-30 shadow-sm relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg mb-4"><Zap size={24} fill="currentColor" /></div>
        
        {['Resistor', 'Battery', 'Ground'].map(type => (
          <button key={type} onClick={() => addComponent(type)} className="group flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-all">
            <div className="w-10 h-10 border-2 border-slate-200 rounded-lg flex items-center justify-center bg-white group-hover:border-blue-400 group-hover:scale-110 transition-all">
              <Plus size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide">{type === 'Ground' ? 'GND' : type}</span>
          </button>
        ))}
        
        {/* Cancel Button (Visible when drawing) */}
        {drawingWire && (
          <div className="absolute bottom-10 flex flex-col items-center gap-2 animate-pulse">
            <div className="p-2 bg-red-100 text-red-500 rounded-full"><X size={20} /></div>
            <span className="text-[9px] font-bold text-red-500 text-center leading-tight">RIGHT CLICK<br/>TO CANCEL</span>
          </div>
        )}
      </div>

      {/* CANVAS */}
      <div 
        className="relative flex-grow"
        style={{
           // Darker, clearer grid dots
           backgroundImage: 'radial-gradient(#64748b 2px, transparent 2px)',
           backgroundSize: '20px 20px',
           backgroundPosition: '0 0'
        }}
      >
        
        {/* Wire Layer */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          <svg className="w-full h-full overflow-visible">
            
            {/* 1. SAVED WIRES */}
            {wires.map(wire => {
              const start = getPortPosition(wire.source, wire.sourcePort);
              const end = getPortPosition(wire.target, wire.targetPort);
              const path = generateManualPath(start, end, wire.waypoints || []);
              return <path key={wire.id} d={path} stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
            })}
            
            {/* 2. ACTIVE DRAWING WIRE */}
            {drawingWire && (() => {
              const start = getPortPosition(drawingWire.sourceId, drawingWire.sourcePort);
              // The "End" is currently the mouse cursor
              const path = generateManualPath(start, mousePos, drawingWire.waypoints);
              
              return (
                <g>
                   {/* Main Ghost Line */}
                   <path d={path} stroke="#3b82f6" strokeWidth="3" strokeDasharray="6,6" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-60" />
                   
                   {/* Draw Little Dots at Waypoints so you see where you clicked */}
                   {drawingWire.waypoints.map((pt, i) => (
                     <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />
                   ))}
                   
                   {/* Cursor Target */}
                   <circle cx={mousePos.x} cy={mousePos.y} r="4" fill="none" stroke="#3b82f6" strokeWidth="2" />
                </g>
              );
            })()}
          </svg>
        </div>

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

        <div className="absolute top-8 left-8 pointer-events-none opacity-40">
           <h1 className="text-3xl font-black text-slate-400 italic uppercase tracking-tighter">MISO<span className="text-blue-500">SIM</span></h1>
           <p className="text-[10px] font-mono text-slate-500 tracking-[0.2em] mt-1">
             {drawingWire ? "CLICK GRID TO ADD CORNER // R-CLICK CANCEL" : "CLICK PORT TO START WIRE"}
           </p>
        </div>
      </div>
    </div>
  );
};

export default App;