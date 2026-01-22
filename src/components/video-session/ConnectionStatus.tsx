import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Loader2, Eye } from "lucide-react";
import { ConnectionState } from "@/utils/connectionManager";

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  className?: string;
  isViewOnly?: boolean;
}

export function ConnectionStatus({ connectionState, className = "", isViewOnly = false }: ConnectionStatusProps) {
  const { isConnected, quality, reconnectAttempts } = connectionState;

  // Determine status display
  const getStatusConfig = () => {
    // View-only mode (observer/monitor)
    if (isViewOnly) {
      return {
        icon: <Eye className="h-3 w-3" />,
        text: "View Only",
        variant: "secondary" as const,
        className: "bg-purple-100 text-purple-800 border-purple-200"
      };
    }

    if (!isConnected && reconnectAttempts > 0) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: `Reconnecting... (${reconnectAttempts}/10)`,
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200"
      };
    }

    // Show "Connecting..." when not connected but quality is not 'disconnected'
    // This happens when WebRTC is initializing
    if (!isConnected && quality !== 'disconnected') {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: "Connecting...",
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800 border-blue-200"
      };
    }

    if (!isConnected) {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: "Disconnected",
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-200"
      };
    }

    switch (quality) {
      case 'good':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: "Connected",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200"
        };
      
      case 'poor':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          text: "Poor Quality",
          variant: "secondary" as const,
          className: "bg-orange-100 text-orange-800 border-orange-200"
        };
      
      default:
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: "Connecting...",
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 border-blue-200"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1 text-xs font-medium ${config.className} ${className}`}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
}

export default ConnectionStatus;