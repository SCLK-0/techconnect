import { useEffect, useRef, useState } from "react";
import { Canvas, PencilBrush, IText, FabricImage, Rect as FabricRect, Text } from "fabric";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer2,
  Type,
  Minus,
  Eraser,
  Image,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type WhiteboardEvent = {
  type: "path:created" | "object:added" | "object:modified" | "object:removed" | "canvas:cleared" | "text:changed" | "cursor:move" | "drawing:progress";
  data: any;
  userId: string;
  objectId?: string;
};

type CursorPosition = {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
};

type UserPresence = {
  userId: string;
  userName: string;
  editingObjectId: string | null;
  color: string;
};

interface WhiteboardCanvasProps {
  sessionId: string;
  isMonitorMode?: boolean;
}

type Tool = "select" | "draw" | "text" | "eraser";

export function WhiteboardCanvas({ sessionId, isMonitorMode = false }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const activeToolRef = useRef<Tool>("select");
  const [drawColor, setDrawColor] = useState("#000000");
  const drawColorRef = useRef("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userColor, setUserColor] = useState<string>("");
  const [userPresences, setUserPresences] = useState<Record<string, UserPresence>>({});
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorPosition>>({});
  const isRemoteUpdate = useRef(false);
  const channelRef = useRef<any>(null);
  const isChannelReady = useRef(false);
  // Removed isSyncing state - no longer showing overlay
  const userPresencesRef = useRef<Record<string, UserPresence>>({});
  const lastBroadcastTime = useRef<number>(0);
  const transformingObject = useRef<any>(null);
  const remoteDrawingPaths = useRef<Record<string, any>>({});
  const isDrawing = useRef(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initCanvas = async () => {
      if (!canvasRef.current) return;

      const container = canvasRef.current.parentElement;
      if (!container) return;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      // Generate a unique color for this user
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      setUserColor(color);
      
      // Get user name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      
      const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
      setUserName(displayName);

      const updateCanvasSize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        if (canvas) {
          canvas.setDimensions({ width, height });
          canvas.renderAll();
        }
      };

      // Use full container size
      const canvasWidth = container.clientWidth;
      const canvasHeight = container.clientHeight;

      const fabricCanvas = new Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#ffffff",
        selection: !isMonitorMode, // Disable selection for monitors
      });

      // For monitor mode, make canvas completely non-interactive
      if (isMonitorMode) {
        fabricCanvas.selection = false;
        fabricCanvas.skipTargetFind = true;
        // Make all objects non-selectable
        fabricCanvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        console.log("👀 Monitor mode - canvas is view-only");
      }

      // Ensure white background is rendered immediately
      fabricCanvas.renderAll();
      
      setCanvas(fabricCanvas);
      
      // Load existing whiteboard state from database
      const { data: existingState } = await supabase
        .from('whiteboard_states')
        .select('canvas_state')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (existingState?.canvas_state) {
        try {
          console.log('📥 Loading existing whiteboard state...');
          const canvasState = existingState.canvas_state as any;
          
          if (canvasState.objects && Array.isArray(canvasState.objects)) {
            console.log(`Found ${canvasState.objects.length} objects to restore`);
            
            // Load objects from saved state
            for (const objData of canvasState.objects) {
              console.log('Restoring:', objData.type, 'stroke:', objData.stroke, 'width:', objData.strokeWidth);
              
              if (objData.type === 'path' || objData.type === 'Path') {
                const { Path } = await import("fabric");
                const path = new Path(objData.path, {
                  stroke: objData.stroke,
                  strokeWidth: objData.strokeWidth,
                  fill: objData.fill || '',
                  strokeLineCap: objData.strokeLineCap,
                  strokeLineJoin: objData.strokeLineJoin,
                  left: objData.left,
                  top: objData.top,
                  scaleX: objData.scaleX,
                  scaleY: objData.scaleY,
                  angle: objData.angle,
                  opacity: objData.opacity,
                });
                (path as any).syncId = objData.syncId;
                (path as any).userId = objData.userId;
                
                // Make non-interactive for monitors
                if (isMonitorMode) {
                  path.selectable = false;
                  path.evented = false;
                }
                
                fabricCanvas.add(path);
              } else if (objData.type === 'i-text' || objData.type === 'IText') {
                const text = new IText(objData.text || '', {
                  left: objData.left,
                  top: objData.top,
                  fill: objData.fill,
                  fontSize: objData.fontSize,
                  fontFamily: objData.fontFamily,
                });
                (text as any).syncId = objData.syncId;
                (text as any).userId = objData.userId;
                
                // Make non-interactive for monitors
                if (isMonitorMode) {
                  text.selectable = false;
                  text.evented = false;
                }
                
                fabricCanvas.add(text);
              } else if (objData.type === 'image') {
                const img = await FabricImage.fromURL(objData.src);
                img.set({
                  left: objData.left,
                  top: objData.top,
                  scaleX: objData.scaleX,
                  scaleY: objData.scaleY,
                  angle: objData.angle,
                });
                (img as any).syncId = objData.syncId;
                (img as any).userId = objData.userId;
                
                // Make non-interactive for monitors
                if (isMonitorMode) {
                  img.selectable = false;
                  img.evented = false;
                }
                
                fabricCanvas.add(img);
              }
            }
            
            fabricCanvas.renderAll();
            console.log('✅ Whiteboard restored with', canvasState.objects.length, 'objects');
            // Don't show toast for whiteboard restore to reduce noise
          } else {
            console.log('No objects found in saved state');
          }
        } catch (error) {
          console.error('❌ Error loading whiteboard state:', error);
          toast.error('Failed to restore whiteboard');
        }
      } else {
        console.log('No existing whiteboard state found');
      }

      // Handle window resize
      window.addEventListener('resize', updateCanvasSize);

      // Real-time collaboration channel with retry logic
      // IMPORTANT: All participants (tutor, learner, monitor) use the SAME channel name
      // to ensure everyone sees the same whiteboard state
      const channelName = `whiteboard-session-${sessionId}`;
      console.log(`🔗 Connecting to shared whiteboard channel: ${channelName}`);
      console.log(`👤 User: ${displayName} (${user.id.substring(0, 8)}), Monitor: ${isMonitorMode}`);
      
      const channelConfig = {
        config: { 
          broadcast: { self: false },
          presence: { key: isMonitorMode ? '' : user.id }
        }
      };
      
      let subscriptionAttempts = 0;
      const maxAttempts = 3;
      
      const attemptSubscription = async () => {
        subscriptionAttempts++;
        console.log(`📡 Whiteboard subscription attempt ${subscriptionAttempts}/${maxAttempts} for ${displayName}`);
        
        const channel = supabase
          .channel(channelName, channelConfig)
          .on("broadcast", { event: "whiteboard-event" }, ({ payload }: { payload: WhiteboardEvent }) => {
            console.log(`📥 ${displayName} RECEIVED:`, payload.type, "from user:", payload.userId.substring(0, 8));
            
            // Skip processing our own events
            if (payload.userId === user.id) {
              console.log(`⏭️ ${displayName} skipping own event`);
              return;
            }
            
            console.log(`✅ ${displayName} processing remote event:`, payload.type);
            
            if (payload.type === "cursor:move") {
              setRemoteCursors(prev => ({
                ...prev,
                [payload.userId]: payload.data
              }));
            } else if (payload.type === "drawing:progress") {
              handleDrawingProgress(fabricCanvas, payload);
            } else {
              isRemoteUpdate.current = true;
              handleRemoteEvent(fabricCanvas, payload);
              isRemoteUpdate.current = false;
            }
          })
          .on("presence", { event: "sync" }, () => {
            if (isMonitorMode) return;
            
            const state = channel.presenceState();
            console.log(`👥 ${displayName} presence sync, users online:`, Object.keys(state).length);
            const presences: Record<string, UserPresence> = {};
            Object.keys(state).forEach((key) => {
              const presenceArray = state[key] as any[];
              if (presenceArray.length > 0) {
                const presence = presenceArray[0];
                if (presence.userId && presence.userId !== user.id) {
                  presences[presence.userId] = {
                    userId: presence.userId,
                    userName: presence.userName,
                    editingObjectId: presence.editingObjectId,
                    color: presence.color,
                  };
                }
              }
            });
            setUserPresences(presences);
            updateObjectIndicators(fabricCanvas, presences);
          })
          .on("presence", { event: "join" }, ({ newPresences }) => {
            console.log(`👋 ${displayName} saw user join whiteboard:`, newPresences);
          })
          .on("presence", { event: "leave" }, ({ leftPresences }) => {
            console.log(`👋 ${displayName} saw user leave whiteboard:`, leftPresences);
          });
        
        // Subscribe with timeout
        const subscribePromise = new Promise<string>((resolve) => {
          channel.subscribe((status) => {
            console.log(`📡 ${displayName} channel status:`, status);
            resolve(status);
          });
        });
        
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => resolve('TIMEOUT'), 10000); // 10 second timeout
        });
        
        const status = await Promise.race([subscribePromise, timeoutPromise]);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ ${displayName} whiteboard channel SUBSCRIBED to ${channelName}`);
          channelRef.current = channel;
          
          // Only track presence if not in monitor mode
          if (!isMonitorMode) {
            await channel.track({
              userId: user.id,
              userName: displayName,
              editingObjectId: null,
              color: color,
            });
            console.log(`✅ ${displayName} presence tracked on channel`);
            
            // Set channel ready immediately - no delay
            isChannelReady.current = true;
            toast.success("Whiteboard ready");
            console.log(`🎨 ${displayName} channel is now ready for broadcasts`);
          } else {
            console.log(`👀 ${displayName} in monitor mode - not tracking presence`);
            isChannelReady.current = true;
          }
          
          return channel;
        } else if (status === 'TIMEOUT' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`❌ ${displayName} subscription ${status} on attempt ${subscriptionAttempts}`);
          
          // Clean up failed channel
          await supabase.removeChannel(channel);
          
          if (subscriptionAttempts < maxAttempts) {
            console.log(`🔄 ${displayName} retrying subscription in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return attemptSubscription();
          } else {
            console.error(`❌ ${displayName} failed to subscribe after ${maxAttempts} attempts`);
            toast.error("Whiteboard sync failed - drawing will not sync");
            isChannelReady.current = false;
            return channel; // Return channel anyway for cleanup
          }
        }
        
        return channel;
      };
      
      const channel = await attemptSubscription();
      
      // Channel is set inside attemptSubscription on success

      // Track drawing start and progress
      if (!isMonitorMode) {
        fabricCanvas.on("mouse:down", (e) => {
          if (fabricCanvas.isDrawingMode) {
            isDrawing.current = true;
          }
          
          // Handle eraser tool - one-click delete
          if (activeToolRef.current === "eraser" && e.target) {
            fabricCanvas.remove(e.target);
            fabricCanvas.renderAll();
            return;
          }
          
          // Handle text tool
          if (activeToolRef.current === "text" && e.pointer) {
            // If clicking on existing text object, enter editing mode
            if (e.target && (e.target.type === "i-text" || e.target.type === "IText")) {
              fabricCanvas.setActiveObject(e.target);
              (e.target as IText).enterEditing();
              fabricCanvas.renderAll();
              return;
            }
            
            // If clicking on empty space, create new text
            if (!e.target) {
              // Ensure text has good contrast against white background
              const getTextColor = (hexColor: string) => {
                const r = parseInt(hexColor.slice(1, 3), 16);
                const g = parseInt(hexColor.slice(3, 5), 16);
                const b = parseInt(hexColor.slice(5, 7), 16);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness > 200 ? "#000000" : hexColor;
              };

              const syncId = `${user?.id}-${Date.now()}-${Math.random()}`;
              const text = new IText("Type here", {
                left: e.pointer.x,
                top: e.pointer.y,
                fill: getTextColor(drawColorRef.current),
                fontSize: 20,
                fontFamily: "Arial",
                objectCaching: false, // Disable caching for smooth updates
              });
              (text as any).syncId = syncId;
              (text as any).userId = user?.id;

              fabricCanvas.add(text);
              fabricCanvas.setActiveObject(text);
              text.enterEditing();
              text.selectAll();
              fabricCanvas.renderAll();
            }
          }
        });

        fabricCanvas.on("mouse:up", () => {
          if (isDrawing.current) {
            isDrawing.current = false;
            // Clean up any remote drawing path for this user
            if (remoteDrawingPaths.current[user.id]) {
              delete remoteDrawingPaths.current[user.id];
            }
          }
        });
      }

      let lastCursorBroadcast = 0;
      let lastDrawingBroadcast = 0;
      
      fabricCanvas.on("mouse:move", async (e) => {
        const now = Date.now();
        
        // Only broadcast if not in monitor mode AND channel is ready
        if (!isMonitorMode && isChannelReady.current) {
          if (isDrawing.current && fabricCanvas.isDrawingMode && e.pointer) {
            // Broadcast drawing progress in real-time - faster for smoother sync
            if (now - lastDrawingBroadcast > 8) { // ~120fps for ultra-smooth drawing
              lastDrawingBroadcast = now;
              await broadcastEvent({
                type: "drawing:progress",
                data: {
                  x: e.pointer.x,
                  y: e.pointer.y,
                  color: fabricCanvas.freeDrawingBrush.color,
                  width: fabricCanvas.freeDrawingBrush.width,
                },
                userId: user?.id || "",
              });
            }
          }
          
          // Broadcast cursor position - faster for real-time feel
          if (e.pointer) {
            if (now - lastCursorBroadcast > 16) { // Match drawing speed for ultra-smooth sync
              lastCursorBroadcast = now;
              await broadcastEvent({
                type: "cursor:move",
                data: {
                  x: e.pointer.x,
                  y: e.pointer.y,
                  userId: user.id,
                  userName: displayName,
                  color: color,
                },
                userId: user.id,
              });
            }
          }
        }
      });

      // Canvas event listeners for broadcasting
      if (!isMonitorMode) {
        fabricCanvas.on("path:created", async (e) => {
          if (isRemoteUpdate.current) return;
          console.log("✏️ Path created locally, broadcasting...");
          isDrawing.current = false;
          // Clean up any remote drawing path for this user
          if (remoteDrawingPaths.current[user.id]) {
            fabricCanvas.remove(remoteDrawingPaths.current[user.id]);
            delete remoteDrawingPaths.current[user.id];
          }
          // Assign unique ID and userId to paths
          if (e.path) {
            (e.path as any).syncId = `${user?.id}-${Date.now()}-${Math.random()}`;
            (e.path as any).userId = user?.id;
          }
          await broadcastEvent({
            type: "path:created",
            data: e.path?.toJSON(),
            userId: user?.id || "",
            objectId: (e.path as any)?.syncId,
          });
          // Save whiteboard state
          await saveWhiteboardState(fabricCanvas, user.id);
        });

        fabricCanvas.on("object:added", async (e) => {
          if (isRemoteUpdate.current || e.target?.type === "path") return;
          // Assign unique ID and userId to new objects
          if (e.target && !(e.target as any).syncId) {
            (e.target as any).syncId = `${user?.id}-${Date.now()}-${Math.random()}`;
            (e.target as any).userId = user?.id;
          }
          
          console.log("Broadcasting object:added", e.target?.type, (e.target as any)?.syncId);
          
          await broadcastEvent({
            type: "object:added",
            data: e.target?.toJSON(),
            userId: user?.id || "",
            objectId: (e.target as any)?.syncId,
          });
          // Save whiteboard state
          await saveWhiteboardState(fabricCanvas, user.id);
        });

        fabricCanvas.on("object:modified", async (e) => {
          if (isRemoteUpdate.current) return;
          await broadcastEvent({
            type: "object:modified",
            data: e.target?.toJSON(),
            userId: user?.id || "",
            objectId: (e.target as any)?.syncId,
          });
          // Save whiteboard state
          await saveWhiteboardState(fabricCanvas, user.id);
        });

        fabricCanvas.on("object:removed", async (e) => {
          if (isRemoteUpdate.current) return;
          await broadcastEvent({
            type: "object:removed",
            data: e.target?.toJSON(),
            userId: user?.id || "",
            objectId: (e.target as any)?.syncId,
          });
          // Save whiteboard state
          await saveWhiteboardState(fabricCanvas, user.id);
        });

        // Track text editing in real-time
        let lastTextBroadcast = 0;
        fabricCanvas.on("text:changed", async (e) => {
          if (isRemoteUpdate.current) return;
          const target = e.target as IText;
          if (target && (target as any).syncId) {
            const now = Date.now();
            // Throttle text broadcasts to every 50ms for faster real-time updates
            if (now - lastTextBroadcast > 50) {
              lastTextBroadcast = now;
              await broadcastEvent({
                type: "text:changed",
                data: { text: target.text },
                userId: user?.id || "",
                objectId: (target as any).syncId,
              });
            }
          }
        });
      }
      
      // Track object selection for presence (not for monitors)
      if (!isMonitorMode) {
        fabricCanvas.on("selection:created", async (e) => {
        const activeObject = e.selected?.[0];
        
        // Check if object is being edited by another user
        if (activeObject && (activeObject as any).syncId) {
          const syncId = (activeObject as any).syncId;
          const editingUser = Object.values(userPresencesRef.current).find(
            (presence) => presence.editingObjectId === syncId
          );
          
          if (editingUser) {
            // Object is locked by another user, prevent selection
            fabricCanvas.discardActiveObject();
            fabricCanvas.renderAll();
            // Show toast only once per object to avoid spam
            const toastKey = `locked-${syncId}`;
            if (!(window as any)[toastKey]) {
              toast.error(`This object is being edited by ${editingUser.userName}`);
              (window as any)[toastKey] = true;
              setTimeout(() => delete (window as any)[toastKey], 3000);
            }
            return;
          }
          
          if (channelRef.current) {
            // Broadcast that we're now editing this object
            await channelRef.current.track({
              userId: user.id,
              userName: displayName,
              editingObjectId: syncId,
              color: color,
            });
            
            // Update indicators immediately
            updateObjectIndicators(fabricCanvas, userPresencesRef.current);
          }
        }
      });

      fabricCanvas.on("selection:updated", async (e) => {
        const activeObject = e.selected?.[0];
        
        // Check if object is being edited by another user
        if (activeObject && (activeObject as any).syncId) {
          const syncId = (activeObject as any).syncId;
          const editingUser = Object.values(userPresencesRef.current).find(
            (presence) => presence.editingObjectId === syncId
          );
          
          if (editingUser) {
            // Object is locked by another user, prevent selection
            fabricCanvas.discardActiveObject();
            fabricCanvas.renderAll();
            // Show toast only once per object to avoid spam
            const toastKey = `locked-${syncId}`;
            if (!(window as any)[toastKey]) {
              toast.error(`This object is being edited by ${editingUser.userName}`);
              (window as any)[toastKey] = true;
              setTimeout(() => delete (window as any)[toastKey], 3000);
            }
            return;
          }
          
          if (channelRef.current) {
            await channelRef.current.track({
              userId: user.id,
              userName: displayName,
              editingObjectId: syncId,
              color: color,
            });
            
            // Update indicators immediately
            updateObjectIndicators(fabricCanvas, userPresencesRef.current);
          }
        }
      });

      fabricCanvas.on("selection:cleared", async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            userId: user.id,
            userName: displayName,
            editingObjectId: null,
            color: color,
          });
        }
        // Update indicators when selection is cleared
        updateObjectIndicators(fabricCanvas, userPresencesRef.current);
        });
      }

      // Real-time transformations - broadcast while transforming (not for monitors)
      if (!isMonitorMode) {
        let lastTransformBroadcast = 0;
      
      const broadcastTransform = async (e: any) => {
        if (!e.target) return;
        
        const now = Date.now();
        if (now - lastTransformBroadcast > 16) { // Faster transform updates for real-time feel
          lastTransformBroadcast = now;
          
          await broadcastEvent({
            type: "object:modified",
            data: e.target.toJSON(),
            userId: user?.id || "",
            objectId: (e.target as any).syncId,
          });
        }
      };

      // Hook into canvas render cycle to update indicators on every frame
      fabricCanvas.on("after:render", () => {
        // Update all indicators on every render
        const existingIndicators = fabricCanvas.getObjects().filter((obj) => (obj as any).isIndicator);
        const objectsToProcess = fabricCanvas.getObjects().filter((obj) => !(obj as any).isIndicator && !(obj as any).isRemoteDrawing);
        
        objectsToProcess.forEach((obj) => {
          const syncId = (obj as any).syncId;
          if (!syncId) return;
          
          const editingUser = Object.values(userPresencesRef.current).find(
            (presence) => presence.editingObjectId === syncId
          );
          
          if (editingUser) {
            obj.setCoords();
            const bounds = obj.getBoundingRect();
            
            const indicator = existingIndicators.find((ind) => (ind as any).linkedObjectId === syncId) as FabricRect | undefined;
            
            if (indicator) {
              indicator.set({
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
              });
              indicator.setCoords();
            }
          }
        });
      });

      const updateSingleIndicator = (obj: any) => {
        const syncId = (obj as any).syncId;
        if (!syncId) return;
        
        const editingUser = Object.values(userPresencesRef.current).find(
          (presence) => presence.editingObjectId === syncId
        );
        
        if (!editingUser) return;
        
        obj.setCoords();
        const bounds = obj.getBoundingRect();
        
        const indicator = fabricCanvas.getObjects().find((o) => 
          (o as any).isIndicator && (o as any).linkedObjectId === syncId
        ) as FabricRect | undefined;
        
        if (indicator) {
          indicator.set({
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
          });
          indicator.setCoords();
        }
      };

      fabricCanvas.on("object:moving", (e) => {
        if (e?.target) {
          fabricCanvas.bringObjectToFront(e.target);
        }
        broadcastTransform(e);
      });
      
      fabricCanvas.on("object:scaling", (e) => {
        if (e?.target) {
          fabricCanvas.bringObjectToFront(e.target);
        }
        broadcastTransform(e);
      });
      
      fabricCanvas.on("object:rotating", (e) => {
        if (e?.target) {
          fabricCanvas.bringObjectToFront(e.target);
        }
        broadcastTransform(e);
        });
      }

      return () => {
        window.removeEventListener('resize', updateCanvasSize);
        // Final save on unmount with custom properties
        const objects = fabricCanvas.getObjects().map(obj => {
          const objData = obj.toObject();
          return {
            ...objData,
            syncId: (obj as any).syncId,
            userId: (obj as any).userId,
          };
        });
        
        const canvasData = {
          version: '6.0.0',
          objects: objects,
        };
        
        supabase
          .from('whiteboard_states')
          .upsert({
            session_id: sessionId,
            canvas_state: canvasData,
          }, {
            onConflict: 'session_id'
          });
        fabricCanvas.dispose();
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    };

    initCanvas();
  }, [sessionId]);

  const updateObjectIndicators = (fabricCanvas: Canvas, presences: Record<string, UserPresence>) => {
    const existingIndicators = fabricCanvas.getObjects().filter((obj) => (obj as any).isIndicator);
    const objectsToProcess = fabricCanvas.getObjects().filter((obj) => !(obj as any).isIndicator && !(obj as any).isRemoteDrawing);
    
    // Track which indicators we should keep
    const activeIndicatorIds = new Set<string>();
    
    objectsToProcess.forEach((obj) => {
      const syncId = (obj as any).syncId;
      if (!syncId) return;
      
      // Check if this object is being edited by another user
      const editingUser = Object.values(presences).find(
        (presence) => presence.editingObjectId === syncId
      );
      
      if (editingUser) {
        activeIndicatorIds.add(syncId);
        
        // Update object coordinates before getting bounding box
        obj.setCoords();
        
        // Get the object's bounding box with all transforms
        const bounds = obj.getBoundingRect();
        
        // Find existing indicator for this object
        let indicator = existingIndicators.find((ind) => (ind as any).linkedObjectId === syncId) as FabricRect | undefined;
        
        if (indicator) {
          // Update existing indicator position and size
          indicator.set({
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            stroke: editingUser.color,
          });
          indicator.setCoords();
        } else {
          // Create new indicator
          indicator = new FabricRect({
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            fill: 'transparent',
            stroke: editingUser.color,
            strokeWidth: 3,
            selectable: false,
            evented: false,
            objectCaching: false,
            strokeDashArray: [5, 5],
          });
          (indicator as any).isIndicator = true;
          (indicator as any).linkedObjectId = syncId;
          
          fabricCanvas.add(indicator);
        }
        
        // Ensure the actual object is above the indicator
        fabricCanvas.bringObjectToFront(obj);
      }
    });
    
    // Remove indicators for objects that are no longer being edited
    existingIndicators.forEach((indicator) => {
      const linkedId = (indicator as any).linkedObjectId;
      if (!activeIndicatorIds.has(linkedId)) {
        fabricCanvas.remove(indicator);
      }
    });
    
    fabricCanvas.requestRenderAll();
  };

  const broadcastEvent = async (event: WhiteboardEvent) => {
    // Monitor should never broadcast
    if (isMonitorMode) {
      console.log("👀 Monitor mode - not broadcasting");
      return;
    }
    
    if (!channelRef.current) {
      console.error(`❌ ${userName} BROADCAST FAILED: Channel not initialized for event:`, event.type);
      // Only show error toast for important events
      if (event.type === "canvas:cleared") {
        toast.error("Not connected to whiteboard sync");
      }
      return;
    }
    
    if (!isChannelReady.current) {
      console.error(`⏳ ${userName} BROADCAST BLOCKED: Channel not ready for event:`, event.type);
      // Show toast for important events to let user know to wait
      if (event.type === "path:created" || event.type === "object:added" || event.type === "canvas:cleared") {
        toast.warning("Whiteboard syncing... please wait a moment");
      }
      return;
    }
    
    try {
      console.log(`📤 ${userName} BROADCASTING:`, event.type, "userId:", event.userId.substring(0, 8), "objectId:", event.objectId);
      const result = await channelRef.current.send({
        type: "broadcast",
        event: "whiteboard-event",
        payload: event,
      });
      
      if (result !== 'ok') {
        console.error(`⚠️ ${userName} BROADCAST FAILED with result:`, result, "for event:", event.type);
        // Only show toast for critical failures
        if (event.type === "canvas:cleared") {
          toast.error(`Failed to sync ${event.type}`);
        }
      } else {
        // Don't log success for cursor and drawing progress to reduce console spam
        if (event.type !== "cursor:move" && event.type !== "drawing:progress") {
          console.log(`✅ ${userName} BROADCAST SUCCESS:`, event.type);
        }
      }
    } catch (error) {
      console.error(`❌ ${userName} BROADCAST ERROR:`, error, "for event:", event.type);
      // Only show toast for critical errors
      if (event.type === "canvas:cleared") {
        toast.error("Whiteboard sync error");
      }
    }
  };

  const handleDrawingProgress = async (fabricCanvas: Canvas, event: WhiteboardEvent) => {
    const { userId, data } = event;
    
    if (!remoteDrawingPaths.current[userId]) {
      // Create a new path for this user
      const { Path } = await import("fabric");
      const path = new Path(`M ${data.x} ${data.y}`, {
        stroke: data.color,
        strokeWidth: data.width,
        fill: '',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        selectable: false,
        evented: false,
      });
      (path as any).isRemoteDrawing = true;
      remoteDrawingPaths.current[userId] = path;
      fabricCanvas.add(path);
    } else {
      // Update existing path
      const path = remoteDrawingPaths.current[userId];
      const currentPath = path.path;
      if (currentPath) {
        currentPath.push(['L', data.x, data.y]);
        path.set({ path: currentPath, dirty: true });
      }
    }
    
    fabricCanvas.renderAll();
  };

  const handleRemoteEvent = async (fabricCanvas: Canvas, event: WhiteboardEvent) => {
    console.log("🎨 Handling remote event:", event.type, "objectId:", event.objectId);
    try {
      switch (event.type) {
        case "path:created":
          // Clean up any in-progress drawing path for this user
          if (remoteDrawingPaths.current[event.userId]) {
            fabricCanvas.remove(remoteDrawingPaths.current[event.userId]);
            delete remoteDrawingPaths.current[event.userId];
          }
          
          if (event.data && event.objectId) {
            const { Path } = await import("fabric");
            Path.fromObject(event.data).then((path) => {
              (path as any).syncId = event.objectId;
              (path as any).userId = event.userId;
              
              // Make non-interactive for monitors
              if (isMonitorMode) {
                path.selectable = false;
                path.evented = false;
              }
              
              fabricCanvas.add(path);
              fabricCanvas.renderAll();
            });
          }
          break;

        case "object:added":
          console.log("Received object:added", event.data?.type, event.objectId);
          if (event.data && event.objectId) {
            const objType = event.data.type;

            if (objType === "i-text" || objType === "IText") {
              console.log("Creating remote text object", event.data);
              const fabricObj = new IText(event.data.text || "Type here", {
                left: event.data.left,
                top: event.data.top,
                fill: event.data.fill,
                fontSize: event.data.fontSize,
                fontFamily: event.data.fontFamily,
              });
              (fabricObj as any).syncId = event.objectId;
              (fabricObj as any).userId = event.userId;
              
              // Make non-interactive for monitors
              if (isMonitorMode) {
                fabricObj.selectable = false;
                fabricObj.evented = false;
              }
              
              fabricCanvas.add(fabricObj);
              fabricCanvas.renderAll();
              console.log("Text object added to remote canvas");
            } else if (objType === "image") {
              const imgElement = document.createElement("img");
              imgElement.src = event.data.src;
              imgElement.onload = () => {
                FabricImage.fromURL(imgElement.src).then((img) => {
                  img.set(event.data);
                  (img as any).syncId = event.objectId;
                  (img as any).userId = event.userId;
                  
                  // Make non-interactive for monitors
                  if (isMonitorMode) {
                    img.selectable = false;
                    img.evented = false;
                  }
                  
                  fabricCanvas.add(img);
                  fabricCanvas.renderAll();
                });
              };
            }
          }
          break;

        case "object:modified":
          if (event.objectId) {
            const targetObj = fabricCanvas.getObjects().find((obj) => (obj as any).syncId === event.objectId);
            if (targetObj && event.data) {
              // Check if this object is being edited by current user
              const isEditingByCurrentUser = fabricCanvas.getActiveObject() === targetObj;
              
              if (!isEditingByCurrentUser) {
                // Only update if current user is not editing this object
                targetObj.set({
                  left: event.data.left,
                  top: event.data.top,
                  scaleX: event.data.scaleX,
                  scaleY: event.data.scaleY,
                  angle: event.data.angle,
                  ...event.data
                });
                targetObj.setCoords();
                
                // Update indicator for this specific object in real-time
                const syncId = (targetObj as any).syncId;
                if (syncId) {
                  const editingUser = Object.values(userPresencesRef.current).find(
                    (presence) => presence.editingObjectId === syncId
                  );
                  
                  if (editingUser) {
                    const bounds = targetObj.getBoundingRect();
                    const indicator = fabricCanvas.getObjects().find((o) => 
                      (o as any).isIndicator && (o as any).linkedObjectId === syncId
                    ) as FabricRect | undefined;
                    
                    if (indicator) {
                      indicator.set({
                        left: bounds.left,
                        top: bounds.top,
                        width: bounds.width,
                        height: bounds.height,
                      });
                      indicator.setCoords();
                    }
                  }
                }
                
                fabricCanvas.renderAll();
              }
            }
          }
          break;

        case "object:removed":
          if (event.objectId) {
            const toRemove = fabricCanvas.getObjects().find((obj) => (obj as any).syncId === event.objectId);
            if (toRemove) {
              fabricCanvas.remove(toRemove);
              fabricCanvas.renderAll();
            }
          }
          break;

        case "canvas:cleared":
          fabricCanvas.clear();
          fabricCanvas.backgroundColor = "#ffffff";
          fabricCanvas.renderAll();
          break;

        case "text:changed":
          if (event.objectId && event.data?.text !== undefined) {
            const targetObj = fabricCanvas.getObjects().find((obj) => (obj as any).syncId === event.objectId);
            if (targetObj && targetObj.type === "i-text") {
              const textObj = targetObj as IText;
              // Check if current user is editing this text object
              const isEditingByCurrentUser = textObj.isEditing;
              
              if (!isEditingByCurrentUser) {
                // Only update if current user is not editing this text
                textObj.set({ text: event.data.text });
                fabricCanvas.renderAll();
              }
            }
          }
          break;
      }
    } catch (error) {
      console.error("Error handling remote event:", error);
    }
  };

  // Sync refs with state
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    drawColorRef.current = drawColor;
  }, [drawColor]);

  useEffect(() => {
    if (!canvas) return;
    
    // Disable all interactions in monitor mode
    if (isMonitorMode) {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "default";
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      canvas.renderAll();
      return;
    }

    if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      const brush = new PencilBrush(canvas);
      brush.color = drawColor;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.hoverCursor = "pointer";
    } else if (activeTool === "text") {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "default";
    }
    
    // Re-enable object interactions for non-monitor mode
    canvas.forEachObject((obj) => {
      if (!(obj as any).isIndicator && !(obj as any).isRemoteDrawing) {
        obj.selectable = true;
        obj.evented = true;
      }
    });
  }, [activeTool, canvas, drawColor, brushSize, isMonitorMode]);

  // Update indicators when user presences change
  useEffect(() => {
    if (!canvas) return;
    userPresencesRef.current = userPresences;
    updateObjectIndicators(canvas, userPresences);
  }, [userPresences, canvas]);

  // BACKUP SYNC: Poll database for changes (fallback if realtime fails)
  useEffect(() => {
    if (!canvas || !sessionId || isMonitorMode) return;
    
    let lastUpdateTime = Date.now();
    
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('whiteboard_states')
          .select('canvas_state, updated_at')
          .eq('session_id', sessionId)
          .single();
        
        if (data && data.updated_at) {
          const dbUpdateTime = new Date(data.updated_at).getTime();
          
          // Only update if database has newer changes
          if (dbUpdateTime > lastUpdateTime) {
            console.log('📊 Polling: Found newer whiteboard state, updating...');
            lastUpdateTime = dbUpdateTime;
            
            // Clear and reload canvas from database
            const canvasState = data.canvas_state as any;
            if (canvasState?.objects) {
              isRemoteUpdate.current = true;
              
              // Remove all objects except indicators
              const objectsToRemove = canvas.getObjects().filter(obj => 
                !(obj as any).isIndicator && !(obj as any).isRemoteDrawing
              );
              objectsToRemove.forEach(obj => canvas.remove(obj));
              
              // Add objects from database
              for (const objData of canvasState.objects) {
                if (objData.type === 'path' || objData.type === 'Path') {
                  const { Path } = await import("fabric");
                  const path = new Path(objData.path, {
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                    fill: objData.fill || '',
                    strokeLineCap: objData.strokeLineCap,
                    strokeLineJoin: objData.strokeLineJoin,
                    left: objData.left,
                    top: objData.top,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                    angle: objData.angle,
                    opacity: objData.opacity,
                  });
                  (path as any).syncId = objData.syncId;
                  (path as any).userId = objData.userId;
                  canvas.add(path);
                } else if (objData.type === 'i-text' || objData.type === 'IText') {
                  const text = new IText(objData.text || '', {
                    left: objData.left,
                    top: objData.top,
                    fill: objData.fill,
                    fontSize: objData.fontSize,
                    fontFamily: objData.fontFamily,
                  });
                  (text as any).syncId = objData.syncId;
                  (text as any).userId = objData.userId;
                  canvas.add(text);
                }
              }
              
              canvas.renderAll();
              isRemoteUpdate.current = false;
            }
          }
        }
      } catch (error) {
        // Silently fail - don't spam console
      }
    }, 500); // Poll every 0.5 seconds for faster sync
    
    return () => clearInterval(pollInterval);
  }, [canvas, sessionId, isMonitorMode]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgElement = document.createElement("img");
      imgElement.src = event.target?.result as string;
      imgElement.onload = async () => {
        const syncId = `${userId}-${Date.now()}-${Math.random()}`;
        FabricImage.fromURL(imgElement.src).then(async (img) => {
          img.scaleToWidth(200);
          img.set({ left: 100, top: 100 });
          (img as any).syncId = syncId;
          (img as any).userId = userId;
          canvas.add(img);
          canvas.renderAll();
          
          // Broadcast to other users
          await broadcastEvent({
            type: "object:added",
            data: {
              type: "image",
              src: imgElement.src,
              left: 100,
              top: 100,
              scaleX: img.scaleX,
              scaleY: img.scaleY,
            },
            userId,
            objectId: syncId,
          });
        });
      };
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveWhiteboardState = async (fabricCanvas: Canvas, userId: string) => {
    try {
      // Get canvas data and manually include custom properties
      const objects = fabricCanvas.getObjects().map(obj => {
        // Get the base object data
        const objData = obj.toObject();
        // Manually add custom properties
        return {
          ...objData,
          syncId: (obj as any).syncId,
          userId: (obj as any).userId,
        };
      });
      
      const canvasData = {
        version: '6.0.0',
        objects: objects,
      };
      
      console.log('Saving whiteboard state with', objects.length, 'objects');
      if (objects.length > 0) {
        console.log('Sample object:', JSON.stringify(objects[0]).substring(0, 200));
      }
      
      // Upsert whiteboard state
      const { error } = await supabase
        .from('whiteboard_states')
        .upsert({
          session_id: sessionId,
          canvas_state: canvasData,
        }, {
          onConflict: 'session_id'
        });
      
      if (error) {
        console.error('Error saving whiteboard state:', error);
      } else {
        console.log('✅ Whiteboard state saved successfully');
      }
    } catch (error) {
      console.error('Error saving whiteboard state:', error);
    }
  };

  const clearCanvas = async () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
    
    // Broadcast clear event
    await broadcastEvent({
      type: "canvas:cleared",
      data: null,
      userId,
    });
    
    // Save cleared state
    await saveWhiteboardState(canvas, userId);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Toolbar - Hidden in monitor mode */}
      {!isMonitorMode && (
        <div className="bg-background/95 backdrop-blur-sm border-b p-3 flex items-center gap-2 flex-wrap shadow-sm">
          {/* Tool Selection */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={activeTool === "select" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("select")}
              title="Select"
              className="h-8 w-8"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "draw" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("draw")}
              title="Draw"
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("text")}
              title="Text - Click on canvas to place"
              className="h-8 w-8"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === "eraser" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("eraser")}
              title="Eraser"
              className="h-8 w-8"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>


          {/* Color & Size */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Color:</span>
              <input
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
                title="Color"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Size:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
                title="Brush size"
              />
              <span className="text-xs font-medium w-6">{brushSize}</span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Image Upload */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
            className="h-8"
          >
            <Image className="h-4 w-4 mr-1" />
            Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="flex-1" />

          {/* Clear */}
          <Button variant="destructive" size="sm" onClick={clearCanvas} title="Clear all" className="h-8">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" ref={canvasContainerRef}>
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas ref={canvasRef} className="shadow-lg" />
          
          {/* Remote Cursors */}
          {canvas && canvasContainerRef.current && Object.values(remoteCursors).map((cursor) => {
            const canvasElement = canvasRef.current;
            if (!canvasElement) return null;
            
            const canvasRect = canvasElement.getBoundingClientRect();
            const containerRect = canvasContainerRef.current!.getBoundingClientRect();
            
            // Calculate cursor position exactly where it is on the canvas
            const cursorX = (canvasRect.left - containerRect.left) + cursor.x;
            const cursorY = (canvasRect.top - containerRect.top) + cursor.y;
            
            return (
              <div
                key={cursor.userId}
                className="absolute pointer-events-none z-50"
                style={{
                  left: `${cursorX}px`,
                  top: `${cursorY}px`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full border border-white shadow-md"
                  style={{
                    backgroundColor: cursor.color,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
