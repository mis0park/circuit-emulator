import React, { useState, useRef } from 'react';
import { Activity, Battery, Zap, Triangle, Trash2, Plus, X } from 'lucide-react';
import Draggable from 'react-draggable';

// --- CONFIGURATION ---
const GRID_SIZE = 20; 

const CircuitComponent = ({ data, updateValue, handleDrag, deleteComponent, onPortClick }) => {
  const nodeRef = useRef(null);
  
  const getIcon = () => {
    switch(data.type) {
      case 'Battery': return <Battery className="text-red-500" size={28} />;
      case 'Ground': return <Triangle className="text-green-600 fill-current" size={28} />;
      default: return <Activity className="text-blue-500" size={28} />;
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
        onClick={(e) => e.stopPropagation()}
        className="absolute bg-white border-2 border-slate-900 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-500 transition-all group z-20 flex items-center justify-center"
      >
        <button 
          onClick={(e) => { e.stopPropagation(); deleteComponent(data.id); }}
          className="no-drag absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-pointer shadow-sm hover:scale-110"
        >
          <Trash2 size={12} />
        </button>

        <div className="flex flex-col items-center justify-center gap-1 pointer-events-none w-full">
          {getIcon()}
          {data.type !== 'Ground' && (
            <div className="flex items-center gap-1 font-mono font-bold text-xs pointer-events-auto">
              <input 
                type="number" 
                className="w-12 bg-transparent border-none p-0 text-center focus:ring-0 outline-none no-drag font-bold text-slate-700"
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
          className="no-drag absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rounded-full border border-white hover:bg-blue-500 cursor-crosshair transition-colors z-30"
          title="Left Port"
        />
        <div 
          onClick={(e) => { e.stopPropagation(); onPortClick(data.id, 'right'); }}
          className="no-drag absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rounded-full border border-white hover:bg-blue-500 cursor-crosshair transition-colors z-30"
          title="Right Port"
        />
      </div>
    </Draggable>
  );
};

const App = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [components, setComponents] = useState([
    { id: 1, type: 'Battery', value: 9, x: 40, y: 100, unit: 'V' }, 
    { id: 2, type: 'Resistor', value: 100, x: 240, y: 80, unit: 'Ω' },
    { id: 3, type: 'Resistor', value: 220, x: 240, y: 200, unit: 'Ω' },
    { id: 4, type: 'Ground', value: 0, x: 480, y: 140, unit: 'V' },
  ]);

  const [wires, setWires] = useState([]); 
  const [drawingWire, setDrawingWire] = useState(null); 

  const addComponent = (type) => {
    const newId = Math.max(...components.map(c => c.id), 0) + 1;
    setComponents([...components, { 
      id: newId, 
      type, 
      value: type === 'Resistor' ? 100 : 0, 
      x: 100, 
      y: 100, 
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

  const handleCanvasClick = (e) => {
    if (drawingWire) {
      const isOverPort = e.target.getAttribute('title')?.includes('Port');
      if (isOverPort) return;
      
      // When user manually clicks, we pin the corner there.
      // But we prefer "L-Shape" cornering to keep lines straight
      const lastPoint = drawingWire.waypoints.length > 0 
        ? drawingWire.waypoints[drawingWire.waypoints.length - 1] 
        : getPortPosition(drawingWire.sourceId, drawingWire.sourcePort);
        
      const elbowPoint = { x: mousePos.x, y: lastPoint.y };

      // If this is the FIRST click, and we want to preserve the "Manhattan" look
      // we might want to push the first point out a bit (Stub).
      // But for simple "Click-to-Corner", just adding the elbow + mousePos is usually best.
      setDrawingWire({
        ...drawingWire,
        waypoints: [...drawingWire.waypoints, elbowPoint, mousePos]
      });
    }
  };

  const handlePortClick = (id, port) => {
    if (!drawingWire) {
      setDrawingWire({ sourceId: id, sourcePort: port, waypoints: [] });
    } else {
      if (drawingWire.sourceId !== id) {
        
        // Finalize: Calculate last segment
        const lastPoint = drawingWire.waypoints.length > 0 
          ? drawingWire.waypoints[drawingWire.waypoints.length - 1] 
          : getPortPosition(drawingWire.sourceId, drawingWire.sourcePort);
          
        const targetPos = getPortPosition(id, port);
        
        // Auto-complete the path with an elbow
        const finalWaypoints = [...drawingWire.waypoints];
        
        // If we have manual waypoints, just close the gap
        // If we have NO waypoints (Direct connection), use the Auto-Manhattan logic
        if (drawingWire.waypoints.length === 0) {
            // "Ghost" becomes permanent
            // We don't need to store points, just ID/Ports. 
            // The Renderer will handle the "Auto Manhattan" logic if waypoints is empty.
        } else {
             // Add final elbow to snap to port
             finalWaypoints.push({ x: targetPos.x, y: lastPoint.y });
        }

        setWires([...wires, { 
          id: `w_${Date.now()}`, 
          source: drawingWire.sourceId, 
          sourcePort: drawingWire.sourcePort, 
          target: id,
          targetPort: port,
          waypoints: finalWaypoints 
        }]);
      }
      setDrawingWire(null);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setDrawingWire(null);
  };

  const handleMouseMove = (e) => {
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

  // --- THE HYBRID RENDERER ---

  // 1. Logic for "Smart Manhattan" (Auto-Routing)
  const calculateManhattanPath = (start, end, sourcePort) => {
     const STUB = 20;
     const startStubX = sourcePort === 'right' ? start.x + STUB : start.x - STUB;
     
     // Simple Midpoint Logic
     const midX = (startStubX + end.x) / 2;
     
     return `M ${start.x} ${start.y} 
             L ${startStubX} ${start.y} 
             L ${midX} ${start.y} 
             L ${midX} ${end.y} 
             L ${end.x} ${end.y}`;
  };

  // 2. Logic for "Manual Waypoints"
  const calculateManualPath = (start, end, waypoints) => {
    let d = `M ${start.x} ${start.y}`;
    waypoints.forEach(pt => d += ` L ${pt.x} ${pt.y}`);
    d += ` L ${end.x} ${end.y}`;
    return d;
  };

  // 3. Main Path Generator (Decides which to use)
  const getPath = (start, end, sourcePort, waypoints) => {
    // If no manual waypoints exist, use Smart Manhattan
    if (!waypoints || waypoints.length === 0) {
        return calculateManhattanPath(start, end, sourcePort);
    }
    // Otherwise, follow the user's clicks exactly
    return calculateManualPath(start, end, waypoints);
  };
  
  // 4. Ghost Preview (Hybrid)
  const getPreviewPath = (start, mouse, sourcePort, waypoints) => {
    if (waypoints.length === 0) {
        // Mode A: Smart Auto-Preview
        return calculateManhattanPath(start, mouse, sourcePort);
    } else {
        // Mode B: Manual Extension (Elbow from last click)
        const lastPoint = waypoints[waypoints.length - 1];
        let d = `M ${start.x} ${start.y}`;
        waypoints.forEach(pt => d += ` L ${pt.x} ${pt.y}`);
        // Elbow logic: Horizontal to Mouse X -> Vertical to Mouse Y
        d += ` L ${mouse.x} ${lastPoint.y} L ${mouse.x} ${mouse.y}`;
        return d;
    }
  };

  return (
    <div 
      className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900 select-none"
      onMouseMove={handleMouseMove}
      onClick={handleCanvasClick}
      onContextMenu={handleRightClick}
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
           backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)',
           backgroundSize: '20px 20px',
           backgroundPosition: '0 0'
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          <svg className="w-full h-full overflow-visible">
            
            {/* SAVED WIRES */}
            {wires.map(wire => {
              const start = getPortPosition(wire.source, wire.sourcePort);
              const end = getPortPosition(wire.target, wire.targetPort);
              const path = getPath(start, end, wire.sourcePort, wire.waypoints);
              return <path key={wire.id} d={path} stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
            })}
            
            {/* GHOST WIRE */}
            {drawingWire && (() => {
              const start = getPortPosition(drawingWire.sourceId, drawingWire.sourcePort);
              const path = getPreviewPath(start, mousePos, drawingWire.sourcePort, drawingWire.waypoints);
              return (
                <g>
                   <path d={path} stroke="#3b82f6" strokeWidth="3" strokeDasharray="6,6" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-60" />
                   {drawingWire.waypoints.map((pt, i) => (
                     <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />
                   ))}
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
           <p className="text-[10px] font-mono text-slate-500 tracking-[0.2em] mt-1">GRID: 20px // ROUTING: HYBRID</p>
        </div>
      </div>
    </div>
  );
};

export default App;