import React, { useState, useEffect } from 'react';
import { Menu, User, Clock, RefreshCw } from 'lucide-react';
import { useIrrigation } from '../context/IrrigationContext';

export const Header = ({ onToggleSidebar }) => {
  const { connectionStatus, deviceConnected, lastSeen, retryConnection, wifiData } = useIrrigation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Smart Irrigation System
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            ESP8266 NodeMCU Real Hardware Dashboard
          </p>
        </div>
      </div>

      {/* Right: Live Connection, Mode & Clock Status */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>

        {/* ESP8266 Connection Indicator: Connected (Green) / Connecting (Yellow) / Not Connected (Red) */}
        <div className="flex items-center gap-2">
          <button
            onClick={retryConnection}
            title={
              deviceConnected
                ? `Connected to ESP8266 (${wifiData?.ssid || 'MSI 2988'}). IP: ${wifiData?.ip || '192.168.137.253'}`
                : 'Device not connected. Click to retry connection.'
            }
            className="flex items-center gap-2 px-3 py-1 bg-white hover:bg-slate-50 rounded-full border border-slate-200 text-xs font-medium transition cursor-pointer shadow-xs"
          >
            {connectionStatus === 'CONNECTED' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-semibold">
                  {wifiData?.ssid ? `ESP8266 (${wifiData.ssid})` : 'ESP8266 Connected'}
                </span>
              </>
            ) : connectionStatus === 'CONNECTING' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-700 font-semibold">Connecting...</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-rose-600 font-semibold">Not Connected</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center font-semibold text-xs">
            <User className="w-4 h-4" />
          </div>
          <span className="hidden lg:block text-xs font-semibold text-slate-700">Admin</span>
        </div>
      </div>
    </header>
  );
};
