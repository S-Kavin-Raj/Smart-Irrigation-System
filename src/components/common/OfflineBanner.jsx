import React from 'react';
import { Link } from 'react-router-dom';
import { useIrrigation } from '../../context/IrrigationContext';
import { WifiOff, AlertCircle, RefreshCw, Cpu, ExternalLink, Settings } from 'lucide-react';
import { Button } from '../common/Button';
import { getApiBaseUrl } from '../../services/api';

export const OfflineBanner = () => {
  const { connectionStatus, deviceConnected, retryConnection, connectionError, lastSeen } = useIrrigation();

  if (deviceConnected && connectionStatus === 'CONNECTED') {
    return null;
  }

  const isConnecting = connectionStatus === 'CONNECTING';
  const targetUrl = getApiBaseUrl();

  return (
    <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-800 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-base sm:text-lg font-bold text-rose-900 tracking-tight">
                {isConnecting ? 'CONNECTING TO ESP8266...' : 'DEVICE NOT CONNECTED'}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-rose-700 font-medium mt-0.5">
              {isConnecting
                ? 'Attempting to establish Wi-Fi / REST connection with NodeMCU...'
                : 'ESP8266 is offline. Connect the controller to view data.'}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-rose-600/90 font-mono">
              <span>Target Endpoint: <strong>{targetUrl}</strong></span>
              {lastSeen && <span>Last Seen: {new Date(lastSeen).toLocaleTimeString()}</span>}
              {connectionError && <span className="text-rose-500 font-sans italic">({connectionError})</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <Link
            to="/settings"
            className="inline-flex items-center justify-center font-medium rounded-lg px-3 py-1.5 text-xs gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition w-full sm:w-auto shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5" />
            Wi-Fi & Settings
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={retryConnection}
            loading={isConnecting}
            icon={RefreshCw}
            className="w-full sm:w-auto"
          >
            {isConnecting ? 'Checking...' : 'Retry Connection'}
          </Button>
        </div>
      </div>
    </div>
  );
};
