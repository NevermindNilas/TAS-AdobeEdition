import React, { useState, useRef, useEffect, useCallback } from "react";
import { Flex, View, Button, Text, Heading, TextField, Tooltip, TooltipTrigger, Divider } from "@adobe/react-spectrum";
import { generateToast } from "./generateToast";
import { evalTS } from "../../lib/utils/bolt";
import Play from "@spectrum-icons/workflow/Play";
import Asterisk from "@spectrum-icons/workflow/Asterisk";
import { createGeneralContextualHelp } from "./ConsistentContextualHelp";


type BezierPoint = { x: number; y: number };
type LogicalBounds = { minX: number; maxX: number; minY: number; maxY: number; range: number };
type PresetCurve = { label: string; bezier: string; tooltip: string };

const presetCurves: PresetCurve[] = [
  { label: "Ease", bezier: "0.25,0.1,0.25,1", tooltip: "Standard ease" },
  { label: "Linear", bezier: "0,0,1,1", tooltip: "Linear transition" },
  { label: "Ease In", bezier: "0.42,0,1,1", tooltip: "Ease in" },
  { label: "Ease Out", bezier: "0,0,0.58,1", tooltip: "Ease out" },
  { label: "Ease In Out", bezier: "0.42,0,0.58,1", tooltip: "Ease in out" },
  { label: "Back", bezier: "0.68,-0.55,0.27,1.55", tooltip: "Back ease" },
  { label: "Bounce", bezier: "0.68,-0.6,0.32,1.6", tooltip: "Bounce ease" },
  { label: "Elastic", bezier: "0.87,-0.41,0.19,1.44", tooltip: "Elastic ease" },
  { label: "Sharp In", bezier: "0.7,0,0.84,0", tooltip: "Very sharp ease in" },
  { label: "Sharp Out", bezier: "0.16,1,0.3,1", tooltip: "Very sharp ease out" },
  { label: "Sine In", bezier: "0.47,0,0.745,0.715", tooltip: "Sine ease in" },
  { label: "Sine Out", bezier: "0.39,0.575,0.565,1", tooltip: "Sine ease out" },
  { label: "Sine In Out", bezier: "0.445,0.05,0.55,0.95", tooltip: "Sine ease in out" },
  { label: "Expo In", bezier: "0.95,0.05,0.795,0.035", tooltip: "Exponential ease in" },
  { label: "Expo Out", bezier: "0.19,1,0.22,1", tooltip: "Exponential ease out" },
  { label: "Expo In Out", bezier: "1,0,0,1", tooltip: "Exponential ease in out" },
  { label: "Circ In", bezier: "0.6,0.04,0.98,0.335", tooltip: "Circular ease in" },
  { label: "Circ Out", bezier: "0.075,0.82,0.165,1", tooltip: "Circular ease out" },
  { label: "Circ In Out", bezier: "0.785,0.135,0.15,0.86", tooltip: "Circular ease in out" },
  { label: "Quad In", bezier: "0.55,0.085,0.68,0.53", tooltip: "Quadratic ease in" },
  { label: "Quad Out", bezier: "0.25,0.46,0.45,0.94", tooltip: "Quadratic ease out" },
  { label: "Quad In Out", bezier: "0.455,0.03,0.515,0.955", tooltip: "Quadratic ease in out" },
  { label: "Cubic In", bezier: "0.55,0.055,0.675,0.19", tooltip: "Cubic ease in" },
  { label: "Cubic Out", bezier: "0.215,0.61,0.355,1", tooltip: "Cubic ease out" },
  { label: "Cubic In Out", bezier: "0.645,0.045,0.355,1", tooltip: "Cubic ease in out" },
  { label: "Quart In", bezier: "0.895,0.03,0.685,0.22", tooltip: "Quartic ease in" },
  { label: "Quart Out", bezier: "0.165,0.84,0.44,1", tooltip: "Quartic ease out" },
  { label: "Quart In Out", bezier: "0.77,0,0.175,1", tooltip: "Quartic ease in out" },
  { label: "Quint In", bezier: "0.755,0.05,0.855,0.06", tooltip: "Quintic ease in" },
  { label: "Quint Out", bezier: "0.23,1,0.32,1", tooltip: "Quintic ease out" },
  { label: "Quint In Out", bezier: "0.86,0,0.07,1", tooltip: "Quintic ease in out" },
  { label: "Custom 1", bezier: "0.33,1,0.68,1", tooltip: "Custom fast out slow in" },
  { label: "Custom 2", bezier: "0.5,-0.5,0.5,1.5", tooltip: "Custom overshoot" }
];

export default function KeyframeGraphEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  
  // here we keep the points for bezier curve
  const [point1, setPoint1] = useState<BezierPoint>({ x: 0, y: 0 });
  const [point2, setPoint2] = useState<BezierPoint>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);
  const [closest, setClosest] = useState(1);
  const [draggedPoint, setDraggedPoint] = useState<number | null>(null);
  const [bezierInput, setBezierInput] = useState("0.25,0.1,0.75,0.9");
  const [selectedPreset, setSelectedPreset] = useState<PresetCurve | null>(null);
  const [animationDuration, setAnimationDuration] = useState(2);
  const [sliderState, setSliderState] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 300 });

  // this is for how much of the graph you see, if you want to see more or less
  const getViewportBounds = useCallback(() => {
    return {
      minX: -0.3,
      maxX: 1.3,
      minY: -0.54,
      maxY: 1.54
    };
  }, []);

  // Convert Bezier coordinates to canvas pixels with dynamic viewport
  const bezierToCanvas = useCallback((bezierX: number, bezierY: number): BezierPoint => {
    const bounds = getViewportBounds();
    const padding = 0;
    const availableWidth = canvasSize.width - 2 * padding;
    const availableHeight = canvasSize.height - 2 * padding;
    
    const scaleX = availableWidth / (bounds.maxX - bounds.minX);
    const scaleY = availableHeight / (bounds.maxY - bounds.minY);
    
    return {
      x: padding + (bezierX - bounds.minX) * scaleX,
      y: padding + (bounds.maxY - bezierY) * scaleY
    };
  }, [canvasSize, getViewportBounds]);

  // Convert canvas pixels to Bezier coordinates with dynamic viewport
  const canvasToBezier = useCallback((canvasX: number, canvasY: number): { bezierX: number; bezierY: number } => {
    const bounds = getViewportBounds();
    const padding = 0;
    const availableWidth = canvasSize.width - 2 * padding;
    const availableHeight = canvasSize.height - 2 * padding;
    
    const scaleX = availableWidth / (bounds.maxX - bounds.minX);
    const scaleY = availableHeight / (bounds.maxY - bounds.minY);
    
    return {
      bezierX: bounds.minX + (canvasX - padding) / scaleX,
      bezierY: bounds.maxY - (canvasY - padding) / scaleY
    };
  }, [canvasSize, getViewportBounds]);

  // Draw the canvas with modern, stylish design and dynamic zoom
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bounds = getViewportBounds();
    
    const gradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#0f0f0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.save();
    const padding = 0;
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    for (let x = -0.5; x <= 1.5; x += 0.1) {
      const canvasX = bezierToCanvas(x, 0).x;
      if (canvasX >= padding && canvasX <= canvasSize.width - padding) {
        ctx.moveTo(canvasX, padding);
        ctx.lineTo(canvasX, canvasSize.height - padding);
      }
    }
    
    for (let y = -0.8; y <= 1.8; y += 0.1) {
      const canvasY = bezierToCanvas(0, y).y;
      if (canvasY >= padding && canvasY <= canvasSize.height - padding) {
        ctx.moveTo(padding, canvasY);
        ctx.lineTo(canvasSize.width - padding, canvasY);
      }
    }
    ctx.stroke();

    // Draw major grid lines every 0.5 units
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    
    for (let x = -0.5; x <= 1.5; x += 0.5) {
      const canvasX = bezierToCanvas(x, 0).x;
      if (canvasX >= padding && canvasX <= canvasSize.width - padding) {
        ctx.moveTo(canvasX, padding);
        ctx.lineTo(canvasX, canvasSize.height - padding);
      }
    }
    
    for (let y = -0.5; y <= 1.5; y += 0.5) {
      const canvasY = bezierToCanvas(0, y).y;
      if (canvasY >= padding && canvasY <= canvasSize.height - padding) {
        ctx.moveTo(padding, canvasY);
        ctx.lineTo(canvasSize.width - padding, canvasY);
      }
    }
    ctx.stroke();

    // Draw main coordinate system axes
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // X-axis (y = 0)
    if (bounds.minY <= 0 && bounds.maxY >= 0) {
      const y0 = bezierToCanvas(0, 0).y;
      ctx.moveTo(padding, y0);
      ctx.lineTo(canvasSize.width - padding, y0);
    }
    
    // Y-axis (x = 0)
    if (bounds.minX <= 0 && bounds.maxX >= 0) {
      const x0 = bezierToCanvas(0, 0).x;
      ctx.moveTo(x0, padding);
      ctx.lineTo(x0, canvasSize.height - padding);
    }
    ctx.stroke();

    // Draw unit square [0,1] x [0,1] with enhanced styling
    const unitSquare = {
      topLeft: bezierToCanvas(0, 1),
      topRight: bezierToCanvas(1, 1),
      bottomLeft: bezierToCanvas(0, 0),
      bottomRight: bezierToCanvas(1, 0)
    };
    
    // Unit square fill with subtle gradient
    ctx.beginPath();
    ctx.moveTo(unitSquare.bottomLeft.x, unitSquare.bottomLeft.y);
    ctx.lineTo(unitSquare.bottomRight.x, unitSquare.bottomRight.y);
    ctx.lineTo(unitSquare.topRight.x, unitSquare.topRight.y);
    ctx.lineTo(unitSquare.topLeft.x, unitSquare.topLeft.y);
    ctx.closePath();
    
    const unitGradient = ctx.createLinearGradient(
      unitSquare.bottomLeft.x, unitSquare.bottomLeft.y,
      unitSquare.topRight.x, unitSquare.topRight.y
    );
    unitGradient.addColorStop(0, 'rgba(124, 189, 250, 0.05)');
    unitGradient.addColorStop(1, 'rgba(124, 189, 250, 0.12)');
    ctx.fillStyle = unitGradient;
    ctx.fill();
    
    // Unit square border with emphasis
    ctx.strokeStyle = 'rgba(124, 189, 250, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();


    


    // Get current bezier coordinates (matching original script exactly)
    const bezier1X = point1.x / canvasSize.width;
    const bezier1Y = 1 - point1.y / canvasSize.height;
    const bezier2X = point2.x / canvasSize.width;
    const bezier2Y = 1 - point2.y / canvasSize.height;
    
    // Debug: log the bezier values to compare with AE
    console.log(`Bezier curve: cubic-bezier(${bezier1X.toFixed(3)}, ${bezier1Y.toFixed(3)}, ${bezier2X.toFixed(3)}, ${bezier2Y.toFixed(3)})`);

    // Draw bezier curve with consistent visual orientation
    // The graph always shows the same way - detection happens only when applying to AE
    const start = bezierToCanvas(0, 0);
    const cp1 = bezierToCanvas(bezier1X, bezier1Y);
    const cp2 = bezierToCanvas(bezier2X, bezier2Y);
    const end = bezierToCanvas(1, 1);
    
    // Curve shadow/glow effect
    ctx.save();
    ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Main curve
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw control lines with modern styling
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(cp1.x, cp1.y);
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(cp2.x, cp2.y);
    ctx.strokeStyle = "rgba(124, 189, 250, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw start and end points
    ctx.beginPath();
    ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
    ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(124, 189, 250, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "rgba(124, 189, 250, 1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw control points with modern styling and out-of-bounds indicators
    // Check if control points are outside normal [0,1] range
    const cp1OutOfBounds = bezier1X < 0 || bezier1X > 1 || bezier1Y < 0 || bezier1Y > 1;
    const cp2OutOfBounds = bezier2X < 0 || bezier2X > 1 || bezier2Y < 0 || bezier2Y > 1;

    // Control point 1
    ctx.beginPath();
    ctx.arc(cp1.x, cp1.y, 8, 0, Math.PI * 2);
    const cp1Gradient = ctx.createRadialGradient(cp1.x, cp1.y, 0, cp1.x, cp1.y, 8);
    if (cp1OutOfBounds) {
      cp1Gradient.addColorStop(0, '#ffaa44');
      cp1Gradient.addColorStop(1, '#ff8800');
    } else {
      cp1Gradient.addColorStop(0, '#4bcffa');
      cp1Gradient.addColorStop(1, '#1e90ff');
    }
    ctx.fillStyle = cp1Gradient;
    ctx.fill();
    ctx.strokeStyle = cp1OutOfBounds ? '#ffcc66' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add warning indicator for out-of-bounds control point 1
    if (cp1OutOfBounds) {
      ctx.beginPath();
      ctx.arc(cp1.x, cp1.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 170, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Control point 2
    ctx.beginPath();
    ctx.arc(cp2.x, cp2.y, 8, 0, Math.PI * 2);
    const cp2Gradient = ctx.createRadialGradient(cp2.x, cp2.y, 0, cp2.x, cp2.y, 8);
    if (cp2OutOfBounds) {
      cp2Gradient.addColorStop(0, '#ffaa44');
      cp2Gradient.addColorStop(1, '#ff8800');
    } else {
      cp2Gradient.addColorStop(0, '#4bcffa');
      cp2Gradient.addColorStop(1, '#1e90ff');
    }
    ctx.fillStyle = cp2Gradient;
    ctx.fill();
    ctx.strokeStyle = cp2OutOfBounds ? '#ffcc66' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add warning indicator for out-of-bounds control point 2
    if (cp2OutOfBounds) {
      ctx.beginPath();
      ctx.arc(cp2.x, cp2.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 170, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }



    ctx.restore();

    // Update output and input - with safety checks
    // (Removed setBezierInput to prevent feedback loop)
    // if (canvasSize.width > 0 && canvasSize.height > 0) {
    //   const x1 = Math.round((point1.x / canvasSize.width) * 100) / 100;
    //   const y1 = Math.round((1 - point1.y / canvasSize.height) * 100) / 100;
    //   const x2 = Math.round((point2.x / canvasSize.width) * 100) / 100;
    //   const y2 = Math.round((1 - point2.y / canvasSize.height) * 100) / 100;
    //   
    //   // Only update if values are valid numbers
    //   if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
    //     setBezierInput(`${x1}, ${y1}, ${x2}, ${y2}`);
    //   }
    // }

    // Update animation - with safety checks
    if (animationRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
      const x1 = Math.round((point1.x / canvasSize.width) * 100) / 100;
      const y1 = Math.round((1 - point1.y / canvasSize.height) * 100) / 100;
      const x2 = Math.round((point2.x / canvasSize.width) * 100) / 100;
      const y2 = Math.round((1 - point2.y / canvasSize.height) * 100) / 100;
      
      if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
        const curve = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
        animationRef.current.style.transition = `left ${animationDuration}s ${curve}`;
      }
    }
  }, [point1, point2, canvasSize, bezierToCanvas, animationDuration]);

  // Initialize canvas size and points with responsive sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Make it square and responsive, with much smaller minimum size
        const containerWidth = rect.width; // No padding
        const size = Math.max(200, Math.min(containerWidth, 600)); // Min 200px, max 600px
        
        console.log("Updating canvas size to:", size);
        
        // Scale existing points proportionally if canvas was already initialized
        if (canvasSize.width > 0 && canvasSize.height > 0) {
          const scaleX = size / canvasSize.width;
          const scaleY = size / canvasSize.height;
          
          setPoint1(prev => ({
            x: prev.x * scaleX,
            y: prev.y * scaleY
          }));
          setPoint2(prev => ({
            x: prev.x * scaleX,
            y: prev.y * scaleY
          }));
        } else {
          // Initial setup - set default curve points
          const p1 = { x: size * 0.25, y: size * (1 - 0.1) }; // (0.25, 0.1)
          const p2 = { x: size * 0.75, y: size * (1 - 0.9) }; // (0.75, 0.9)
          console.log("Setting initial points:", p1, p2);
          setPoint1(p1);
          setPoint2(p2);
        }
        
        setCanvasSize({ width: size, height: size });
      }
    };

    // Initial size calculation
    const timer = setTimeout(updateCanvasSize, 100);

    // Add resize listener
    window.addEventListener('resize', updateCanvasSize);
    
    // Use ResizeObserver for more accurate container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCanvasSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvasSize.width, canvasSize.height]);

  // Update canvas when dependencies change
  useEffect(() => {
    if (canvasRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
      canvasRef.current.width = canvasSize.width;
      canvasRef.current.height = canvasSize.height;
      console.log("Canvas sized to:", canvasSize.width, canvasSize.height);
      draw();
    }
  }, [canvasSize, draw, point1, point2]);

  // Set closest point - simplified
  const getClosestPoint = useCallback((canvasX: number, canvasY: number): number => {
    // Convert current points to canvas coordinates for distance calculation
    const bezier1X = point1.x / canvasSize.width;
    const bezier1Y = 1 - point1.y / canvasSize.height;
    const bezier2X = point2.x / canvasSize.width;
    const bezier2Y = 1 - point2.y / canvasSize.height;
    
    const cp1 = bezierToCanvas(bezier1X, bezier1Y);
    const cp2 = bezierToCanvas(bezier2X, bezier2Y);
    
    console.log("Control points at canvas coords:", cp1, cp2);
    console.log("Mouse at:", canvasX, canvasY);
    
    const point1Dist = Math.sqrt(
      Math.pow(canvasX - cp1.x, 2) + Math.pow(canvasY - cp1.y, 2)
    );
    const point2Dist = Math.sqrt(
      Math.pow(canvasX - cp2.x, 2) + Math.pow(canvasY - cp2.y, 2)
    );
    
    console.log("Distances - Point1:", point1Dist, "Point2:", point2Dist);
    
    const closestPoint = point1Dist < point2Dist ? 1 : 2;
    console.log("Closest point:", closestPoint);
    
    return closestPoint;
  }, [point1, point2, canvasSize, bezierToCanvas]);

  // Mouse event handlers - with proper coordinate scaling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale mouse coordinates to match canvas internal coordinates
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    console.log("Mouse down at:", canvasX, canvasY, "scale:", scaleX, scaleY);
    setDragging(true);
    const closestPoint = getClosestPoint(canvasX, canvasY);
    setClosest(closestPoint);
    setDraggedPoint(closestPoint);
    console.log("Closest point set to:", closestPoint);
    setSelectedPreset(null);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale mouse coordinates to match canvas internal coordinates
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    // Convert to bezier coordinates
    const bezierCoords = canvasToBezier(canvasX, canvasY);
    
    // Clamp X coordinate to [0, 1] for valid bezier curves
    const clampedBezierX = Math.max(0, Math.min(1, bezierCoords.bezierX));
    // Y coordinate can be any value (no clamping needed for bezier curves)
    const bezierY = bezierCoords.bezierY;
    
    // Convert back to pixel coordinates for storage
    const newPoint = {
      x: clampedBezierX * canvasSize.width,
      y: (1 - bezierY) * canvasSize.height
    };

    console.log("Moving point", draggedPoint, "to:", newPoint, "bezier:", clampedBezierX, bezierY);

    if (draggedPoint === 1) setPoint1(newPoint);
    else if (draggedPoint === 2) setPoint2(newPoint);

    // Update bezierInput to match new points
    const x1 = Math.round((draggedPoint === 1 ? newPoint.x : point1.x) / canvasSize.width * 100) / 100;
    const y1 = Math.round((1 - (draggedPoint === 1 ? newPoint.y : point1.y) / canvasSize.height) * 100) / 100;
    const x2 = Math.round((draggedPoint === 2 ? newPoint.x : point2.x) / canvasSize.width * 100) / 100;
    const y2 = Math.round((1 - (draggedPoint === 2 ? newPoint.y : point2.y) / canvasSize.height) * 100) / 100;
    setBezierInput(`${x1}, ${y1}, ${x2}, ${y2}`);
    
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setDragging(false);
    setDraggedPoint(null);
  };





  // Apply preset - matching original script
  const selectPreset = useCallback((preset: PresetCurve) => {
    setBezierInput(preset.bezier);
    
    // Apply the preset values immediately
    const values = preset.bezier.split(',').map((v: string) => parseFloat(v.trim()));
    if (values.length === 4) {
      const [a, b, c, d]: number[] = values;
      setPoint1({ x: a * canvasSize.width, y: (1 - b) * canvasSize.height });
      setPoint2({ x: c * canvasSize.width, y: (1 - d) * canvasSize.height });
    }
    
    setSelectedPreset(preset);
  }, [canvasSize]);

  // Auto-apply bezierInput to graph if valid
  useEffect(() => {
    const values = bezierInput.split(",").map((v) => parseFloat(v.trim()));
    if (values.length === 4 && values.every((v) => !isNaN(v))) {
      const [a, b, c, d] = values;
      setPoint1({ x: a * canvasSize.width, y: (1 - b) * canvasSize.height });
      setPoint2({ x: c * canvasSize.width, y: (1 - d) * canvasSize.height });
    }
    // Do not clear selectedPreset here, so preset highlight remains until user clicks elsewhere
    // Do not send to AE, just update the graph
    // Do not show error for invalid input, just ignore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bezierInput, canvasSize.width, canvasSize.height]);

  // Play animation - matching original script
  const playAnimation = useCallback(() => {
    if (!animationRef.current) return;
    
    // Remove both classes
    animationRef.current.classList.remove("left", "right");
    // Force reflow
    void animationRef.current.offsetWidth;
    // Apply new class based on sliderState
    if (sliderState === 0) {
      animationRef.current.classList.add("right");
    } else {
      animationRef.current.classList.add("left");
    }
  }, [sliderState]);

  // Handle animation end
  const handleAnimationEnd = useCallback(() => {
    setSliderState(sliderState === 0 ? 1 : 0);
  }, [sliderState]);





  // Apply values and send to After Effects
  const applyToAE = useCallback(async () => {
    const input = bezierInput.trim();
    const values = input.split(",").map((v) => v.trim());
    if (values.length !== 4) {
      generateToast(2, "Enter four numbers separated by commas (e.g., 0,-1,1,1)");
      return;
    }

    const a = parseFloat(values[0]);
    const b = parseFloat(values[1]);
    const c = parseFloat(values[2]);
    const d = parseFloat(values[3]);

    const errors: string[] = [];
    if (isNaN(a) || a < 0 || a > 1) {
      errors.push("a must be between 0 and 1");
    }
    if (isNaN(b)) {
      errors.push("b must be a number");
    }
    if (isNaN(c) || c < 0 || c > 1) {
      errors.push("c must be between 0 and 1");
    }
    if (isNaN(d)) {
      errors.push("d must be a number");
    }

    if (errors.length > 0) {
      generateToast(2, errors.join("; "));
      return;
    }

    setPoint1({ x: a * canvasSize.width, y: (1 - b) * canvasSize.height });
    setPoint2({ x: c * canvasSize.width, y: (1 - d) * canvasSize.height });
    setSelectedPreset(null);

    try {
      const result = await evalTS("applyRobustBezierToSelected", a, b, c, d);
      if (result) {
        generateToast(2, result);
      } else {
        generateToast(1, "Applied to After Effects!");
      }
    } catch (error) {
      generateToast(2, "Failed to apply to After Effects");
    }
  }, [bezierInput, canvasSize]);

  return (
    <Flex direction="column" gap={8} width="100%" marginTop={4}>
      <View borderWidth="thin" borderColor="dark" borderRadius="medium" padding="size-150">
        <Flex direction="column" gap={8}>
          <Flex direction="row" gap={8} alignItems="center">
            <Asterisk size="S" />
            <Heading level={4} margin={0}>
              Keyframe Graph Editor ( Alpha )
            </Heading>
            {createGeneralContextualHelp(
              "Keyframe Graph Editor Help",
              <>
                <b>How to use:</b><br />
                - Drag the points on graph to change curve.<br />
                - Click a preset to use it.<br />
                - "Apply" sends curve to AE (select 2+ keyframes first).<br />
                - "Copy From Selection" reads curve from 2 selected keyframes.<br />
                - "Play Animation" shows how curve behaves.<br />
                - "Reset to Default" restores original curve.<br />
                <br />
                <strong>Note:</strong> This is an experimental feature, tested only with AE 2025 <br />
              </>
            )}
          </Flex>
          <Divider size="S" />
          
          <Flex direction="row" gap={8} alignItems="start">
            <div
              ref={containerRef}
              style={{
                flex: 1,
                minWidth: 200,
                maxWidth: 600,
                aspectRatio: "1",
                border: "1px solid #333",
                borderRadius: "12px",
                overflow: "hidden",
                padding: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)"
              }}
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  cursor: dragging ? "grabbing" : "grab",
                  touchAction: "none",
                  boxSizing: "border-box"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            <Flex direction="column" gap={6} minWidth={180}>
              <TextField
                label="Bezier Values"
                value={bezierInput}
                onChange={setBezierInput}

              />
              
              <Flex direction="row" gap={6}>
                <Button variant="secondary" flex={1} onPress={applyToAE}>
                  Apply
                </Button>
              </Flex>

              <Divider size="S" />

              <View
                borderWidth="thin"
                borderRadius="large"
                padding="size-100"
                height={60}
                position="relative"
                UNSAFE_style={{
                  overflow: "hidden",
                  background: "none",
                  boxShadow: "none",
                  border: "1.5px solid rgba(255,255,255,0.25)"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "16px",
                    right: "16px",
                    height: "4px",
                    background: "rgba(255,255,255,0.5)",
                    borderRadius: "2px",
                    transform: "translateY(-50%)",
                    opacity: 0.18,
                    zIndex: 1
                  }}
                />
                <div
                  ref={animationRef}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: sliderState === 0 ? "10px" : "calc(100% - 30px)",
                    width: "24px",
                    height: "24px",
                    background: "radial-gradient(circle at 60% 40%, #7cbdfa 70%, #4b7fff 100%)",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 12px 0 rgba(124,189,250,0.25), 0 0 0 4px rgba(124,189,250,0.10)",
                    borderRadius: "50%",
                    transform: "translateY(-50%)",
                    transition: canvasSize.width > 0 && canvasSize.height > 0 ? 
                      `left ${animationDuration}s cubic-bezier(${Math.round((point1.x / canvasSize.width) * 100) / 100}, ${Math.round((1 - point1.y / canvasSize.height) * 100) / 100}, ${Math.round((point2.x / canvasSize.width) * 100) / 100}, ${Math.round((1 - point2.y / canvasSize.height) * 100) / 100})` :
                      `left ${animationDuration}s ease`,
                    zIndex: 2
                  }}
                  onTransitionEnd={handleAnimationEnd}
                />
              </View>

              <Button variant="secondary" onPress={playAnimation}>
                <Play />
                Play Animation
              </Button>

              <Button variant="secondary" onPress={() => {
                // Reset to default bezier (same as initial)
                setBezierInput("0.25,0.1,0.75,0.9");
              }}>
                Reset to Default
              </Button>

              <Button isDisabled variant="secondary" onPress={async () => {
                // Try to get bezier from AE selection
                try {
                  const result = await evalTS("getSelectedKeyframeBezier");
                  if (typeof result === "string" && result.match(/^(\s*-?\d+(\.\d+)?\s*,){3}\s*-?\d+(\.\d+)?\s*$/)) {
                    setBezierInput(result);
                    generateToast(1, "Copied bezier from selected keyframes.");
                  } else if (result && typeof result === "string") {
                    generateToast(2, result);
                  } else {
                    generateToast(2, "Could not get bezier from selection.");
                  }
                } catch (e) {
                  generateToast(2, "Error getting bezier from selection.");
                }
              }}>
                Copy From Selection
              </Button>
            </Flex>
          </Flex>

          <Divider size="S" />

          <Flex direction="column" gap={6}>
            <Flex wrap gap={6} justifyContent="start">
              {presetCurves.map((preset) => (
                <div
                  key={preset.label}
                  onClick={() => selectPreset(preset)}
                  style={{
                    border: "1px solid #fff",
                    borderRadius: "12px",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 4,
                    width: 56,
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    transition: "background 0.15s",
                  }}
                  title={preset.tooltip}
                >
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <rect x="0" y="0" width="44" height="44" fill="none" />
                    <path
                      d={(() => {
                        const [x1, y1, x2, y2] = preset.bezier.split(",").map(Number);
                        const start = { x: 4, y: 40 };
                        const end = { x: 40, y: 4 };
                        const cp1 = { x: 4 + (x1 * 36), y: 40 - (y1 * 36) };
                        const cp2 = { x: 4 + (x2 * 36), y: 40 - (y2 * 36) };
                        return `M${start.x},${start.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
                      })()}
                      stroke="#7cbdfa"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <circle cx="4" cy="40" r="2" fill="#fff" />
                    <circle cx="40" cy="4" r="2" fill="#fff" />
                  </svg>
                </div>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </View>
    </Flex>
  );
}
