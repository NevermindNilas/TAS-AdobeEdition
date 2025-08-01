import React, { useState, useRef, useEffect, useCallback } from "react";
import { Flex, View, Button, Text, Heading, TextField, Tooltip, TooltipTrigger, Divider, Slider, ActionButton, AlertDialog, DialogTrigger } from "@adobe/react-spectrum";
import { generateToast } from "./generateToast";
import { evalTS } from "../../lib/utils/bolt";
import Play from "@spectrum-icons/workflow/Play";
import Asterisk from "@spectrum-icons/workflow/Asterisk";

import Refresh from "@spectrum-icons/workflow/Refresh";
import Add from "@spectrum-icons/workflow/Add";
import Delete from "@spectrum-icons/workflow/Delete";
import { createGeneralContextualHelp } from "./ConsistentContextualHelp";


type BezierPoint = { x: number; y: number };

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
  

  const [point1, setPoint1] = useState<BezierPoint>({ x: 0, y: 0 });
  const [point2, setPoint2] = useState<BezierPoint>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);

  const [draggedPoint, setDraggedPoint] = useState<number | null>(null);
  const [bezierInput, setBezierInput] = useState("0.25,0.1,0.75,0.9");
  const [selectedPreset, setSelectedPreset] = useState<PresetCurve | null>(null);
  const [animationDuration, setAnimationDuration] = useState(2);
  const [sliderState, setSliderState] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 300 });
  const [inputError, setInputError] = useState<string>("");
  const [isHovering, setIsHovering] = useState<number | null>(null);
  const [customPresets, setCustomPresets] = useState<PresetCurve[]>(() => {
    try {
      const saved = localStorage.getItem('keyframe-custom-presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [needsRedraw, setNeedsRedraw] = useState(true);

  const getViewportBounds = useCallback(() => {
    return {
      minX: -0.15,
      maxX: 1.15,
      minY: -0.15,
      maxY: 1.15
    };
  }, []);


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


  const draw = useCallback(() => {
    if (!needsRedraw) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (canvasSize.width <= 0 || canvasSize.height <= 0) {
      console.warn("Invalid canvas dimensions, skipping draw");
      return;
    }

    const bounds = getViewportBounds();
    
    // Clear canvas with solid color instead of gradient for better performance
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.save();
    const padding = 0;
    
    // Draw fine grid first
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    // Fine vertical lines (every 0.1 units within 0-1 range)
    for (let x = 0; x <= 1; x += 0.1) {
      const canvasPos = bezierToCanvas(x, 0);
      ctx.moveTo(canvasPos.x, bezierToCanvas(0, 0).y);
      ctx.lineTo(canvasPos.x, bezierToCanvas(0, 1).y);
    }
    
    // Fine horizontal lines (every 0.1 units within 0-1 range)
    for (let y = 0; y <= 1; y += 0.1) {
      const canvasPos = bezierToCanvas(0, y);
      ctx.moveTo(bezierToCanvas(0, 0).x, canvasPos.y);
      ctx.lineTo(bezierToCanvas(1, 0).x, canvasPos.y);
    }
    ctx.stroke();
    
    // Draw major grid lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    
    // Major vertical lines (every 0.25 units within 0-1 range)
    for (let x = 0; x <= 1; x += 0.25) {
      const canvasPos = bezierToCanvas(x, 0);
      ctx.moveTo(canvasPos.x, bezierToCanvas(0, 0).y);
      ctx.lineTo(canvasPos.x, bezierToCanvas(0, 1).y);
    }
    
    // Major horizontal lines (every 0.25 units within 0-1 range)
    for (let y = 0; y <= 1; y += 0.25) {
      const canvasPos = bezierToCanvas(0, y);
      ctx.moveTo(bezierToCanvas(0, 0).x, canvasPos.y);
      ctx.lineTo(bezierToCanvas(1, 0).x, canvasPos.y);
    }
    ctx.stroke();

    // Draw axis lines (0,0 to 1,1 bounds)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal axis at y=0
    const y0 = bezierToCanvas(0, 0).y;
    const x0 = bezierToCanvas(0, 0).x;
    const x1 = bezierToCanvas(1, 0).x;
    const y1 = bezierToCanvas(0, 1).y;
    
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    
    // Vertical axis at x=0
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    
    ctx.stroke();

    const unitSquare = {
      topLeft: bezierToCanvas(0, 1),
      topRight: bezierToCanvas(1, 1),
      bottomLeft: bezierToCanvas(0, 0),
      bottomRight: bezierToCanvas(1, 0)
    };
    
    ctx.beginPath();
    ctx.moveTo(unitSquare.bottomLeft.x, unitSquare.bottomLeft.y);
    ctx.lineTo(unitSquare.bottomRight.x, unitSquare.bottomRight.y);
    ctx.lineTo(unitSquare.topRight.x, unitSquare.topRight.y);
    ctx.lineTo(unitSquare.topLeft.x, unitSquare.topLeft.y);
    ctx.closePath();
    
    // Use solid color instead of gradient for better performance
    ctx.fillStyle = 'rgba(124, 189, 250, 0.08)';
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(124, 189, 250, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();



    const bezier1X = point1.x / canvasSize.width;
    const bezier1Y = 1 - point1.y / canvasSize.height;
    const bezier2X = point2.x / canvasSize.width;
    const bezier2Y = 1 - point2.y / canvasSize.height;
    
    const start = bezierToCanvas(0, 0);
    const cp1 = bezierToCanvas(bezier1X, bezier1Y);
    const cp2 = bezierToCanvas(bezier2X, bezier2Y);
    const end = bezierToCanvas(1, 1);
    
    // Draw bezier curve without shadow for better performance
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 3;
    ctx.stroke();

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

    ctx.beginPath();
    ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
    ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(124, 189, 250, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "rgba(124, 189, 250, 1)";
    ctx.lineWidth = 2;
    ctx.stroke();
    const cp1OutOfBounds = bezier1X < 0 || bezier1X > 1;
    const cp2OutOfBounds = bezier2X < 0 || bezier2X > 1;
    
    // Draw control points with solid colors for better performance
    const cp1Size = draggedPoint === 1 ? 10 : 8;
    ctx.beginPath();
    ctx.arc(cp1.x, cp1.y, cp1Size, 0, Math.PI * 2);
    ctx.fillStyle = cp1OutOfBounds ? '#ffaa44' : (draggedPoint === 1 ? '#66d9ff' : '#4bcffa');
    ctx.fill();
    ctx.strokeStyle = cp1OutOfBounds ? '#ffcc66' : (draggedPoint === 1 ? '#00ccff' : '#ffffff');
    ctx.lineWidth = draggedPoint === 1 ? 3 : 2;
    ctx.stroke();

    const cp2Size = draggedPoint === 2 ? 10 : 8;
    ctx.beginPath();
    ctx.arc(cp2.x, cp2.y, cp2Size, 0, Math.PI * 2);
    ctx.fillStyle = cp2OutOfBounds ? '#ffaa44' : (draggedPoint === 2 ? '#66d9ff' : '#4bcffa');
    ctx.fill();
    ctx.strokeStyle = cp2OutOfBounds ? '#ffcc66' : (draggedPoint === 2 ? '#00ccff' : '#ffffff');
    ctx.lineWidth = draggedPoint === 2 ? 3 : 2;
    ctx.stroke();

    // Only show labels when dragging for better performance
    if (draggedPoint !== null) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = '12px system-ui';
      
      if (draggedPoint === 1) {
        const cp1Label = `P1: (${bezier1X.toFixed(2)}, ${bezier1Y.toFixed(2)})`;
        const cp1LabelWidth = ctx.measureText(cp1Label).width;
        ctx.fillRect(cp1.x - cp1LabelWidth/2 - 4, cp1.y - 30, cp1LabelWidth + 8, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cp1Label, cp1.x - cp1LabelWidth/2, cp1.y - 18);
      } else if (draggedPoint === 2) {
        const cp2Label = `P2: (${bezier2X.toFixed(2)}, ${bezier2Y.toFixed(2)})`;
        const cp2LabelWidth = ctx.measureText(cp2Label).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(cp2.x - cp2LabelWidth/2 - 4, cp2.y - 30, cp2LabelWidth + 8, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cp2Label, cp2.x - cp2LabelWidth/2, cp2.y - 18);
      }
    }



    ctx.restore();
    setNeedsRedraw(false);
  }, [point1, point2, canvasSize, bezierToCanvas, draggedPoint, needsRedraw, getViewportBounds]);
  useEffect(() => {
    const initializeCanvas = () => {
      try {
        const defaultSize = 300;
        setCanvasSize({ width: defaultSize, height: defaultSize });
        
        const p1 = { x: defaultSize * 0.25, y: defaultSize * (1 - 0.1) };
        const p2 = { x: defaultSize * 0.75, y: defaultSize * (1 - 0.9) };
        setPoint1(p1);
        setPoint2(p2);
        
        console.log("Canvas initialized with default size:", defaultSize);
      } catch (error) {
        console.error("Error initializing canvas:", error);
      }
    };

    initializeCanvas();
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      
      try {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          const size = Math.max(200, Math.min(rect.width, 600));
          
          // Only update if size actually changed significantly
          if (Math.abs(canvasSize.width - size) > 10) {
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
            
            setCanvasSize({ width: size, height: size });
            console.log("Canvas resized to:", size);
          }
        }
      } catch (error) {
        console.error("Error updating canvas size:", error);
      }
    };

    // Set up resize handling with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateCanvasSize, 100);
    };

    // Initial resize check after a short delay
    const initialTimer = setTimeout(updateCanvasSize, 500);
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []); // Run once on mount

  // Update canvas when dependencies change
  useEffect(() => {
    const updateCanvas = () => {
      if (!canvasRef.current || canvasSize.width <= 0 || canvasSize.height <= 0) {
        return;
      }
      
      try {
        canvasRef.current.width = canvasSize.width;
        canvasRef.current.height = canvasSize.height;
        setNeedsRedraw(true);
      } catch (error) {
        console.error("Error updating canvas:", error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateCanvas, 10);
    
    return () => clearTimeout(timer);
  }, [canvasSize]);

  // Separate effect for drawing
  useEffect(() => {
    if (needsRedraw) {
      const timer = requestAnimationFrame(() => {
        draw();
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [needsRedraw, draw]);

  // Update animation transition when points change
  useEffect(() => {
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
  }, [point1, point2, canvasSize, animationDuration]);

  // Set closest point - simplified
  const getClosestPoint = useCallback((canvasX: number, canvasY: number): number => {
    // Safety check for canvas dimensions
    if (canvasSize.width <= 0 || canvasSize.height <= 0) {
      return 1; // Default to first point
    }
    
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
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || canvasSize.width <= 0 || canvasSize.height <= 0) return;

      const rect = canvas.getBoundingClientRect();
      // Scale mouse coordinates to match canvas internal coordinates
      const scaleX = canvasSize.width / rect.width;
      const scaleY = canvasSize.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      
      setDragging(true);
      const closestPoint = getClosestPoint(canvasX, canvasY);
      setDraggedPoint(closestPoint);
      setSelectedPreset(null);
      setNeedsRedraw(true);
      e.preventDefault();
    } catch (error) {
      console.error("Error in handleMouseDown:", error);
    }
  }, [canvasSize, getClosestPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || canvasSize.width <= 0 || canvasSize.height <= 0) return;

      const rect = canvas.getBoundingClientRect();
      // Scale mouse coordinates to match canvas internal coordinates
      const scaleX = canvasSize.width / rect.width;
      const scaleY = canvasSize.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

    if (!dragging) {
      // Throttle cursor updates for better performance
      const bezier1X = point1.x / canvasSize.width;
      const bezier1Y = 1 - point1.y / canvasSize.height;
      const bezier2X = point2.x / canvasSize.width;
      const bezier2Y = 1 - point2.y / canvasSize.height;
      
      const cp1 = bezierToCanvas(bezier1X, bezier1Y);
      const cp2 = bezierToCanvas(bezier2X, bezier2Y);
      
      const point1Dist = Math.sqrt(Math.pow(canvasX - cp1.x, 2) + Math.pow(canvasY - cp1.y, 2));
      const point2Dist = Math.sqrt(Math.pow(canvasX - cp2.x, 2) + Math.pow(canvasY - cp2.y, 2));
      
      const minDist = Math.min(point1Dist, point2Dist);
      canvas.style.cursor = minDist < 15 ? "pointer" : "grab";
      return;
    }
    
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

    if (draggedPoint === 1) {
      setPoint1(newPoint);
    } else if (draggedPoint === 2) {
      setPoint2(newPoint);
    }

    // Update bezierInput to match new points
    const x1 = Math.round((draggedPoint === 1 ? newPoint.x : point1.x) / canvasSize.width * 100) / 100;
    const y1 = Math.round((1 - (draggedPoint === 1 ? newPoint.y : point1.y) / canvasSize.height) * 100) / 100;
    const x2 = Math.round((draggedPoint === 2 ? newPoint.x : point2.x) / canvasSize.width * 100) / 100;
    const y2 = Math.round((1 - (draggedPoint === 2 ? newPoint.y : point2.y) / canvasSize.height) * 100) / 100;
    setBezierInput(`${x1}, ${y1}, ${x2}, ${y2}`);
    
    setNeedsRedraw(true);
    e.preventDefault();
    } catch (error) {
      console.error("Error in handleMouseMove:", error);
    }
  }, [dragging, draggedPoint, canvasSize, canvasToBezier, bezierToCanvas, point1, point2]);

  const handleMouseUp = useCallback(() => {
    try {
      setDragging(false);
      setDraggedPoint(null);
      setNeedsRedraw(true);
    } catch (error) {
      console.error("Error in handleMouseUp:", error);
    }
  }, []);





  // Apply preset - matching original script
  const selectPreset = useCallback((preset: PresetCurve) => {
    setBezierInput(preset.bezier);
    
    // Apply the preset values immediately
    const values = preset.bezier.split(',').map((v: string) => parseFloat(v.trim()));
    if (values.length === 4) {
      const [a, b, c, d]: number[] = values;
      setPoint1({ x: a * canvasSize.width, y: (1 - b) * canvasSize.height });
      setPoint2({ x: c * canvasSize.width, y: (1 - d) * canvasSize.height });
      setNeedsRedraw(true);
    }
    
    setSelectedPreset(preset);
  }, [canvasSize]);

  // Custom preset management
  const addCustomPreset = useCallback(() => {
    if (!newPresetName.trim()) {
      generateToast(2, "Please enter a preset name");
      return;
    }
    
    const values = bezierInput.split(",").map((v) => parseFloat(v.trim()));
    if (values.length !== 4 || values.some((v) => isNaN(v))) {
      generateToast(2, "Invalid bezier values");
      return;
    }
    
    const newPreset: PresetCurve = {
      label: newPresetName.trim(),
      bezier: bezierInput.trim(),
      tooltip: `Custom preset: ${newPresetName.trim()}`
    };
    
    setCustomPresets(prev => [...prev, newPreset]);
    setNewPresetName("");
    setShowAddPreset(false);
    generateToast(1, `Custom preset "${newPresetName.trim()}" added!`);
  }, [newPresetName, bezierInput]);

  const removeCustomPreset = useCallback((presetToRemove: PresetCurve) => {
    setCustomPresets(prev => prev.filter(preset => preset.label !== presetToRemove.label));
    if (selectedPreset?.label === presetToRemove.label) {
      setSelectedPreset(null);
    }
    generateToast(1, `Preset "${presetToRemove.label}" removed`);
  }, [selectedPreset]);

  // Auto-apply bezierInput to graph if valid
  useEffect(() => {
    const values = bezierInput.split(",").map((v) => parseFloat(v.trim()));
    if (values.length === 4 && values.every((v) => !isNaN(v))) {
      const [a, b, c, d] = values;
      const newPoint1 = { x: a * canvasSize.width, y: (1 - b) * canvasSize.height };
      const newPoint2 = { x: c * canvasSize.width, y: (1 - d) * canvasSize.height };
      
      // Only update if values actually changed
      if (point1.x !== newPoint1.x || point1.y !== newPoint1.y || 
          point2.x !== newPoint2.x || point2.y !== newPoint2.y) {
        setPoint1(newPoint1);
        setPoint2(newPoint2);
        setNeedsRedraw(true);
      }
      setInputError("");
    } else if (bezierInput.trim() !== "") {
      setInputError("Invalid format. Use: x1,y1,x2,y2");
    } else {
      setInputError("");
    }
  }, [bezierInput, canvasSize.width, canvasSize.height, point1, point2]);

  // Save custom presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('keyframe-custom-presets', JSON.stringify(customPresets));
    } catch (error) {
      console.warn('Failed to save custom presets to localStorage:', error);
    }
  }, [customPresets]);

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
    <Flex direction="column" gap={8} width="100%" marginTop={8}>
      <View borderWidth="thin" borderColor="dark" borderRadius="medium" padding="size-150">
        <Flex direction="column" gap={8}>
          <Flex direction="row" gap={8} alignItems="center">
            <Asterisk size="S" />
            <Heading level={4} margin={0}>
              Keyframe Graph Editor ( Early Alpha )
            </Heading>
            {createGeneralContextualHelp(
              "Keyframe Graph Editor Help",
              <>
                <b>How to use:</b><br />
                - Drag the blue control points to shape your curve<br />
                - Click preset buttons for common easing curves<br />

                - Orange points indicate values outside normal [0,1] range<br />
                - "Apply" sends curve to AE (select 2+ keyframes first)<br />
                - Adjust animation duration to preview timing<br />
                <br />
                <strong>Note:</strong> This is an experimental feature, tested only with AE 2025<br />
              </>
            )}
          </Flex>
          <Divider size="S" />
          
          <Flex direction="row" gap={8} alignItems="start">
            <div
              ref={containerRef}
              style={{
                flex: 1,
                minWidth: 100,
                maxWidth: 400,
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

            <Flex direction="column" gap={6} minWidth={200}>
              <Flex direction="row" gap={4} alignItems="end">
                <TextField
                  label={`Bezier Values ${selectedPreset ? `(${selectedPreset.label})` : ''}`}
                  value={bezierInput}
                  onChange={setBezierInput}
                  validationState={inputError ? "invalid" : "valid"}
                  errorMessage={inputError}
                  flex={1}
                />
                <TooltipTrigger>
                  <ActionButton onPress={() => {
                    setBezierInput("0.25,0.1,0.75,0.9");
                    setSelectedPreset(null);
                  }} isQuiet>
                    <Refresh />
                  </ActionButton>
                  <Tooltip>Reset to default</Tooltip>
                </TooltipTrigger>
              </Flex>
              
              <TooltipTrigger>
                <Button variant="cta" flex={1} onPress={applyToAE}>
                  Apply to After Effects
                </Button>
                <Tooltip>Apply curve to selected keyframes</Tooltip>
              </TooltipTrigger>

              <Divider size="S" />

              <Flex direction="column" gap={4}>
                <Slider
                  label="Animation Duration"
                  value={animationDuration}
                  onChange={setAnimationDuration}
                  minValue={0.1}
                  maxValue={5}
                  step={0.1}
                  isFilled
                  width={"100%"}
                  formatOptions={{
                    style: "unit",
                    unit: "second",
                    unitDisplay: "short"
                  }}
                />
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

              <Flex direction="column" gap={4}>
                <TooltipTrigger>
                  <Button variant="secondary" onPress={playAnimation}>
                    <Play />
                    Play Animation
                  </Button>
                  <Tooltip>Preview animation with current curve</Tooltip>
                </TooltipTrigger>

                <Button isDisabled variant="secondary" onPress={async () => {
                  // Try to get bezier from AE selection
                  try {
                    const result = await evalTS("getSelectedKeyframeBezier");
                    if (typeof result === "string" && result.match(/^(\s*-?\d+(\.\d+)?\s*,){3}\s*-?\d+(\.\d+)?\s*$/)) {
                      setBezierInput(result);
                      setSelectedPreset(null);
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
          </Flex>

          <Divider size="S" />

          <Flex direction="column" gap={6}>
            <Flex direction="row" justifyContent="space-between" alignItems="center">
              <Text>Curve Presets</Text>
              <DialogTrigger>
                <ActionButton isQuiet>
                  <Add />
                  <Text>Add Custom</Text>
                </ActionButton>
                <AlertDialog
                  title="Add Custom Preset"
                  variant="confirmation"
                  primaryActionLabel="Add Preset"
                  secondaryActionLabel="Cancel"
                  onPrimaryAction={addCustomPreset}
                  onSecondaryAction={() => setNewPresetName("")}
                >
                  <Flex direction="column" gap={4}>
                    <TextField
                      label="Preset Name"
                      value={newPresetName}
                      onChange={setNewPresetName}
                      placeholder="Enter preset name"
                      autoFocus
                    />
                    <Text>Current Bezier: {bezierInput}</Text>
                  </Flex>
                </AlertDialog>
              </DialogTrigger>
            </Flex>
            
            {/* Built-in Presets */}
            <Flex wrap gap={4} justifyContent="start">
              {presetCurves.map((preset, index) => (
                <TooltipTrigger key={preset.label}>
                  <div
                    onClick={() => selectPreset(preset)}
                    onMouseEnter={() => setIsHovering(index)}
                    onMouseLeave={() => setIsHovering(null)}
                    style={{
                      border: selectedPreset?.label === preset.label 
                        ? "2px solid #7cbdfa" 
                        : isHovering === index 
                          ? "2px solid rgba(124, 189, 250, 0.5)"
                          : "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "8px",
                      background: selectedPreset?.label === preset.label 
                        ? "rgba(124, 189, 250, 0.1)" 
                        : isHovering === index 
                          ? "rgba(124, 189, 250, 0.05)"
                          : "transparent",
                      cursor: "pointer",
                      padding: "8px",
                      width: "80px",
                      height: "70px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                      transform: isHovering === index ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <svg width="40" height="32" viewBox="0 0 40 32">
                      <rect x="0" y="0" width="40" height="32" fill="none" />
                      <path
                        d={(() => {
                          const [x1, y1, x2, y2] = preset.bezier.split(",").map(Number);
                          const start = { x: 2, y: 30 };
                          const end = { x: 38, y: 2 };
                          const cp1 = { x: 2 + (x1 * 36), y: 30 - (y1 * 28) };
                          const cp2 = { x: 2 + (x2 * 36), y: 30 - (y2 * 28) };
                          return `M${start.x},${start.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
                        })()}
                        stroke={selectedPreset?.label === preset.label ? "#7cbdfa" : "#7cbdfa"}
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle cx="2" cy="30" r="1.5" fill={selectedPreset?.label === preset.label ? "#7cbdfa" : "#fff"} />
                      <circle cx="38" cy="2" r="1.5" fill={selectedPreset?.label === preset.label ? "#7cbdfa" : "#fff"} />
                    </svg>
                    <Text 
                      UNSAFE_style={{ 
                        fontSize: "10px", 
                        marginTop: "4px", 
                        textAlign: "center",
                        color: selectedPreset?.label === preset.label ? "#7cbdfa" : "inherit"
                      }}
                    >
                      {preset.label}
                    </Text>
                  </div>
                  <Tooltip>{preset.tooltip}</Tooltip>
                </TooltipTrigger>
              ))}
            </Flex>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <>
                <Divider size="S" />
                <Text>Custom Presets</Text>
                <Flex wrap gap={4} justifyContent="start">
                  {customPresets.map((preset, index) => (
                    <TooltipTrigger key={preset.label}>
                      <div
                        style={{
                          position: "relative",
                          border: selectedPreset?.label === preset.label 
                            ? "2px solid #7cbdfa" 
                            : isHovering === (presetCurves.length + index)
                              ? "2px solid rgba(124, 189, 250, 0.5)"
                              : "1px solid rgba(255, 255, 255, 0.3)",
                          borderRadius: "8px",
                          background: selectedPreset?.label === preset.label 
                            ? "rgba(124, 189, 250, 0.1)" 
                            : isHovering === (presetCurves.length + index)
                              ? "rgba(124, 189, 250, 0.05)"
                              : "transparent",
                          cursor: "pointer",
                          padding: "8px",
                          width: "80px",
                          height: "70px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          boxSizing: "border-box",
                          transition: "all 0.2s ease",
                          transform: isHovering === (presetCurves.length + index) ? "scale(1.05)" : "scale(1)",
                        }}
                        onClick={() => selectPreset(preset)}
                        onMouseEnter={() => setIsHovering(presetCurves.length + index)}
                        onMouseLeave={() => setIsHovering(null)}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomPreset(preset);
                          }}
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            width: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            borderRadius: "2px",
                            backgroundColor: "rgba(255, 0, 0, 0.1)",
                            zIndex: 10
                          }}
                        >
                          <Delete size="XS" />
                        </div>
                        <svg width="40" height="32" viewBox="0 0 40 32">
                          <rect x="0" y="0" width="40" height="32" fill="none" />
                          <path
                            d={(() => {
                              const [x1, y1, x2, y2] = preset.bezier.split(",").map(Number);
                              const start = { x: 2, y: 30 };
                              const end = { x: 38, y: 2 };
                              const cp1 = { x: 2 + (x1 * 36), y: 30 - (y1 * 28) };
                              const cp2 = { x: 2 + (x2 * 36), y: 30 - (y2 * 28) };
                              return `M${start.x},${start.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
                            })()}
                            stroke={selectedPreset?.label === preset.label ? "#7cbdfa" : "#ff9500"}
                            strokeWidth="2"
                            fill="none"
                          />
                          <circle cx="2" cy="30" r="1.5" fill={selectedPreset?.label === preset.label ? "#7cbdfa" : "#ff9500"} />
                          <circle cx="38" cy="2" r="1.5" fill={selectedPreset?.label === preset.label ? "#7cbdfa" : "#ff9500"} />
                        </svg>
                        <Text 
                          UNSAFE_style={{ 
                            fontSize: "10px", 
                            marginTop: "4px", 
                            textAlign: "center",
                            color: selectedPreset?.label === preset.label ? "#7cbdfa" : "#ff9500",
                            maxWidth: "70px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {preset.label}
                        </Text>
                      </div>
                      <Tooltip>{preset.tooltip}</Tooltip>
                    </TooltipTrigger>
                  ))}
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </View>
    </Flex>
  );
}
