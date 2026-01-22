import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DeviceSelectorProps {
  onDeviceChange: (deviceId: string, kind: "videoinput" | "audioinput") => void;
  selectedVideoDevice?: string;
  selectedAudioDevice?: string;
}

export function DeviceSelector({ onDeviceChange, selectedVideoDevice, selectedAudioDevice }: DeviceSelectorProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");

  // Update local state when props change
  useEffect(() => {
    if (selectedVideoDevice) {
      setSelectedVideo(selectedVideoDevice);
    }
  }, [selectedVideoDevice]);

  useEffect(() => {
    if (selectedAudioDevice) {
      setSelectedAudio(selectedAudioDevice);
    }
  }, [selectedAudioDevice]);

  useEffect(() => {
    loadDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(d => d.kind === 'videoinput');
      const audios = devices.filter(d => d.kind === 'audioinput');
      
      console.log("Available video devices:", videos.map(d => ({ id: d.deviceId, label: d.label })));
      console.log("Available audio devices:", audios.map(d => ({ id: d.deviceId, label: d.label })));
      
      setVideoDevices(videos);
      setAudioDevices(audios);
      
      // Only set default if no device is selected yet (neither from state nor props)
      if (videos.length > 0 && !selectedVideo && !selectedVideoDevice) {
        setSelectedVideo(videos[0].deviceId);
      }
      if (audios.length > 0 && !selectedAudio && !selectedAudioDevice) {
        setSelectedAudio(audios[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const handleVideoChange = (deviceId: string) => {
    setSelectedVideo(deviceId);
    onDeviceChange(deviceId, "videoinput");
  };

  const handleAudioChange = (deviceId: string) => {
    setSelectedAudio(deviceId);
    onDeviceChange(deviceId, "audioinput");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="camera-select" className="text-sm font-medium">
          Camera
        </Label>
        <Select value={selectedVideo || selectedVideoDevice} onValueChange={handleVideoChange}>
          <SelectTrigger id="camera-select">
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent className="z-[200]">
            {videoDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="microphone-select" className="text-sm font-medium">
          Microphone
        </Label>
        <Select value={selectedAudio || selectedAudioDevice} onValueChange={handleAudioChange}>
          <SelectTrigger id="microphone-select">
            <SelectValue placeholder="Select microphone" />
          </SelectTrigger>
          <SelectContent className="z-[200]">
            {audioDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
