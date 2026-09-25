import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { useIrrigation } from '../../context/IrrigationContext';
import {
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  Radio,
  RefreshCw,
  Lock,
  Server,
  AlertTriangle,
  X,
  CheckCircle2,
  Info
} from 'lucide-react';

export const WifiSettingsCard = () => {
  const {
    deviceConnected,
    wifiData,
    wifiLoading,
    wifiConnectingIndex,
    wifiError,
    fetchWifiStatus,
    connectWifiNetwork,
    addWifiNetwork,
    removeWifiNetwork,
  } = useIrrigation();

  // Add Network Modal / Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ssidInput, setSsidInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addFormError, setAddFormError] = useState(null);

  // Remove Network Confirmation State
  const [networkToRemove, setNetworkToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Derive connection values
  const isWifiConnected = wifiData ? Boolean(wifiData.connected) : deviceConnected;
  const currentSsid = wifiData?.ssid || (isWifiConnected ? 'MSI 2988' : '--');
  const currentIp = wifiData?.ip || (isWifiConnected ? '192.168.137.253' : '--');
  const savedNetworks = Array.isArray(wifiData?.networks) ? wifiData.networks : [];
  const maxNetworksReached = savedNetworks.length >= 5;

  const handleOpenAddModal = () => {
    setSsidInput('');
    setPasswordInput('');
    setAddFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    // SECURITY: Always clear password input on close
    setPasswordInput('');
    setSsidInput('');
    setAddFormError(null);
    setIsAddModalOpen(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!ssidInput.trim()) {
      setAddFormError('Please enter a valid network name / SSID.');
      return;
    }

    setIsSubmitting(true);
    setAddFormError(null);

    try {
      await addWifiNetwork(ssidInput.trim(), passwordInput);
      // SECURITY: Instantly clear password from memory and form
      setPasswordInput('');
      setSsidInput('');
      setIsAddModalOpen(false);
    } catch (err) {
      // SECURITY: Clear password even on error
      setPasswordInput('');
      setAddFormError(err.message || 'Failed to save Wi-Fi network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!networkToRemove) return;
    setIsRemoving(true);
    try {
      await removeWifiNetwork(networkToRemove.index, networkToRemove.ssid);
      setNetworkToRemove(null);
    } catch (err) {
      // Toast already shown in context
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card
      title="Wi-Fi Networks"
      subtitle="Manage saved Wi-Fi hotspots and active connection on ESP8266"
      action={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={wifiLoading}
            onClick={() => fetchWifiStatus(false)}
            title="Refresh Wi-Fi Networks list from ESP8266"
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
            disabled={maxNetworksReached || wifiConnectingIndex !== null}
            title={maxNetworksReached ? 'Maximum 5 networks stored' : 'Add another Wi-Fi hotspot'}
          >
            + Add Hotspot
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-xs sm:text-sm">
        {/* ============================================================== */}
        {/* 1. Wi-Fi Connection Header Block                               */}
        {/* ============================================================== */}
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
              <Wifi className="w-4 h-4 text-brand-600" />
              Wi-Fi Connection
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              {isWifiConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Disconnected
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Current Network</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${isWifiConnected ? 'text-brand-600' : 'text-slate-400'}`} />
                {currentSsid}
              </span>
            </div>

            <div className="flex flex-col bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">ESP IP Address</span>
              <span className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {currentIp}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. Saved Networks List                                         */}
        {/* ============================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Saved Networks</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {savedNetworks.length} / 5 hotspots registered on ESP8266
              </p>
            </div>
            {maxNetworksReached && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                Maximum 5 networks stored
              </span>
            )}
          </div>

          {savedNetworks.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
              <WifiOff className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                {deviceConnected
                  ? 'No saved Wi-Fi networks found from GET /api/wifi'
                  : 'ESP8266 Offline — Saved networks will load once connected.'}
              </p>
              <p className="text-xs text-slate-400">
                Default supported network: <strong>MSI 2988</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedNetworks.map((net) => {
                const isItemConnected = Boolean(net.connected);
                const isConnectingThis = wifiConnectingIndex === net.index;
                const isAnyConnecting = wifiConnectingIndex !== null;

                return (
                  <div
                    key={net.index}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      isItemConnected
                        ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Badge & SSID info */}
                    <div className="flex items-center gap-3">
                      {isItemConnected ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          Connected
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          Saved
                        </span>
                      )}

                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{net.ssid}</span>
                        </div>
                        {isItemConnected && wifiData?.ip && (
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            IP: <strong>{wifiData.ip}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant={isItemConnected ? 'outline' : 'secondary'}
                        size="sm"
                        icon={Radio}
                        disabled={isItemConnected || isAnyConnecting}
                        loading={isConnectingThis}
                        onClick={() => connectWifiNetwork(net.index, net.ssid)}
                      >
                        {isConnectingThis
                          ? 'Connecting...'
                          : isItemConnected
                          ? 'Active'
                          : 'Connect'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        disabled={isAnyConnecting}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        onClick={() => setNetworkToRemove(net)}
                        title="Remove network"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. Add Wi-Fi Network Modal / Form                              */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Wi-Fi Network</h3>
                  <p className="text-xs text-slate-500">Register a new hotspot with ESP8266</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              {addFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{addFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Network Name / SSID
                </label>
                <input
                  type="text"
                  value={ssidInput}
                  onChange={(e) => setSsidInput(e.target.value)}
                  placeholder="e.g. MSI 2988 or Mobile Hotspot"
                  required
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[11px] font-normal text-slate-400">(Leave blank if open)</span>
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter Wi-Fi network password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Security note: Password is sent directly to ESP8266 and never stored in browser memory.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCloseAddModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSubmitting}
                  icon={CheckCircle2}
                >
                  Save Network
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. Remove Confirmation Modal                                   */}
      {/* ============================================================== */}
      {networkToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-900">Remove this Wi-Fi network?</h4>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Are you sure you want to remove <strong>"{networkToRemove.ssid}"</strong> (Index {networkToRemove.index})? The ESP8266 will no longer automatically connect to this hotspot.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setNetworkToRemove(null)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                loading={isRemoving}
                icon={Trash2}
                onClick={handleConfirmRemove}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WifiSettingsCard;
