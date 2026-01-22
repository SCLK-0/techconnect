import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, PencilBrush, IText, FabricImage, Path } from "fabric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer2,
  Type,
  Minus,
  Eraser,
  Image,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhiteboardCanvasProps {
  sessionId: string;
  isMonitorMode?: boolean;
  isPeerConnected?: boolean;
  isSessionInProgress?: boolean;
}

type Tool = "select" | "draw" | "text" | "eraser";

type WhiteboardEvent = {
  type: "draw" | "text" | "image" | "modify" | "delete" | "clear" | "cursor" | "manipulating";
  data: any;
  oderId: string;
  objectId?: string;
};

type CursorData = {
  x: number;
  y: number;
  oderId: string;
  userName: string;
  color: string;
};

type ManipulationData = {
  objectId: string;
  x: number;
  y: number;
  userName: string;
  color: string;
  action: "moving" | "resizing" | "rotating" | "drawing" | "using";
};

export function WhiteboardCanvas({ 
  sessionId, 
  isMonitorMode = false, 
  isPeerConnected = true, 
  isSessionInProgress = false 
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [drawColor, setDrawColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User info
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userColor, setUserColor] = useState("#FF6B6B");
  
  // Connection state - SIMPLE: just track if channel is ready and other user is present
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserPresent, setOtherUserPresent] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorData>>({});
  const [remoteManipulations, setRemoteManipulations] = useState<Record<string, ManipulationData>>({});
  
  // Debug: log when remoteManipulations changes
  useEffect(() => {
    if (Object.keys(remoteManipulations).length > 0) {
      console.log(" remoteManipulations state updated:", remoteManipulations);
    }
  }, [remoteManipulations]);
  
  // Store calculated bounds for manipulation indicators
  const [manipulationBounds, setManipulationBounds] = useState<Record<string, { left: number; top: number; width: number; height: number } | null>>({});
  
  // Update manipulation bounds when there are remote manipulations (to track object positions in real-time)
  useEffect(() => {
    if (!canvas || Object.keys(remoteManipulations).length === 0) {
      setManipulationBounds({});
      return;
    }
    
    let animationFrameId: number;
    let isRunning = true;
    
    // Function to calculate bounds for all manipulated objects
    const updateBounds = () => {
      if (!isRunning) return;
      
      const newBounds: Record<string, { left: number; top: number; width: number; height: number } | null> = {};
      
      for (const [oderId, manipulation] of Object.entries(remoteManipulations)) {
        if (manipulation.objectId) {
          const canvasObjects = canvas.getObjects();
          const manipulatedObject = canvasObjects.find((obj: any) => obj.syncId === manipulation.objectId);
          if (manipulatedObject) {
            // Force recalculate coords before getting bounds
            manipulatedObject.setCoords();
            newBounds[oderId] = manipulatedObject.getBoundingRect();
          } else {
            newBounds[oderId] = null;
          }
        }
      }
      
      setManipulationBounds(newBounds);
      
      // Continue the animation loop
      if (isRunning) {
        animationFrameId = requestAnimationFrame(updateBounds);
      }
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateBounds);
    
    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvas, remoteManipulations]);
  
  const channelRef = useRef<any>(null);
  const isProcessingRemote = useRef(false);
  const objectIdMap = useRef<Map<string, any>>(new Map());

  // Generate unique object ID
  const generateId = () => `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Broadcast event to other users - SIMPLE AND WORKING VERSION
  const broadcast = useCallback(async (event: WhiteboardEvent) => {
    if (!channelRef.current) {
      console.log(" Broadcast skipped - no channel");
      return;
    }
    if (isProcessingRemote.current) {
      console.log(" Broadcast skipped - processing remote");
      return;
    }
    
    try {
      console.log(` Broadcasting ${event.type} event`);
      await channelRef.current.send({
        type: "broadcast",
        event: "whiteboard",
        payload: event,
      });
    } catch (err) {
      console.error("Broadcast error:", err);
    }
  }, []);

  // Track if canvas has unsaved changes
  const hasUnsavedChanges = useRef(false);
  const lastSavedState = useRef<string>("");

  // Save whiteboard state to database - SIMPLE VERSION
  const saveState = useCallback(async (fabricCanvas: Canvas, force: boolean = false) => {
    if (!fabricCanvas || !userId) return;
    
    const objects = fabricCanvas.getObjects().map((obj: any) => {
      const baseData = {
        type: obj.type,
        syncId: obj.syncId,
        ...obj.toJSON(),
      };
      
      // For images, explicitly include the src (base64 data URL)
      // Try multiple ways to get the image source
      if (obj.type === "image") {
        let imageSrc = null;
        
        // Priority order for getting image src
        if (obj.originalSrc) {
          imageSrc = obj.originalSrc;
          console.log(" Image src from originalSrc");
        } else if (obj._element?.src) {
          imageSrc = obj._element.src;
          console.log(" Image src from _element.src");
        } else if (obj.getSrc && typeof obj.getSrc === 'function') {
          try {
            imageSrc = obj.getSrc();
            console.log(" Image src from getSrc()");
          } catch (e) {
            console.log(" getSrc() failed:", e);
          }
        } else if (obj._originalElement?.src) {
          imageSrc = obj._originalElement.src;
          console.log(" Image src from _originalElement.src");
        } else if (obj.src) {
          imageSrc = obj.src;
          console.log(" Image src from obj.src");
        }
        
        // If we still don't have src, try to get it from the canvas element
        if (!imageSrc && obj.getElement) {
          try {
            const element = obj.getElement();
            if (element?.src) {
              imageSrc = element.src;
              console.log(" Image src from getElement().src");
            }
          } catch (e) {
            console.log(" getElement() failed:", e);
          }
        }
        
        // Last resort: try to export to data URL
        if (!imageSrc && obj.toDataURL) {
          try {
            imageSrc = obj.toDataURL({ format: 'png' });
            console.log(" Image src from toDataURL()");
          } catch (e) {
            console.log(" toDataURL() failed:", e);
          }
        }
        
        if (imageSrc) {
          baseData.src = imageSrc;
          console.log(` Saved image with src length: ${imageSrc.length}`);
        } else {
          console.warn(" Could not get image src for object:", obj);
        }
      }
      
      return baseData;
    });
    
    // Create a hash of current state to detect changes
    const currentStateHash = JSON.stringify(objects);
    
    // Skip save if nothing changed (unless forced)
    if (!force && currentStateHash === lastSavedState.current) {
      return;
    }
    
    console.log(` Saving whiteboard state: ${objects.length} objects`);
    
    try {
      const { error } = await supabase.from("whiteboard_states").upsert({
        session_id: sessionId,
        canvas_state: { objects },
        updated_at: new Date().toISOString(),
      }, { onConflict: "session_id" });
      
      if (error) {
        console.error(" Save state error:", error);
      } else {
        lastSavedState.current = currentStateHash;
        hasUnsavedChanges.current = false;
      }
    } catch (err) {
      console.error("Save state error:", err);
    }
  }, [sessionId, userId]);
  
  // Mark canvas as having unsaved changes
  const markDirty = useCallback(() => {
    hasUnsavedChanges.current = true;
  }, []);

  // Handle remote events - SIMPLE WORKING VERSION
  const handleRemoteEvent = useCallback((fabricCanvas: Canvas, event: WhiteboardEvent) => {
    if (event.oderId === userId) return; // Ignore own events
    
    isProcessingRemote.current = true;
    
    try {
      switch (event.type) {
        case "draw":
          if (event.data?.path) {
            const path = new Path(event.data.path, {
              stroke: event.data.stroke || "#000000",
              strokeWidth: event.data.strokeWidth || 3,
              fill: "",
              strokeLineCap: "round",
              strokeLineJoin: "round",
              selectable: !isMonitorMode,
              evented: !isMonitorMode,
            });
            (path as any).syncId = event.objectId;
            objectIdMap.current.set(event.objectId!, path);
            fabricCanvas.add(path);
            fabricCanvas.renderAll();
          }
          break;
          
        case "text":
          if (event.data) {
            const text = new IText(event.data.text || "", {
              left: event.data.left,
              top: event.data.top,
              fill: event.data.fill || "#000000",
              fontSize: event.data.fontSize || 20,
              fontFamily: "Arial",
              selectable: !isMonitorMode,
              evented: !isMonitorMode,
            });
            (text as any).syncId = event.objectId;
            objectIdMap.current.set(event.objectId!, text);
            fabricCanvas.add(text);
            fabricCanvas.renderAll();
          }
          break;
          
        case "image":
          if (event.data?.src) {
            console.log(` Whiteboard: Received image broadcast, src length: ${event.data.src.length}, objectId: ${event.objectId}`);
            
            // Check if this image already exists (might have been loaded from database)
            if (event.objectId && objectIdMap.current.has(event.objectId)) {
              console.log(` Whiteboard: Image ${event.objectId} already exists, skipping`);
              break;
            }
            
            FabricImage.fromURL(event.data.src).then((img) => {
              // Double-check it wasn't added while we were loading
              if (event.objectId && objectIdMap.current.has(event.objectId)) {
                console.log(` Whiteboard: Image ${event.objectId} was added while loading, skipping`);
                return;
              }
              
              img.set({
                left: event.data.left || 50,
                top: event.data.top || 50,
                scaleX: event.data.scaleX || 0.5,
                scaleY: event.data.scaleY || 0.5,
                selectable: !isMonitorMode,
                evented: !isMonitorMode,
              });
              (img as any).syncId = event.objectId;
              (img as any).originalSrc = event.data.src;
              objectIdMap.current.set(event.objectId!, img);
              fabricCanvas.add(img);
              fabricCanvas.renderAll();
              console.log(` Whiteboard: Image ${event.objectId} from broadcast loaded successfully`);
            }).catch(e => {
              console.error(" Whiteboard: Error loading image from broadcast:", e);
            });
          } else {
            console.warn(" Whiteboard: Received image event without src");
          }
          break;
          
        case "modify":
          if (event.objectId) {
            const obj = objectIdMap.current.get(event.objectId);
            if (obj) {
              obj.set(event.data);
              fabricCanvas.renderAll();
            }
          }
          break;
          
        case "delete":
          if (event.objectId) {
            const obj = objectIdMap.current.get(event.objectId);
            if (obj) {
              fabricCanvas.remove(obj);
              objectIdMap.current.delete(event.objectId);
              fabricCanvas.renderAll();
            }
          }
          break;
          
        case "clear":
          fabricCanvas.clear();
          fabricCanvas.backgroundColor = "#ffffff";
          objectIdMap.current.clear();
          fabricCanvas.renderAll();
          break;
          
        case "cursor":
          if (event.data) {
            setRemoteCursors(prev => ({
              ...prev,
              [event.oderId]: event.data,
            }));
          }
          break;
          
        case "manipulating":
          console.log(" Received manipulation event:", event.data);
          if (event.data) {
            if (event.data.action === null) {
              console.log(" Clearing manipulation for:", event.oderId);
              setRemoteManipulations(prev => {
                const newState = { ...prev };
                delete newState[event.oderId];
                return newState;
              });
            } else {
              console.log(" Setting manipulation:", event.oderId, event.data);
              
              // Update the object position in real-time so the border follows it
              if (event.data.objectId && event.data.objectLeft !== undefined) {
                const obj = objectIdMap.current.get(event.data.objectId);
                if (obj) {
                  obj.set({
                    left: event.data.objectLeft,
                    top: event.data.objectTop,
                    scaleX: event.data.objectScaleX,
                    scaleY: event.data.objectScaleY,
                    angle: event.data.objectAngle,
                  });
                  obj.setCoords();
                  fabricCanvas.renderAll();
                }
              }
              
              setRemoteManipulations(prev => ({
                ...prev,
                [event.oderId]: event.data,
              }));
            }
          }
          break;
      }
    } finally {
      isProcessingRemote.current = false;
    }
  }, [userId, isMonitorMode]);

  // Initialize canvas and realtime connection
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    let fabricCanvas: Canvas | null = null;
    let channel: any = null;
    
    const init = async () => {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      setUserColor(color);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      
      const name = profile?.full_name || user.email?.split("@")[0] || "User";
      setUserName(name);
      
      // Create canvas - wait for container to have dimensions - SIMPLE VERSION
      const waitForDimensions = () => {
        return new Promise<{ width: number; height: number }>((resolve) => {
          const checkDimensions = () => {
            const width = containerRef.current?.clientWidth || 0;
            const height = containerRef.current?.clientHeight || 0;
            if (width > 0 && height > 0) {
              resolve({ width, height });
            } else {
              console.log(" Whiteboard: Waiting for container dimensions...");
              requestAnimationFrame(checkDimensions);
            }
          };
          checkDimensions();
        });
      };
      
      const { width, height } = await waitForDimensions();
      console.log(` Whiteboard: Creating canvas with dimensions ${width}x${height}`);
      
      fabricCanvas = new Canvas(canvasRef.current!, {
        width,
        height,
        backgroundColor: "#ffffff",
        selection: !isMonitorMode,
      });
      
      if (isMonitorMode) {
        fabricCanvas.selection = false;
        fabricCanvas.skipTargetFind = true;
      }
      
      setCanvas(fabricCanvas);
      
      // Load existing state from database
      console.log(` Whiteboard: Loading existing state for session ${sessionId} (isMonitorMode: ${isMonitorMode})`);
      const { data: existingState, error: loadError } = await supabase
        .from("whiteboard_states")
        .select("canvas_state, updated_at")
        .eq("session_id", sessionId)
        .maybeSingle();
      
      if (loadError) {
        console.error(" Whiteboard: Error loading state:", loadError);
      }
      
      if (existingState?.canvas_state) {
        const state = existingState.canvas_state as any;
        console.log(` Whiteboard: Found ${state.objects?.length || 0} objects in saved state (updated: ${existingState.updated_at})`);
        if (state.objects && Array.isArray(state.objects) && state.objects.length > 0) {
          for (const objData of state.objects) {
            try {
              if (objData.type === "path" || objData.type === "Path") {
                const path = new Path(objData.path, {
                  stroke: objData.stroke,
                  strokeWidth: objData.strokeWidth,
                  fill: objData.fill || "",
                  left: objData.left,
                  top: objData.top,
                  selectable: !isMonitorMode,
                  evented: !isMonitorMode,
                });
                (path as any).syncId = objData.syncId;
                if (objData.syncId) objectIdMap.current.set(objData.syncId, path);
                fabricCanvas.add(path);
              } else if (objData.type === "i-text" || objData.type === "IText") {
                const text = new IText(objData.text || "", {
                  left: objData.left,
                  top: objData.top,
                  fill: objData.fill,
                  fontSize: objData.fontSize,
                  selectable: !isMonitorMode,
                  evented: !isMonitorMode,
                });
                (text as any).syncId = objData.syncId;
                if (objData.syncId) objectIdMap.current.set(objData.syncId, text);
                fabricCanvas.add(text);
              } else if (objData.type === "image") {
                const imageSrc = objData.src;
                if (!imageSrc) {
                  console.warn(" Whiteboard: Image object has no src:", objData);
                  continue;
                }
                console.log(` Whiteboard: Loading image with src length: ${imageSrc.length}`);
                
                try {
                  const img = await FabricImage.fromURL(imageSrc);
                  img.set({
                    left: objData.left,
                    top: objData.top,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                    selectable: !isMonitorMode,
                    evented: !isMonitorMode,
                  });
                  (img as any).syncId = objData.syncId;
                  // Store the src for easier access during save
                  (img as any).originalSrc = imageSrc;
                  if (objData.syncId) objectIdMap.current.set(objData.syncId, img);
                  fabricCanvas.add(img);
                  console.log(" Whiteboard: Image loaded successfully");
                } catch (imgError) {
                  console.error(" Whiteboard: Error loading image:", imgError);
                }
              }
            } catch (e) {
              console.error("Error loading object:", e);
            }
          }
          fabricCanvas.renderAll();
          console.log(` Whiteboard: Successfully loaded and rendered ${state.objects.length} objects from database`);
        }
      } else {
        console.log(" Whiteboard: No saved state found in database");
      }
      
      // Setup realtime channel - SIMPLE WORKING VERSION
      channel = supabase.channel(`whiteboard-${sessionId}`, {
        config: {
          broadcast: { self: false },
          presence: isMonitorMode ? undefined : { key: user.id },
        },
      });
      
      channel
        .on("broadcast", { event: "whiteboard" }, ({ payload }: { payload: WhiteboardEvent }) => {
          console.log(` Whiteboard received broadcast: ${payload.type} from ${payload.oderId}`);
          
          // Handle manipulation events separately
          if (payload.type === "manipulating") {
            console.log(" Processing manipulation event:", payload.data);
            if (payload.data) {
              if (payload.data.action === null) {
                console.log(" Clearing manipulation for:", payload.oderId);
                setRemoteManipulations(prev => {
                  const newState = { ...prev };
                  delete newState[payload.oderId];
                  return newState;
                });
              } else {
                console.log(" Setting manipulation:", payload.oderId, payload.data);
                
                // Update the object position in real-time so the border follows it
                if (payload.data.objectId && payload.data.objectLeft !== undefined && fabricCanvas) {
                  const obj = objectIdMap.current.get(payload.data.objectId);
                  if (obj) {
                    obj.set({
                      left: payload.data.objectLeft,
                      top: payload.data.objectTop,
                      scaleX: payload.data.objectScaleX,
                      scaleY: payload.data.objectScaleY,
                      angle: payload.data.objectAngle,
                    });
                    obj.setCoords();
                    fabricCanvas.renderAll();
                  }
                }
                
                setRemoteManipulations(prev => ({
                  ...prev,
                  [payload.oderId]: payload.data,
                }));
              }
            }
            return;
          }
          
          // Handle cursor events separately (they don't need canvas)
          if (payload.type === "cursor") {
            if (payload.data) {
              setRemoteCursors(prev => ({
                ...prev,
                [payload.oderId]: payload.data,
              }));
            }
            return;
          }
          
          // Other events need the canvas
          if (fabricCanvas) {
            handleRemoteEvent(fabricCanvas, payload);
          }
        });
      
      // Only add presence handlers for non-monitor mode
      if (!isMonitorMode) {
        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const others = Object.keys(state).filter(k => {
              const arr = state[k] as any[];
              return arr.length > 0 && arr[0].oderId !== user.id;
            });
            setOtherUserPresent(others.length > 0);
          })
          .on("presence", { event: "join" }, () => {
            setOtherUserPresent(true);
          })
          .on("presence", { event: "leave" }, () => {
            const state = channel.presenceState();
            const others = Object.keys(state).filter(k => {
              const arr = state[k] as any[];
              return arr.length > 0 && arr[0].oderId !== user.id;
            });
            setOtherUserPresent(others.length > 0);
            if (others.length === 0) {
              setRemoteCursors({});
            }
          });
      }
      
      // Subscribe to channel - SIMPLE VERSION
      channel.subscribe(async (status: string) => {
        console.log(` Whiteboard channel subscription status: ${status} (isMonitorMode: ${isMonitorMode})`);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          channelRef.current = channel;
          
          // Only track presence for non-monitor mode
          if (!isMonitorMode) {
            await channel.track({
              oderId: user.id,
              userName: name,
              color,
            });
          } else {
            // For monitor mode, set other user present to true so whiteboard shows
            setOtherUserPresent(true);
          }
        } else if (status === "CHANNEL_ERROR") {
          console.error(" Whiteboard channel error");
        } else if (status === "TIMED_OUT") {
          console.error(" Whiteboard channel timed out");
        }
      });
    };
    
    init();
    
    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [sessionId, isMonitorMode, handleRemoteEvent]);

  // Auto-save whiteboard state every 2 seconds (only if there are changes) - SIMPLE VERSION
  useEffect(() => {
    if (!canvas || isMonitorMode) return;
    
    const autoSaveInterval = setInterval(() => {
      if (canvas && userId && hasUnsavedChanges.current) {
        saveState(canvas);
      }
    }, 2000); // Save every 2 seconds if there are changes
    
    // Also save on page unload
    const handleBeforeUnload = () => {
      if (canvas && userId && hasUnsavedChanges.current) {
        // Force save on unload
        saveState(canvas, true);
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save state on cleanup if there are changes
      if (canvas && userId && hasUnsavedChanges.current) {
        saveState(canvas, true);
      }
    };
  }, [canvas, isMonitorMode, userId, saveState]);

  // Monitor mode: Periodically refresh whiteboard state with optimized performance
  const lastUpdatedAtRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);
  
  useEffect(() => {
    if (!canvas || !isMonitorMode) return;
    
    const loadStateFromDatabase = async (isInitial: boolean = false) => {
      // Prevent concurrent refreshes
      if (isRefreshingRef.current && !isInitial) return;
      
      try {
        isRefreshingRef.current = true;
        
        const { data: existingState, error } = await supabase
          .from("whiteboard_states")
          .select("canvas_state, updated_at")
          .eq("session_id", sessionId)
          .maybeSingle();
        
        if (error) {
          console.error(" Monitor: Error fetching whiteboard state:", error);
          return;
        }
        
        if (!existingState?.canvas_state) {
          if (isInitial) {
            console.log(" Monitor: No whiteboard state found in database (blank canvas)");
          }
          return;
        }
        
        const state = existingState.canvas_state as any;
        const objectCount = state.objects?.length || 0;
        
        // Skip refresh if updated_at hasn't changed (unless initial load)
        if (!isInitial && lastUpdatedAtRef.current === existingState.updated_at) {
          return;
        }
        
        console.log(` Monitor: Loading whiteboard state - ${objectCount} objects, updated_at: ${existingState.updated_at}`);
        lastUpdatedAtRef.current = existingState.updated_at;
        
        if (state.objects && Array.isArray(state.objects)) {
          // Get current objects on canvas by syncId
          const currentObjects = new Map<string, any>();
          canvas.getObjects().forEach((obj: any) => {
            if (obj.syncId) {
              currentObjects.set(obj.syncId, obj);
            }
          });
          
          // Get objects from database by syncId
          const dbObjects = new Map<string, any>();
          state.objects.forEach((obj: any) => {
            if (obj.syncId) {
              dbObjects.set(obj.syncId, obj);
            }
          });
          
          // Remove objects that are no longer in database
          currentObjects.forEach((obj, syncId) => {
            if (!dbObjects.has(syncId)) {
              console.log(` Monitor: Removing object ${syncId} (not in database)`);
              canvas.remove(obj);
              objectIdMap.current.delete(syncId);
            }
          });
          
          // Add or update objects from database
          for (const objData of state.objects) {
            if (!objData.syncId) continue;
            
            const existingObj = currentObjects.get(objData.syncId);
            
            if (existingObj) {
              // Object exists - update its properties (but don't recreate)
              existingObj.set({
                left: objData.left,
                top: objData.top,
                scaleX: objData.scaleX,
                scaleY: objData.scaleY,
                angle: objData.angle,
              });
              if (objData.text !== undefined) {
                existingObj.set({ text: objData.text });
              }
            } else {
              // Object doesn't exist - create it
              try {
                if (objData.type === "path" || objData.type === "Path") {
                  const path = new Path(objData.path, {
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                    fill: objData.fill || "",
                    left: objData.left,
                    top: objData.top,
                    selectable: false,
                    evented: false,
                  });
                  (path as any).syncId = objData.syncId;
                  objectIdMap.current.set(objData.syncId, path);
                  canvas.add(path);
                } else if (objData.type === "i-text" || objData.type === "IText") {
                  const text = new IText(objData.text || "", {
                    left: objData.left,
                    top: objData.top,
                    fill: objData.fill,
                    fontSize: objData.fontSize,
                    selectable: false,
                    evented: false,
                  });
                  (text as any).syncId = objData.syncId;
                  objectIdMap.current.set(objData.syncId, text);
                  canvas.add(text);
                } else if (objData.type === "image") {
                  const imageSrc = objData.src;
                  if (!imageSrc) {
                    console.warn(" Monitor: Image object has no src:", objData.syncId);
                    continue;
                  }
                  console.log(` Monitor: Loading new image ${objData.syncId}, src length: ${imageSrc.length}`);
                  
                  FabricImage.fromURL(imageSrc).then((img) => {
                    // Check if object was already added via broadcast while we were loading
                    if (objectIdMap.current.has(objData.syncId)) {
                      console.log(` Monitor: Image ${objData.syncId} already exists, skipping`);
                      return;
                    }
                    
                    img.set({
                      left: objData.left,
                      top: objData.top,
                      scaleX: objData.scaleX,
                      scaleY: objData.scaleY,
                      selectable: false,
                      evented: false,
                    });
                    (img as any).syncId = objData.syncId;
                    (img as any).originalSrc = imageSrc;
                    objectIdMap.current.set(objData.syncId, img);
                    canvas.add(img);
                    canvas.renderAll();
                    console.log(` Monitor: Image ${objData.syncId} loaded successfully`);
                  }).catch(e => {
                    console.error(" Monitor: Error loading image:", e);
                  });
                }
              } catch (e) {
                console.error("Error loading object during refresh:", e);
              }
            }
          }
          
          canvas.renderAll();
          console.log(` Monitor: Refresh complete - ${state.objects.length} objects in database, ${canvas.getObjects().length} on canvas`);
        }
      } catch (error) {
        console.error("Error refreshing whiteboard state:", error);
      } finally {
        isRefreshingRef.current = false;
      }
    };
    
    // Load initial state immediately
    loadStateFromDatabase(true);
    
    // Then refresh every 2 seconds (increased from 1.5s for better performance)
    const refreshInterval = setInterval(() => loadStateFromDatabase(false), 2000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [canvas, isMonitorMode, sessionId]);


  // Setup canvas event handlers
  useEffect(() => {
    if (!canvas || isMonitorMode) return;
    
    // Drawing completed
    const handlePathCreated = (e: any) => {
      if (isProcessingRemote.current || !e.path) return;
      
      const id = generateId();
      (e.path as any).syncId = id;
      objectIdMap.current.set(id, e.path);
      
      broadcast({
        type: "draw",
        data: {
          path: e.path.path,
          stroke: e.path.stroke,
          strokeWidth: e.path.strokeWidth,
        },
        oderId: userId,
        objectId: id,
      });
      
      markDirty();
      saveState(canvas, true); // Force immediate save after drawing
    };
    
    // Object modified
    const handleObjectModified = (e: any) => {
      if (isProcessingRemote.current || !e.target) return;
      
      const syncId = (e.target as any).syncId;
      if (!syncId) return;
      
      broadcast({
        type: "modify",
        data: {
          left: e.target.left,
          top: e.target.top,
          scaleX: e.target.scaleX,
          scaleY: e.target.scaleY,
          angle: e.target.angle,
          text: e.target.text,
        },
        oderId: userId,
        objectId: syncId,
      });
      
      markDirty();
    };
    
    // Text changed
    const handleTextChanged = (e: any) => {
      if (isProcessingRemote.current || !e.target) return;
      
      const syncId = (e.target as any).syncId;
      if (!syncId) return;
      
      broadcast({
        type: "modify",
        data: { text: e.target.text },
        oderId: userId,
        objectId: syncId,
      });
      
      markDirty();
    };
    
    // Mouse move for cursor - SIMPLE VERSION
    let lastCursorTime = 0;
    const handleMouseMove = (e: any) => {
      if (!e.pointer) return;
      
      const now = Date.now();
      if (now - lastCursorTime < 50) return; // Throttle to 20fps
      lastCursorTime = now;
      
      broadcast({
        type: "cursor",
        data: {
          x: e.pointer.x,
          y: e.pointer.y,
          oderId: userId,
          userName,
          color: userColor,
        },
        oderId: userId,
      });
    };
    
    // Mouse down for tools
    const handleMouseDown = (e: any) => {
      if (!e.pointer) return;
      
      // Eraser - delete clicked object
      if (activeTool === "eraser" && e.target) {
        const syncId = (e.target as any).syncId;
        canvas.remove(e.target);
        if (syncId) {
          objectIdMap.current.delete(syncId);
          broadcast({
            type: "delete",
            data: null,
            oderId: userId,
            objectId: syncId,
          });
        }
        markDirty();
        saveState(canvas, true);
        return;
      }
      
      // Text tool - create new text
      if (activeTool === "text" && !e.target) {
        const id = generateId();
        const text = new IText("Type here", {
          left: e.pointer.x,
          top: e.pointer.y,
          fill: drawColor,
          fontSize: 20,
          fontFamily: "Arial",
        });
        (text as any).syncId = id;
        objectIdMap.current.set(id, text);
        
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        
        broadcast({
          type: "text",
          data: {
            text: "Type here",
            left: e.pointer.x,
            top: e.pointer.y,
            fill: drawColor,
            fontSize: 20,
          },
          oderId: userId,
          objectId: id,
        });
        
        markDirty();
      }
    };
    
    canvas.on("path:created", handlePathCreated);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("text:changed", handleTextChanged);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:down", handleMouseDown);
    
    // Throttle manipulation broadcasts to prevent overwhelming the channel
    let lastManipulationBroadcast = 0;
    const MANIPULATION_THROTTLE_MS = 100; // Broadcast at most every 100ms
    
    // Object manipulation events - show indicator while user is manipulating
    const handleObjectMoving = (e: any) => {
      if (isProcessingRemote.current || !e.target) return;
      
      const now = Date.now();
      if (now - lastManipulationBroadcast < MANIPULATION_THROTTLE_MS) return;
      lastManipulationBroadcast = now;
      
      const syncId = (e.target as any).syncId;
      console.log(" Object moving (throttled):", { syncId, userName, userColor, userId });
      broadcast({
        type: "manipulating",
        data: {
          objectId: syncId,
          x: e.target.left + (e.target.width * (e.target.scaleX || 1)) / 2,
          y: e.target.top - 20,
          userName,
          color: userColor,
          action: "moving",
          // Include object transform for real-time position sync
          objectLeft: e.target.left,
          objectTop: e.target.top,
          objectScaleX: e.target.scaleX,
          objectScaleY: e.target.scaleY,
          objectAngle: e.target.angle,
        },
        oderId: userId,
        objectId: syncId,
      });
    };
    
    const handleObjectScaling = (e: any) => {
      if (isProcessingRemote.current || !e.target) return;
      
      const now = Date.now();
      if (now - lastManipulationBroadcast < MANIPULATION_THROTTLE_MS) return;
      lastManipulationBroadcast = now;
      
      const syncId = (e.target as any).syncId;
      broadcast({
        type: "manipulating",
        data: {
          objectId: syncId,
          x: e.target.left + (e.target.width * (e.target.scaleX || 1)) / 2,
          y: e.target.top - 20,
          userName,
          color: userColor,
          action: "resizing",
          // Include object transform for real-time position sync
          objectLeft: e.target.left,
          objectTop: e.target.top,
          objectScaleX: e.target.scaleX,
          objectScaleY: e.target.scaleY,
          objectAngle: e.target.angle,
        },
        oderId: userId,
        objectId: syncId,
      });
    };
    
    const handleObjectRotating = (e: any) => {
      if (isProcessingRemote.current || !e.target) return;
      
      const now = Date.now();
      if (now - lastManipulationBroadcast < MANIPULATION_THROTTLE_MS) return;
      lastManipulationBroadcast = now;
      
      const syncId = (e.target as any).syncId;
      broadcast({
        type: "manipulating",
        data: {
          objectId: syncId,
          x: e.target.left + (e.target.width * (e.target.scaleX || 1)) / 2,
          y: e.target.top - 20,
          userName,
          color: userColor,
          action: "rotating",
          // Include object transform for real-time position sync
          objectLeft: e.target.left,
          objectTop: e.target.top,
          objectScaleX: e.target.scaleX,
          objectScaleY: e.target.scaleY,
          objectAngle: e.target.angle,
        },
        oderId: userId,
        objectId: syncId,
      });
    };
    
    const handleSelectionCleared = () => {
      // Clear manipulation indicator when selection is cleared
      console.log(" Selection cleared");
      broadcast({
        type: "manipulating",
        data: {
          action: null,
        },
        oderId: userId,
      });
    };
    
    // Don't clear on mouse up - only clear when selection is cleared
    // This keeps the border visible while the object is selected
    
    // Check if an object is being used by another user
    const isObjectInUseByOther = (syncId: string): { inUse: boolean; userName?: string } => {
      for (const [oderId, manipulation] of Object.entries(remoteManipulations)) {
        if (manipulation.objectId === syncId && manipulation.action !== null) {
          return { inUse: true, userName: manipulation.userName };
        }
      }
      return { inUse: false };
    };
    
    // When an object is selected, check if it's in use and broadcast
    const handleSelectionCreated = (e: any) => {
      if (isProcessingRemote.current) return;
      const target = e.selected?.[0];
      if (!target) return;
      
      const syncId = (target as any).syncId;
      
      // Check if this object is being used by another user
      const { inUse, userName: otherUserName } = isObjectInUseByOther(syncId);
      if (inUse && otherUserName) {
        toast.warning(`This object is being used by ${otherUserName}`);
        // Deselect the object - prevent user from using it
        canvas.discardActiveObject();
        canvas.renderAll();
        return; // Don't broadcast our own selection
      }
      
      console.log(" Object selected:", { syncId, userName });
      broadcast({
        type: "manipulating",
        data: {
          objectId: syncId,
          x: target.left + (target.width * (target.scaleX || 1)) / 2,
          y: target.top - 20,
          userName,
          color: userColor,
          action: "using",
        },
        oderId: userId,
        objectId: syncId,
      });
    };
    
    canvas.on("object:moving", handleObjectMoving);
    canvas.on("object:scaling", handleObjectScaling);
    canvas.on("object:rotating", handleObjectRotating);
    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:cleared", handleSelectionCleared);
    
    return () => {
      canvas.off("path:created", handlePathCreated);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("text:changed", handleTextChanged);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("object:moving", handleObjectMoving);
      canvas.off("object:scaling", handleObjectScaling);
      canvas.off("object:rotating", handleObjectRotating);
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:cleared", handleSelectionCleared);
    };
  }, [canvas, isMonitorMode, activeTool, drawColor, userId, userName, userColor, broadcast, saveState, markDirty, remoteManipulations]);

  // Update canvas mode when tool changes
  useEffect(() => {
    if (!canvas || isMonitorMode) return;
    
    const isEnabled = isConnected && (otherUserPresent || isSessionInProgress) && isPeerConnected;
    
    if (!isEnabled) {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "not-allowed";
      return;
    }
    
    canvas.selection = activeTool === "select";
    canvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw") {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = drawColor;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.defaultCursor = "crosshair";
    } else if (activeTool === "text") {
      canvas.defaultCursor = "text";
    } else if (activeTool === "eraser") {
      canvas.defaultCursor = "crosshair";
    } else {
      canvas.defaultCursor = "default";
    }
  }, [canvas, activeTool, drawColor, brushSize, isMonitorMode, isConnected, otherUserPresent, isSessionInProgress, isPeerConnected]);

  // Update brush color/size
  useEffect(() => {
    if (canvas?.freeDrawingBrush && activeTool === "draw") {
      canvas.freeDrawingBrush.color = drawColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [canvas, drawColor, brushSize, activeTool]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      canvas.renderAll();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvas]);

  // Compress image to reduce size for broadcasting
  const compressImage = (dataUrl: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG for better compression (unless it's a PNG with transparency)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        console.log(` Image compressed: ${Math.round(dataUrl.length / 1024)}KB -> ${Math.round(compressedDataUrl.length / 1024)}KB`);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;
    
    // Check file size - warn if very large
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      toast.warning("Large image detected. Compressing...");
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      let dataUrl = event.target?.result as string;
      
      try {
        // Compress image if it's too large (> 100KB base64)
        if (dataUrl.length > 100 * 1024) {
          console.log(` Compressing large image (${Math.round(dataUrl.length / 1024)}KB)`);
          dataUrl = await compressImage(dataUrl, 800, 0.7);
          
          // If still too large, compress more aggressively
          if (dataUrl.length > 500 * 1024) {
            console.log(` Still large, compressing more aggressively`);
            dataUrl = await compressImage(dataUrl, 600, 0.5);
          }
        }
        
        const img = await FabricImage.fromURL(dataUrl);
        const id = generateId();
        
        // Scale down if too large
        const maxSize = 300;
        const scale = Math.min(maxSize / img.width!, maxSize / img.height!, 1);
        
        img.set({
          left: 50,
          top: 50,
          scaleX: scale,
          scaleY: scale,
        });
        (img as any).syncId = id;
        // Store the src directly on the object for easier access during save
        (img as any).originalSrc = dataUrl;
        objectIdMap.current.set(id, img);
        
        canvas.add(img);
        canvas.renderAll();
        
        // Check if image data is too large for broadcast (Supabase limit is ~1MB)
        if (dataUrl.length > 800 * 1024) {
          console.warn(" Image too large for real-time sync, will only be saved to database");
          toast.info("Image added (large file - may take a moment to sync)");
        } else {
          broadcast({
            type: "image",
            data: {
              src: dataUrl,
              left: 50,
              top: 50,
              scaleX: scale,
              scaleY: scale,
            },
            oderId: userId,
            objectId: id,
          });
          toast.success("Image added");
        }
        
        markDirty();
        saveState(canvas, true);
      } catch (err) {
        toast.error("Failed to add image");
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    if (!canvas) return;
    
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    objectIdMap.current.clear();
    canvas.renderAll();
    
    broadcast({
      type: "clear",
      data: null,
      oderId: userId,
    });
    
    markDirty();
    saveState(canvas, true);
    toast.success("Canvas cleared");
  };

  // Refresh connection - reconnect whiteboard channel without reloading page
  const refreshConnection = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }
    
    toast.info("Reconnecting whiteboard...");
    
    // Remove existing channel
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setIsConnected(false);
    setOtherUserPresent(false);
    setRemoteCursors({});
    setRemoteManipulations({});
    
    // Reload state from database
    try {
      const { data: existingState, error } = await supabase
        .from("whiteboard_states")
        .select("canvas_state, updated_at")
        .eq("session_id", sessionId)
        .maybeSingle();
      
      if (!error && existingState?.canvas_state) {
        const state = existingState.canvas_state as any;
        console.log(` Whiteboard refresh: Loading ${state.objects?.length || 0} objects from database`);
        
        // Clear and reload canvas
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        objectIdMap.current.clear();
        
        if (state.objects && Array.isArray(state.objects)) {
          for (const objData of state.objects) {
            try {
              if (objData.type === "path" || objData.type === "Path") {
                const path = new Path(objData.path, {
                  stroke: objData.stroke,
                  strokeWidth: objData.strokeWidth,
                  fill: objData.fill || "",
                  left: objData.left,
                  top: objData.top,
                  selectable: !isMonitorMode,
                  evented: !isMonitorMode,
                });
                (path as any).syncId = objData.syncId;
                if (objData.syncId) objectIdMap.current.set(objData.syncId, path);
                canvas.add(path);
              } else if (objData.type === "i-text" || objData.type === "IText") {
                const text = new IText(objData.text || "", {
                  left: objData.left,
                  top: objData.top,
                  fill: objData.fill,
                  fontSize: objData.fontSize,
                  selectable: !isMonitorMode,
                  evented: !isMonitorMode,
                });
                (text as any).syncId = objData.syncId;
                if (objData.syncId) objectIdMap.current.set(objData.syncId, text);
                canvas.add(text);
              } else if (objData.type === "image") {
                const img = await FabricImage.fromURL(objData.src);
                img.set({
                  left: objData.left,
                  top: objData.top,
                  scaleX: objData.scaleX,
                  scaleY: objData.scaleY,
                  selectable: !isMonitorMode,
                  evented: !isMonitorMode,
                });
                (img as any).syncId = objData.syncId;
                // Store the src for easier access during save
                (img as any).originalSrc = objData.src;
                if (objData.syncId) objectIdMap.current.set(objData.syncId, img);
                canvas.add(img);
              }
            } catch (e) {
              console.error("Error loading object during refresh:", e);
            }
          }
        }
        canvas.renderAll();
      }
    } catch (err) {
      console.error("Error loading whiteboard state during refresh:", err);
    }
    
    // Reconnect to realtime channel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    
    const channel = supabase.channel(`whiteboard-${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: isMonitorMode ? undefined : { key: user.id },
      },
    });
    
    channel
      .on("broadcast", { event: "whiteboard" }, ({ payload }: { payload: WhiteboardEvent }) => {
        console.log(` Whiteboard received broadcast: ${payload.type} from ${payload.oderId}`);
        if (canvas) {
          handleRemoteEvent(canvas, payload);
        }
      });
    
    if (!isMonitorMode) {
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const others = Object.keys(state).filter(k => {
            const arr = state[k] as any[];
            return arr.length > 0 && arr[0].oderId !== user.id;
          });
          setOtherUserPresent(others.length > 0);
        })
        .on("presence", { event: "join" }, () => {
          setOtherUserPresent(true);
        })
        .on("presence", { event: "leave" }, () => {
          const state = channel.presenceState();
          const others = Object.keys(state).filter(k => {
            const arr = state[k] as any[];
            return arr.length > 0 && arr[0].oderId !== user.id;
          });
          setOtherUserPresent(others.length > 0);
          if (others.length === 0) {
            setRemoteCursors({});
          }
        });
    }
    
    channel.subscribe(async (status: string) => {
      console.log(` Whiteboard refresh channel status: ${status}`);
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        channelRef.current = channel;
        
        if (!isMonitorMode) {
          await channel.track({
            oderId: user.id,
            userName,
            color: userColor,
          });
        } else {
          setOtherUserPresent(true);
        }
        
        toast.success("Whiteboard reconnected!");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        toast.error("Failed to reconnect whiteboard");
      }
    });
  };

  // Determine if whiteboard is usable
  // isPeerConnected from parent is the source of truth for video connection status
  // isConnected is for the whiteboard's own realtime channel
  const isWhiteboardEnabled = isConnected && (otherUserPresent || isSessionInProgress) && isPeerConnected;
  const showOverlay = !isMonitorMode && !isWhiteboardEnabled;
  
  // When peer disconnects, clear remote cursors and manipulations to indicate they're gone
  useEffect(() => {
    if (!isPeerConnected) {
      setRemoteCursors({});
      setRemoteManipulations({});
    }
  }, [isPeerConnected]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Toolbar - Hidden in monitor mode */}
      {!isMonitorMode && (
        <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center gap-3 flex-wrap shadow-lg">
          {/* Connection Status */}
          <Badge variant={isWhiteboardEnabled ? "default" : "secondary"} className={isWhiteboardEnabled ? "bg-green-500 hover:bg-green-600 text-white" : "bg-slate-600 text-slate-200"}>
            {!isConnected ? "Connecting..." : !otherUserPresent && !isSessionInProgress ? "Waiting..." : isWhiteboardEnabled ? "✓ Ready" : "Connecting..."}
          </Badge>
          
          <Separator orientation="vertical" className="h-6 bg-slate-600" />
          
          {/* Tools */}
          <div className="flex gap-2">
            <Button
              variant={activeTool === "select" ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveTool("select")}
              disabled={!isWhiteboardEnabled}
              title="Move & Select"
              className={activeTool === "select" 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                : "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
              }
            >
              <MousePointer2 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Move</span>
            </Button>
            <Button
              variant={activeTool === "draw" ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveTool("draw")}
              disabled={!isWhiteboardEnabled}
              title="Draw"
              className={activeTool === "draw" 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                : "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
              }
            >
              <Minus className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Draw</span>
            </Button>
            <Button
              variant={activeTool === "text" ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveTool("text")}
              disabled={!isWhiteboardEnabled}
              title="Add Text"
              className={activeTool === "text" 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                : "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
              }
            >
              <Type className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Text</span>
            </Button>
            <Button
              variant={activeTool === "eraser" ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveTool("eraser")}
              disabled={!isWhiteboardEnabled}
              title="Eraser"
              className={activeTool === "eraser" 
                ? "bg-red-600 hover:bg-red-700 text-white shadow-md" 
                : "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
              }
            >
              <Eraser className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Erase</span>
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6 bg-slate-600" />
          
          {/* Color & Size */}
          <div className="flex items-center gap-2">
            <label className="text-slate-300 text-sm font-medium">Color:</label>
            <div className="relative">
              <input
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                disabled={!isWhiteboardEnabled}
                className="w-10 h-8 rounded-md cursor-pointer disabled:opacity-50 border-2 border-slate-600 bg-slate-700"
                title="Choose Color"
              />
              <div 
                className="absolute inset-1 rounded-sm pointer-events-none border border-white/20"
                style={{ backgroundColor: drawColor }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-slate-300 text-sm font-medium">Size:</label>
            <select
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              disabled={!isWhiteboardEnabled}
              className="h-8 px-3 rounded-md border border-slate-600 bg-slate-700 text-slate-200 text-sm disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2}>Thin (2px)</option>
              <option value={4}>Medium (4px)</option>
              <option value={8}>Thick (8px)</option>
              <option value={12}>Extra Thick (12px)</option>
            </select>
          </div>
          
          <Separator orientation="vertical" className="h-6 bg-slate-600" />
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isWhiteboardEnabled}
              title="Upload Image"
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:border-slate-500"
            >
              <Image className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Image</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshConnection}
              title="Refresh Connection"
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:border-slate-500"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Refresh</span>
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={clearCanvas}
              disabled={!isWhiteboardEnabled}
              title="Clear All"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-md"
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} />
        
        {/* Connecting Overlay */}
        {showOverlay && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="font-medium text-gray-800">
                {!isConnected 
                  ? "Connecting to whiteboard..." 
                  : !isPeerConnected 
                    ? "Video connection lost..." 
                    : "Waiting for other user..."}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {!isPeerConnected && isConnected
                  ? "Whiteboard will resume when video reconnects"
                  : "The whiteboard will be ready when both users are connected"}
              </p>
            </div>
          </div>
        )}
        
        {/* Remote Cursors - Show in both regular and monitor mode */}
        {Object.entries(remoteCursors).map(([oderId, cursor]) => (
          <div
            key={oderId}
            className="absolute pointer-events-none z-40"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: "translate(-2px, -2px)",
              transition: "left 50ms linear, top 50ms linear",
            }}
          >
            {/* Cursor pointer SVG */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{ filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))" }}
            >
              <path 
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" 
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <span
              className="absolute left-5 top-4 text-xs px-1.5 py-0.5 rounded whitespace-nowrap font-medium shadow-sm"
              style={{ backgroundColor: cursor.color, color: "white" }}
            >
              {cursor.userName}
            </span>
          </div>
        ))}
        
        {/* Remote Manipulation Indicators - Show who is moving/resizing/rotating objects */}
        {/* Uses pre-calculated manipulationBounds state that updates every 50ms for smooth tracking */}
        {Object.entries(remoteManipulations).map(([oderId, manipulation]) => {
          // Use the pre-calculated bounds from manipulationBounds state (updated every 50ms)
          // This ensures the border follows the object in real-time
          const objectBounds = manipulationBounds[oderId] || null;
          
          // If we found the object, use its current position for the popup
          // Otherwise fall back to the manipulation event coordinates
          const popupX = objectBounds ? objectBounds.left + objectBounds.width / 2 : manipulation.x;
          const popupY = objectBounds ? objectBounds.top - 10 : manipulation.y;
          
          return (
            <div key={`manipulation-${oderId}`}>
              {/* Dotted border around the object being manipulated - follows object position */}
              {objectBounds && (
                <div
                  className="absolute pointer-events-none z-40"
                  style={{
                    left: objectBounds.left - 6,
                    top: objectBounds.top - 6,
                    width: objectBounds.width + 12,
                    height: objectBounds.height + 12,
                    border: `3px dotted #ff6b6b`,
                    borderRadius: 4,
                  }}
                />
              )}
              {/* Popup indicator showing who is manipulating */}
              <div
                className="absolute pointer-events-none z-50"
                style={{
                  left: popupX,
                  top: popupY,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-full shadow-lg text-white text-xs font-medium whitespace-nowrap animate-pulse"
                  style={{ backgroundColor: manipulation.color }}
                >
                  {manipulation.action === "using" && (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      <span>{manipulation.userName} is using this</span>
                    </>
                  )}
                  {manipulation.action === "moving" && (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
                      </svg>
                      <span>{manipulation.userName} is moving this</span>
                    </>
                  )}
                  {manipulation.action === "resizing" && (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                      <span>{manipulation.userName} is resizing this</span>
                    </>
                  )}
                  {manipulation.action === "rotating" && (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                      </svg>
                      <span>{manipulation.userName} is rotating this</span>
                    </>
                  )}
                  {manipulation.action === "drawing" && (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                        <path d="M2 2l7.586 7.586"/>
                      </svg>
                      <span>{manipulation.userName} is drawing</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
