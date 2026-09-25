import React, { useState } from 'react';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { WifiSettingsCard } from '../components/settings/WifiSettingsCard';
import { useIrrigation } from '../context/IrrigationContext';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import {
  Save,
  CheckCircle2,
  Info,
  RefreshCw,
  Globe,
  Radio,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const SettingsPage = () => {
  const {
    deviceConnected,
    connectionStatus,
    deviceInfo,
    lastSeen,
    sensorData,
    wifiData,
    updateSettings,
    retryConnection
  } = useIrrigation();

  const [endpointUrl, setEndpointUrl] = useState(getApiBaseUrl());
  const [soilThreshold, setSoilThreshold] = useState(
    sensorData?.settings?.soilDrynessThreshold ?? 35
  );
  const [maxRuntime, setMaxRuntime] = useState(
    sensorData?.settings?.maxAutoRuntimeSeconds ?? 180
  );
  const [rainProtection, setRainProtection] = useState(
    sensorData?.settings?.rainProtectionEnabled ?? true
  );
  const [defaultMode, setDefaultMode] = useState(
    sensorData?.settings?.defaultMode ?? 'AUTO'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync settings when loaded from ESP8266
  React.useEffect(() => {
    if (sensorData?.settings) {
      if (sensorData.settings.soilDrynessThreshold !== undefined) {
        setSoilThreshold(sensorData.settings.soilDrynessThreshold);
      }
      if (sensorData.settings.maxAutoRuntimeSeconds !== undefined) {
        setMaxRuntime(sensorData.settings.maxAutoRuntimeSeconds);
      }
      if (sensorData.settings.rainProtectionEnabled !== undefined) {
        setRainProtection(sensorData.settings.rainProtectionEnabled);
      }
      if (sensorData.settings.defaultMode !== undefined) {
        setDefaultMode(sensorData.settings.defaultMode);
      }
    }
  }, [sensorData?.settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiBaseUrl(endpointUrl);
    updateSettings({
      espEndpointUrl: endpointUrl,
      soilDrynessThreshold: soilThreshold,
      maxAutoRuntimeSeconds: maxRuntime,
      rainProtectionEnabled: rainProtection,
      defaultMode: defaultMode
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      <div>
        <h2 className="text-xl font-bold text-slate-900">System & Device Settings</h2>
        <p className="text-xs text-slate-500">
          Configure ESP8266 REST API connection URL, thresholds, Wi-Fi hotspots, and safety limits
        </p>
      </div>

      {/* Cloud vs Local Network Deployment Architecture Notice */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-brand-50/30 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Cloud & Local Network Architecture</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-800">
                Render Compatible
              </span>
            </div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              When deployed to Render (HTTPS), browser requests to the ESP8266 private IP (e.g. <code className="font-mono text-[11px] font-semibold">192.168.137.253</code>) run directly from your local browser client. Ensure your device is on the same local Wi-Fi / hotspot.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <span className="text-[11px] text-slate-500">Cloud UI:</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
            Online ●
          </span>
          <span className="text-[11px] text-slate-500 ml-1">ESP Link:</span>
          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
            deviceConnected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {deviceConnected ? 'Active ●' : 'Offline ●'}
          </span>
        </div>
      </div>

      {/* 1. NEW REQUIREMENT: Wi-Fi Networks Management Section */}
      <WifiSettingsCard />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. ESP8266 REST API Endpoint Configuration */}
        <Card title="ESP8266 REST API Endpoint URL" subtitle="Configure target URL for microcontroller communication">
          <div className="space-y-3 text-xs sm:text-sm">
            <p className="text-slate-600">
              Enter the IP address or host URL of the ESP8266 NodeMCU on your local Wi-Fi network:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="http://192.168.137.253"
                required
              />
              <Button
                type="button"
                variant="outline"
                icon={RefreshCw}
                onClick={retryConnection}
              >
                Test Connection
              </Button>
            </div>
            <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl text-xs text-brand-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>
                The frontend connects directly to this endpoint. Expected endpoints on ESP8266:
                <code className="font-mono ml-1 font-bold">GET /api/device/status</code>,
                <code className="font-mono ml-1 font-bold">GET /api/sensors</code>,
                <code className="font-mono ml-1 font-bold">GET /api/wifi</code>,
                <code className="font-mono ml-1 font-bold">POST /api/pump/start</code>,
                <code className="font-mono ml-1 font-bold">POST /api/pump/stop</code>.
              </span>
            </div>
          </div>
        </Card>

        {/* 3. Device Hardware Information */}
        <Card title="ESP8266 NodeMCU Hardware Telemetry">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block">Device Identifier</span>
              <span className="font-semibold text-slate-800">
                {deviceInfo?.deviceId || (deviceConnected ? 'ESP8266-NodeMCU' : '--')}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs block">Wi-Fi Connection</span>
                <span className="font-semibold text-slate-800">
                  {wifiData?.ssid || deviceInfo?.wifiSsid || (deviceConnected ? 'Connected' : '--')}
                </span>
              </div>
              <StatusBadge
                status={deviceConnected ? 'Connected' : 'Disconnected'}
                variant={deviceConnected ? 'green' : 'red'}
                size="sm"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block">ESP8266 IP Address</span>
              <span className="font-mono text-slate-800 font-semibold">
                {wifiData?.ip || deviceInfo?.ipAddress || (deviceConnected ? endpointUrl.replace(/https?:\/\//, '').replace(/\/api.*/, '') : '--')}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block">MAC Address</span>
              <span className="font-mono text-slate-800 font-semibold">
                {deviceInfo?.macAddress || '--'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block">Last Seen Time</span>
              <span className="font-mono text-slate-800 font-semibold">
                {lastSeen ? new Date(lastSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '--'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-xs block">Hardware Link</span>
              <span className="text-slate-700 font-semibold">
                {deviceConnected ? 'REST API Active' : 'Offline / Standby'}
              </span>
            </div>
          </div>
        </Card>

        {/* 4. Irrigation Policy & Thresholds */}
        <Card title="Autonomous Thresholds & Safety Rules">
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Default Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <label className="font-semibold text-slate-800 block">Default Startup Mode</label>
                <span className="text-xs text-slate-500">
                  Initial operating mode when controller boots or resets
                </span>
              </div>
              <select
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="AUTO">AUTO (Autonomous)</option>
                <option value="MANUAL">MANUAL (Operator)</option>
              </select>
            </div>

            {/* Soil Dryness Threshold Slider */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <label className="font-semibold text-slate-800 block">Soil Dryness Threshold (%)</label>
                  <span className="text-xs text-slate-500">
                    Triggers auto-irrigation when soil moisture drops below this value
                  </span>
                </div>
                <span className="text-sm font-bold text-brand-700 font-mono px-2.5 py-1 bg-brand-50 rounded-lg border border-brand-200">
                  {soilThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="1"
                value={soilThreshold}
                onChange={(e) => setSoilThreshold(Number(e.target.value))}
                className="w-full accent-brand-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>15% (Very Dry / Arid)</span>
                <span>35% (Recommended)</span>
                <span>60% (High Moisture)</span>
              </div>
            </div>

            {/* Maximum Auto Runtime */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <label className="font-semibold text-slate-800 block">Maximum Auto Pump Runtime</label>
                <span className="text-xs text-slate-500">
                  Safety cut-off limit in seconds for autonomous cycles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="30"
                  max="600"
                  step="10"
                  value={maxRuntime}
                  onChange={(e) => setMaxRuntime(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-500">seconds</span>
              </div>
            </div>

            {/* Rain Protection Switch */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="font-semibold text-slate-800 block">Rain Protection Interlock</label>
                <span className="text-xs text-slate-500">
                  Automatically suppress all irrigation runs when rain sensor detects moisture
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rainProtection}
                  onChange={(e) => setRainProtection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Save Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Changes saved
            </span>
          )}
          <Button type="submit" variant="primary" size="md" icon={Save}>
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
