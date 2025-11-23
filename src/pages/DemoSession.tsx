import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, MonitorUp, MessageSquare, MousePointer2, Pencil, Type, Eraser, Trash2, Upload, Download, File, Send, Smile, Maximize, X, Maximize2, Settings } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { Canvas, PencilBrush, IText, FabricImage } from "fabric";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import { AudioVisualizer } from "@/components/video-session/AudioVisualizer";

export default function DemoSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role: userRole } = useUserRole();
  const demoRole = searchParams.get("role") as "tutor" | "learner" || userRole || "learner";
  
  // Get initial camera/mic state and device IDs from URL params (from preview page)
  const initialCameraState = searchParams.get("camera") !== "false";
  const initialMicState = searchParams.get("mic") !== "false";
  const initialVideoDevice = searchParams.get("videoDevice") || "";
  const initialAudioDevice = searchParams.get("audioDevice") || "";
  
  const [isCameraOn, setIsCameraOn] = useState(initialCameraState);
  const [isMicOn, setIsMicOn] = useState(initialMicState);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState<"local" | "remote" | null>(null);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  
  // Video stream refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  // Whiteboard state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "text" | "eraser">("select");
  const activeToolRef = useRef<"select" | "draw" | "text" | "eraser">("select");
  const [drawColor, setDrawColor] = useState("#000000");
  const drawColorRef = useRef("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Panel state
  const [activePanel, setActivePanel] = useState<"whiteboard" | "assets">("whiteboard");
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isUser: boolean; time: string }>>([
    {
      id: "1",
      text: "Welcome to the dummy session! Feel free to explore all the features.",
      isUser: false,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Bot replies
  const botReplies = [
    "That's great! Let me know if you need any help.",
    "I'm here to assist you with anything you need!",
    "Feel free to try out the whiteboard and other features.",
    "This is a dummy session, so you can experiment freely!",
    "How can I help you today?",
    "The whiteboard tools are really useful for explaining concepts.",
    "You can also upload images to the whiteboard!",
    "Try switching to the Assets tab to see file sharing.",
    "Great question! In a real session, we'd discuss that in detail.",
    "I'm impressed with how you're exploring the features!"
  ];
  
  // Mock assets
  const mockAssets = [
    {
      id: "1",
      file_name: "Algebra_Notes.pdf",
      file_size: 245000,
      uploader_name: demoRole === "tutor" ? "You" : "Dummy Tutor",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "2",
      file_name: "Practice_Problems.docx",
      file_size: 128000,
      uploader_name: demoRole === "learner" ? "You" : "Dummy Learner",
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  ];

  // Audio level detection for speaking effect
  const { isSpeaking: localSpeaking } = useAudioLevel({
    stream: localStream,
    threshold: 25
  });

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEndDemo();
          return 0;
        }
        if (prev === 300 && !showWarning) {
          setShowWarning(true);
          toast.warning("5 minutes remaining in dummy session");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollViewport = chatScrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleEndDemo = () => {
    // Stop all media streams
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped screen ${track.kind} track`);
      });
    }
    
    toast.success("Dummy session ended");
    // Refresh page to ensure all resources are cleaned up
    setTimeout(() => {
      window.location.href = demoRole === "tutor" ? "/tutor/dashboard" : "/learner/dashboard";
    }, 500);
  };

  // Initialize whiteboard canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#ffffff",
      selection: true,
    });

    fabricCanvas.renderAll();
    setCanvas(fabricCanvas);

    const updateCanvasSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      fabricCanvas.setDimensions({ width, height });
      fabricCanvas.renderAll();
    };

    window.addEventListener('resize', updateCanvasSize);

    // Handle text and eraser tools
    fabricCanvas.on("mouse:down", (e) => {
      // Use ref to get current tool value
      if (activeToolRef.current === "eraser" && e.target) {
        fabricCanvas.remove(e.target);
        fabricCanvas.renderAll();
        return;
      }

      if (activeToolRef.current === "text" && e.pointer) {
        if (e.target && (e.target.type === "i-text" || e.target.type === "IText")) {
          fabricCanvas.setActiveObject(e.target);
          (e.target as IText).enterEditing();
          fabricCanvas.renderAll();
          return;
        }

        if (!e.target) {
          const text = new IText("Type here", {
            left: e.pointer.x,
            top: e.pointer.y,
            fill: drawColorRef.current,
            fontSize: 20,
            fontFamily: "Arial",
          });

          fabricCanvas.add(text);
          fabricCanvas.setActiveObject(text);
          text.enterEditing();
          text.selectAll();
          fabricCanvas.renderAll();
        }
      }
    });

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      fabricCanvas.dispose();
    };
  }, []);

  // Sync refs with state
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    drawColorRef.current = drawColor;
  }, [drawColor]);

  // Update tool settings
  useEffect(() => {
    if (!canvas) return;

    if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      const brush = new PencilBrush(canvas);
      brush.color = drawColor;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = false;
      canvas.selection = false;
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

    canvas.forEachObject((obj) => {
      obj.selectable = activeTool === "select";
      obj.evented = activeTool === "eraser" || activeTool === "select";
    });
  }, [activeTool, canvas, drawColor, brushSize]);

  const handleClearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      toast.success("Canvas cleared");
    }
  };

  // Load available devices
  const loadDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices(deviceList);
      
      // Set default selections
      const videoDevice = deviceList.find(d => d.kind === 'videoinput');
      const audioDevice = deviceList.find(d => d.kind === 'audioinput');
      if (videoDevice) setSelectedCamera(videoDevice.deviceId);
      if (audioDevice) setSelectedMic(audioDevice.deviceId);
    } catch (error) {
      console.log("Could not enumerate devices:", error);
    }
  };

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Use specific devices if provided, otherwise use defaults
        const constraints: MediaStreamConstraints = {
          video: initialVideoDevice 
            ? { deviceId: { exact: initialVideoDevice } }
            : true,
          audio: initialAudioDevice
            ? { deviceId: { exact: initialAudioDevice } }
            : true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Apply initial camera/mic states from preview
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = initialCameraState;
        }
        if (audioTrack) {
          audioTrack.enabled = initialMicState;
        }
        
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // Set video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Load available devices and set selected ones
        await loadDevices();
        
        // Set the selected devices from URL params
        if (initialVideoDevice) {
          setSelectedCamera(initialVideoDevice);
        }
        if (initialAudioDevice) {
          setSelectedMic(initialAudioDevice);
        }
      } catch (error) {
        console.log("Camera access denied or not available:", error);
        // Fallback to placeholder - no error shown to user
      }
    };

    initCamera();

    // Cleanup
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video refs when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = isScreenSharing && screenStream ? screenStream : localStream;
    }
    if (fullscreenVideoRef.current && localStream) {
      fullscreenVideoRef.current.srcObject = isScreenSharing && screenStream ? screenStream : localStream;
    }
  }, [localStream, screenStream, isScreenSharing]);

  // Update fullscreen video when opening fullscreen
  useEffect(() => {
    if (isFullscreen && fullscreenVideoRef.current && localStream) {
      const stream = isScreenSharing && screenStream ? screenStream : localStream;
      fullscreenVideoRef.current.srcObject = stream;
      // Ensure video plays
      fullscreenVideoRef.current.play().catch(e => console.log("Fullscreen video play error:", e));
    }
  }, [isFullscreen, localStream, screenStream, isScreenSharing]);

  // Cleanup streams on component unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`Cleanup: Stopped ${track.kind} track`);
        });
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`Cleanup: Stopped screen ${track.kind} track`);
        });
      }
    };
  }, []);

  // Toggle camera with actual stream control
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
      }
    }
    setIsCameraOn(!isCameraOn);
    toast.success(isCameraOn ? "Camera turned off" : "Camera turned on");
  };

  // Toggle mic with actual stream control
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
      }
    }
    setIsMicOn(!isMicOn);
    toast.success(isMicOn ? "Microphone muted" : "Microphone unmuted");
  };

  // Toggle screen share with actual screen capture
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      toast.success("Screen sharing stopped");
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        setScreenStream(stream);
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
        
        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          screenStreamRef.current = null;
          setIsScreenSharing(false);
          toast.info("Screen sharing stopped");
        };
      } catch (error) {
        console.log("Screen share cancelled or not available:", error);
        toast.error("Screen sharing cancelled");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgUrl = event.target?.result as string;
        
        // Import FabricImage dynamically
        const { FabricImage } = await import("fabric");
        
        FabricImage.fromURL(imgUrl).then((img) => {
          // Scale image to fit canvas if too large
          const maxWidth = canvas.width! * 0.5;
          const maxHeight = canvas.height! * 0.5;
          
          if (img.width! > maxWidth || img.height! > maxHeight) {
            const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
            img.scale(scale);
          }
          
          // Center the image
          img.set({
            left: canvas.width! / 2 - (img.getScaledWidth() / 2),
            top: canvas.height! / 2 - (img.getScaledHeight() / 2),
          });
          
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          toast.success("Image added to canvas");
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to add image");
    } finally {
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Dummy Banner */}
      <div className="bg-primary/20 border-b border-primary/30 px-6 py-2">
        <p className="text-sm font-medium text-primary flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          <span className="hidden sm:inline">This is a dummy session - No data will be saved. Whiteboard is for desktop mode only.</span>
          <span className="sm:hidden">Dummy session - Whiteboard available on desktop only</span>
        </p>
      </div>

      {/* Header */}
      <header className="bg-card border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold">Dummy Session - Testing Features</h1>
          <p className="text-sm text-muted-foreground">Practice using the platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md font-mono bg-muted">
            <span className="font-medium">{formatTime(timeLeft)}</span>
          </div>
          <Button variant="destructive" onClick={handleEndDemo}>
            {demoRole === "tutor" ? "End Session" : "Exit Dummy"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden min-h-0">
        {/* Left - Whiteboard/Assets (Hidden on mobile) */}
        <div className="hidden md:flex flex-[0_0_68%] bg-card rounded-lg border shadow-sm overflow-hidden flex-col min-h-0">
          {/* Tab Switcher */}
          <div className="flex border-b shrink-0">
            <div className="flex-1">
              <button
                onClick={() => setActivePanel("whiteboard")}
                className={`w-full py-3 px-4 text-sm font-medium transition-colors ${
                  activePanel === "whiteboard"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Whiteboard
              </button>
            </div>
            <div className="flex-1">
              <button
                onClick={() => setActivePanel("assets")}
                className={`w-full py-3 px-4 text-sm font-medium transition-colors ${
                  activePanel === "assets"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Assets
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden min-h-0">
            {/* Whiteboard Panel */}
            <div className={activePanel === "whiteboard" ? "h-full" : "hidden h-full"}>
              <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
                {/* Whiteboard Toolbar */}
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
                      <Pencil className="h-4 w-4" />
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
                    <Upload className="h-4 w-4 mr-1" />
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
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleClearCanvas} 
                    title="Clear all"
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
            
                {/* Canvas */}
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <canvas ref={canvasRef} className="shadow-lg" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Assets Panel */}
            <div className={activePanel === "assets" ? "h-full" : "hidden h-full"}>
              <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/10">
                {/* Upload Button */}
                <div className="p-4 border-b bg-background/95 backdrop-blur-sm">
                  <Button 
                    variant="default" 
                    className="w-full shadow-sm"
                    onClick={() => toast.success("File uploaded (dummy)")}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
                
                {/* Assets List */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {mockAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="group p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                            <File className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{asset.file_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(asset.file_size / 1024).toFixed(1)} KB
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              Uploaded by {asset.uploader_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toast.success("File downloaded (dummy)")}
                            title="Download"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {asset.uploader_name === "You" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toast.success("File deleted (dummy)")}
                              title="Delete"
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Video & Chat (Full width on mobile) */}
        <div className="flex-1 md:flex-[0_0_32%] flex flex-col gap-3 min-h-0">
          {/* Videos */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden shrink-0">
            <div className="grid grid-cols-2 gap-2 p-2">
              {/* Mock Remote Video */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video rounded-lg overflow-hidden group transition-all duration-200">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {demoRole === "tutor" ? "L" : "T"}
                    </span>
                  </div>
                  <p className="mt-2 text-white text-xs font-medium">
                    {demoRole === "tutor" ? "Dummy Learner" : "Dummy Tutor"}
                  </p>
                  <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                </div>
                <div className="absolute top-1 left-1 backdrop-blur-sm bg-black/60 px-1.5 py-0.5 rounded text-white text-[10px] font-medium z-30">
                  {demoRole === "tutor" ? "Learner" : "Tutor"}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
                  onClick={() => {
                    setFullscreenVideo('remote');
                    setIsFullscreen(true);
                  }}
                  title="Fullscreen"
                >
                  <Maximize className="h-3 w-3" />
                </Button>
              </div>

              {/* Your Video */}
              <div className={`relative bg-gradient-to-br from-gray-800 to-gray-700 aspect-video rounded-lg overflow-hidden group transition-all duration-200 ${
                localSpeaking && isMicOn ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
              }`}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraOn && !isScreenSharing ? 'hidden' : ''}`}
                />
                {!isCameraOn && !isScreenSharing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">Y</span>
                    </div>
                    <p className="mt-2 text-white text-xs font-medium">You</p>
                    <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                  </div>
                )}
                <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium transition-colors z-30 ${
                  localSpeaking && isMicOn ? 'bg-primary' : 'bg-black/60'
                }`}>
                  {isScreenSharing ? "Your Screen" : "You"}
                </div>
                <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-auto z-30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={toggleCamera}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {isCameraOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={toggleMic}
                    title={isMicOn ? "Mute" : "Unmute"}
                  >
                    {isMicOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 rounded-full hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity ${
                      isScreenSharing ? "bg-primary" : "bg-black/60"
                    }`}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? "Stop sharing" : "Share screen"}
                  >
                    <MonitorUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setFullscreenVideo('local');
                      setIsFullscreen(true);
                    }}
                    title="Fullscreen"
                  >
                    <Maximize className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-0 flex flex-col">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b bg-gradient-to-r from-background to-muted/30 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-sm">Session Chat</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsChatFullscreen(true)}
                className="h-8 w-8"
                title="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3" ref={chatScrollRef}>
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                        message.isUser
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}>
                        <p className="text-sm break-words leading-relaxed">
                          {message.text}
                        </p>
                        <p className={`text-xs mt-1 ${message.isUser ? "opacity-80" : "opacity-60"}`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (messageInput.trim()) {
                  const userMessage = messageInput.trim();
                  const newUserMsg = {
                    id: Date.now().toString(),
                    text: userMessage,
                    isUser: true,
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  };
                  setMessages(prev => [...prev, newUserMsg]);
                  setMessageInput("");
                  
                  // Bot replies after a short delay
                  setTimeout(() => {
                    const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                    const botMsg = {
                      id: (Date.now() + 1).toString(),
                      text: randomReply,
                      isUser: false,
                      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    };
                    setMessages(prev => [...prev, botMsg]);
                  }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
                }
              }}
              className="p-3 border-t bg-background/95 backdrop-blur-sm shrink-0"
            >
              <div className="flex items-center gap-2">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="top" 
                    align="start" 
                    sideOffset={5}
                    className="w-auto p-0 border-0 bg-transparent shadow-none"
                  >
                    <EmojiPicker onEmojiClick={(emojiData) => {
                      setMessageInput(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }} />
                  </PopoverContent>
                </Popover>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="shrink-0" disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden group" onClick={(e) => e.stopPropagation()}>
            {/* Video element for fullscreen - Always render to keep stream */}
            {fullscreenVideo === 'local' && (
              <video
                ref={fullscreenVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${!isCameraOn && !isScreenSharing ? 'hidden' : ''}`}
              />
            )}
            
            {/* Camera Off Overlay - Local */}
            {fullscreenVideo === 'local' && !isCameraOn && !isScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold text-white">Y</span>
                </div>
                <p className="text-white text-lg font-medium mb-2">You</p>
                <div className="flex items-center gap-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <p className="text-sm">Camera is off</p>
                </div>
              </div>
            )}
            
            {/* Camera Off Overlay - Remote */}
            {fullscreenVideo === 'remote' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold text-white">
                    {demoRole === "tutor" ? "L" : "T"}
                  </span>
                </div>
                <p className="text-white text-lg font-medium mb-2">
                  {demoRole === "tutor" ? "Dummy Learner" : "Dummy Tutor"}
                </p>
                <div className="flex items-center gap-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <p className="text-sm">Camera is off</p>
                </div>
              </div>
            )}
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white z-30"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Label */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded text-white text-sm z-30">
              {fullscreenVideo === 'local' 
                ? (isScreenSharing ? 'Your Screen' : 'You')
                : (demoRole === "tutor" ? "Learner" : "Tutor")}
            </div>
            
            {/* Fullscreen Controls - Only show for local video */}
            {fullscreenVideo === 'local' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-full px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={toggleCamera}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={toggleMic}
                    title={isMicOn ? "Mute" : "Unmute"}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? "Stop sharing" : "Share screen"}
                  >
                    <MonitorUp className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={() => setShowSettings(true)}
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Chat Dialog */}
      <Dialog open={isChatFullscreen} onOpenChange={setIsChatFullscreen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col gap-0 [&>button]:hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b bg-gradient-to-r from-background to-muted/30 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-sm">Session Chat</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsChatFullscreen(false)}
                className="h-8 w-8"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                        message.isUser
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}>
                        <p className="text-sm break-words leading-relaxed">
                          {message.text}
                        </p>
                        <p className={`text-xs mt-1 ${message.isUser ? "opacity-80" : "opacity-60"}`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (messageInput.trim()) {
                  const userMessage = messageInput.trim();
                  const newUserMsg = {
                    id: Date.now().toString(),
                    text: userMessage,
                    isUser: true,
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  };
                  setMessages(prev => [...prev, newUserMsg]);
                  setMessageInput("");
                  
                  // Bot replies after a short delay
                  setTimeout(() => {
                    const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                    const botMsg = {
                      id: (Date.now() + 1).toString(),
                      text: randomReply,
                      isUser: false,
                      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    };
                    setMessages(prev => [...prev, botMsg]);
                  }, 1000 + Math.random() * 1000);
                }
              }}
              className="p-3 border-t bg-background/95 backdrop-blur-sm shrink-0"
            >
              <div className="flex items-center gap-2">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="top" 
                    align="start" 
                    sideOffset={5}
                    className="w-auto p-0 border-0 bg-transparent shadow-none"
                  >
                    <EmojiPicker onEmojiClick={(emojiData) => {
                      setMessageInput(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }} />
                  </PopoverContent>
                </Popover>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="shrink-0" disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal - Exact copy from real session */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div className="bg-card rounded-lg border shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Session Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Video Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Camera Preview</h4>
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden aspect-video">
                  <video
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    ref={(el) => {
                      if (el && localStream) {
                        el.srcObject = localStream;
                      }
                    }}
                  />
                  {!isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <VideoOff className="w-12 h-12 text-white opacity-75" />
                    </div>
                  )}
                  
                  {/* Quick controls */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant={isCameraOn ? "secondary" : "destructive"}
                      onClick={toggleCamera}
                      className="rounded-full h-10 w-10"
                    >
                      {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant={isMicOn ? "secondary" : "destructive"}
                      onClick={toggleMic}
                      className="rounded-full h-10 w-10"
                    >
                      {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Device Selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Device Settings</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Camera</label>
                    <select
                      value={selectedCamera}
                      onChange={async (e) => {
                        const deviceId = e.target.value;
                        setSelectedCamera(deviceId);
                        
                        try {
                          if (localStream) {
                            localStream.getVideoTracks().forEach(track => track.stop());
                          }
                          
                          const stream = await navigator.mediaDevices.getUserMedia({
                            video: { deviceId: { exact: deviceId } },
                            audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined }
                          });
                          
                          const videoTrack = stream.getVideoTracks()[0];
                          const audioTrack = stream.getAudioTracks()[0];
                          if (videoTrack) videoTrack.enabled = isCameraOn;
                          if (audioTrack) audioTrack.enabled = isMicOn;
                          
                          setLocalStream(stream);
                          
                          if (localVideoRef.current) {
                            localVideoRef.current.srcObject = stream;
                          }
                          if (fullscreenVideoRef.current) {
                            fullscreenVideoRef.current.srcObject = stream;
                          }
                        } catch (error) {
                          console.error("Error changing camera:", error);
                          toast.error("Failed to switch camera");
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    >
                      {devices.filter(d => d.kind === 'videoinput').map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Microphone</label>
                    <select
                      value={selectedMic}
                      onChange={async (e) => {
                        const deviceId = e.target.value;
                        setSelectedMic(deviceId);
                        
                        try {
                          if (localStream) {
                            localStream.getAudioTracks().forEach(track => track.stop());
                          }
                          
                          const stream = await navigator.mediaDevices.getUserMedia({
                            video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined },
                            audio: { deviceId: { exact: deviceId } }
                          });
                          
                          const videoTrack = stream.getVideoTracks()[0];
                          const audioTrack = stream.getAudioTracks()[0];
                          if (videoTrack) videoTrack.enabled = isCameraOn;
                          if (audioTrack) audioTrack.enabled = isMicOn;
                          
                          setLocalStream(stream);
                          
                          if (localVideoRef.current) {
                            localVideoRef.current.srcObject = stream;
                          }
                          if (fullscreenVideoRef.current) {
                            fullscreenVideoRef.current.srcObject = stream;
                          }
                        } catch (error) {
                          console.error("Error changing microphone:", error);
                          toast.error("Failed to switch microphone");
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    >
                      {devices.filter(d => d.kind === 'audioinput').map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Microphone Test */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Microphone Test</h4>
                <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-6 border border-border/50">
                  <AudioVisualizer stream={localStream} isActive={isMicOn} />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isMicOn ? "🎤 Speak to see audio levels" : "🔇 Microphone is muted"}
                </p>
              </div>
              
              {/* Connection Status */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Connection Status</h4>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end">
              <Button onClick={() => setShowSettings(false)}>
                Close Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
