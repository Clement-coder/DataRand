import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Smartphone, Laptop, Clock, Download, ExternalLink } from "lucide-react";

interface DeviceToggleCardProps {
  deviceType: 'phone' | 'laptop';
  isEnabled: boolean;
  isInstalled: boolean;
  onToggle: () => void;
  isLoading: boolean;
  sessionMinutes?: number;
  demandStatus?: 'connected' | 'waiting' | 'none';
}

const downloadLinks = {
  phone: {
    android: "https://play.google.com/store/apps/details?id=com.datarand.compute",
    ios: "https://apps.apple.com/app/datarand-compute/id123456789",
  },
  laptop: {
    windows: "https://datarand.lovable.app/downloads/datarand-compute-windows.exe",
    mac: "https://datarand.lovable.app/downloads/datarand-compute-mac.dmg",
    linux: "https://datarand.lovable.app/downloads/datarand-compute-linux.AppImage",
  },
};

export function DeviceToggleCard({
  deviceType,
  isEnabled,
  isInstalled,
  onToggle,
  isLoading,
  sessionMinutes = 0,
  demandStatus = 'none'
}: DeviceToggleCardProps) {
  const Icon = deviceType === 'phone' ? Smartphone : Laptop;
  const label = deviceType === 'phone' ? 'Phone' : 'Laptop';
  const tooltipMessage = deviceType === 'phone' 
    ? 'Download the DataRand app to enable mobile earnings' 
    : 'Install DataRand software to enable desktop earnings';

  const getDemandStatusText = () => {
    if (!isEnabled) return null;
    if (demandStatus === 'connected') return 'Connected to workload';
    if (demandStatus === 'waiting') return 'Waiting for demand...';
    return null;
  };

  const cardContent = (
    <Card 
      className={`border transition-all duration-300 ${
        isEnabled && isInstalled 
          ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-transparent shadow-md shadow-primary/10' 
          : isInstalled 
            ? 'border-border/50 hover:border-primary/30' 
            : 'border-border/30'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${
              isEnabled && isInstalled 
                ? 'bg-primary/20' 
                : 'bg-muted'
            }`}>
              <Icon className={`h-5 w-5 ${
                isEnabled && isInstalled 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{label}</span>
              {isEnabled && isInstalled && sessionMinutes > 0 ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {sessionMinutes} min
                </span>
              ) : !isInstalled ? (
                <span className="text-xs text-muted-foreground">Not installed</span>
              ) : getDemandStatusText() ? (
                <span className={`text-xs ${demandStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {getDemandStatusText()}
                </span>
              ) : null}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isInstalled ? (
              <>
                <Switch 
                  checked={isEnabled && isInstalled}
                  onCheckedChange={onToggle}
                  disabled={!isInstalled || isLoading}
                />
                <Badge 
                  variant={isEnabled && isInstalled ? "default" : "secondary"}
                  className="text-xs min-w-[60px] justify-center"
                >
                  {isEnabled && isInstalled ? "ACTIVE" : "OFF"}
                </Badge>
              </>
            ) : (
              <DownloadButtons deviceType={deviceType} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isInstalled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{cardContent}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}

function DownloadButtons({ deviceType }: { deviceType: 'phone' | 'laptop' }) {
  if (deviceType === 'phone') {
    return (
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => window.open(downloadLinks.phone.android, '_blank')}
              >
                <Download className="h-3 w-3 mr-1" />
                Android
              </Button>
            </TooltipTrigger>
            <TooltipContent>Google Play Store</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => window.open(downloadLinks.phone.ios, '_blank')}
              >
                <Download className="h-3 w-3 mr-1" />
                iOS
              </Button>
            </TooltipTrigger>
            <TooltipContent>Apple App Store</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={() => window.open(downloadLinks.laptop.windows, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Win
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download for Windows</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={() => window.open(downloadLinks.laptop.mac, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Mac
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download for macOS</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
