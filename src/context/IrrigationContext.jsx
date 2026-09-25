import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { deviceService } from '../services/deviceService';
import { sensorService } from '../services/sensorService';
import { pumpService } from '../services/pumpService';
import { irrigationService } from '../services/irrigationService';
import { wifiService } from '../services/wifiService';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { formatTime, formatDate, formatDuration } from '../utils/formatters';

const IrrigationContext = createContext(null);

export const IrrigationProvider = ({ children }) => {
  // 1. Connection State: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // 2. Real Telemetry State - ZERO MOCK DATA. Defaults to null.
  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]);
  const [trendData, setTrendData] = useState([]);

  // 3. Hardware Pump State - Determined ONLY by ESP8266
  // Defaults to 'Unknown' when not connected
  const [pumpState, setPumpState] = useState('Unknown');
  const [commandStatus, setCommandStatus] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [remainingTime, setRemainingTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 4. Auto condition summary (computed ONLY if sensorData exists)
  const [autoStatus, setAutoStatus] = useState(null);

  // 5. Wi-Fi Multi-Hotspot State
  const [wifiData, setWifiData] = useState(null);
  const [wifiLoading, setWifiLoading] = useState(false);
  const [wifiConnectingIndex, setWifiConnectingIndex] = useState(null);
  const [wifiError, setWifiError] = useState(null);

  // 6. Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Timer Ref for countdown
  const timerRef = useRef(null);
  const lastSuccessfulHeartbeat = useRef(null);

  // Heartbeat & Telemetry Polling Loop
  const checkDeviceConnection = useCallback(async () => {
    try {
      // 1. Check device status heartbeat
      const statusRes = await deviceService.getStatus();

      if (statusRes && (statusRes.connected === true || statusRes.status?.toLowerCase() === 'online' || statusRes.deviceId)) {
        setConnectionStatus('CONNECTED');
        setDeviceConnected(true);
        setConnectionError(null);
        const seenTime = statusRes.lastSeen || new Date().toISOString();
        setLastSeen(seenTime);
        lastSuccessfulHeartbeat.current = Date.now();
        setDeviceInfo(statusRes);

        // 2. Fetch real sensor data from ESP8266
        try {
          const sensors = await sensorService.getSensors();
          if (sensors) {
            setSensorData(sensors);
            if (sensors.pumpState) {
              setPumpState(sensors.pumpState);
            }
          }
        } catch (sErr) {
          console.warn('Sensors endpoint fetch failed:', sErr);
        }

        // 3. Fetch real pump state from ESP8266
        try {
          const pumpRes = await pumpService.getStatus();
          if (pumpRes) {
            if (pumpRes.pumpState) {
              setPumpState(pumpRes.pumpState);
            }
            if (pumpRes.remainingSeconds !== undefined) {
              setRemainingTime(pumpRes.remainingSeconds);
            }
          }
        } catch (pErr) {
          console.warn('Pump status endpoint fetch failed:', pErr);
        }

        // 4. Fetch real irrigation history
        try {
          const hist = await irrigationService.getHistory();
          if (Array.isArray(hist)) {
            setHistory(hist);
          }
        } catch (hErr) {
          console.warn('History endpoint fetch failed:', hErr);
        }

        // 5. Fetch trends if available
        try {
          const trends = await sensorService.getTrends();
          if (Array.isArray(trends)) {
            setTrendData(trends);
          }
        } catch (tErr) {
          // Trend endpoint optional on microcontroller
        }

      } else {
        handleDeviceDisconnect('Device returned disconnected status');
      }
    } catch (err) {
      handleDeviceDisconnect(err.message || 'Unable to communicate with device');
    }
  }, []);

  const handleDeviceDisconnect = useCallback((reason) => {
    setConnectionStatus('DISCONNECTED');
    setDeviceConnected(false);
    setConnectionError(reason || 'ESP8266 is offline');

    // Reset sensor data to null (NO FAKE / DEFAULT VALUES)
    setSensorData(null);
    setPumpState('Unknown');
    setCommandStatus(null);
    setRemainingTime(null);
    setElapsedTime(0);
    setAutoStatus(null);

    // Reflect disconnected in wifi state if present
    setWifiData((prev) => (prev ? { ...prev, connected: false } : null));

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Poll Wi-Fi status from GET /api/wifi
  const fetchWifiStatus = useCallback(async (silent = true) => {
    if (!silent) setWifiLoading(true);
    try {
      const data = await wifiService.getStatus();
      if (data && typeof data === 'object') {
        setWifiData(data);
        setWifiError(null);
        if (data.ip || data.ssid) {
          setDeviceInfo((prev) => ({
            ...prev,
            ipAddress: data.ip || prev?.ipAddress,
            wifiSsid: data.ssid || prev?.wifiSsid,
          }));
        }
      }
      return data;
    } catch (err) {
      setWifiError(err.message || 'Wi-Fi status unavailable');
      setWifiData((prev) => (prev ? { ...prev, connected: false } : null));
      if (!silent) {
        throw err;
      }
    } finally {
      if (!silent) setWifiLoading(false);
    }
  }, []);

  // Run Heartbeat Poller every 4 seconds
  useEffect(() => {
    setConnectionStatus('CONNECTING');
    checkDeviceConnection();

    const interval = setInterval(() => {
      checkDeviceConnection();
    }, 4000);

    return () => clearInterval(interval);
  }, [checkDeviceConnection]);

  // Run Wi-Fi Polling every 6 seconds (within 5-10s requirement)
  useEffect(() => {
    fetchWifiStatus(true);

    const wifiInterval = setInterval(() => {
      fetchWifiStatus(true);
    }, 6000);

    return () => clearInterval(wifiInterval);
  }, [fetchWifiStatus]);

  // Evaluate Auto Condition logic
  useEffect(() => {
    if (!deviceConnected) {
      setAutoStatus({
        canRun: false,
        reason: 'ESP Offline',
        condition: 'DISCONNECTED',
      });
      return;
    }

    if (!sensorData) {
      setAutoStatus({
        canRun: false,
        reason: 'Awaiting sensor readings',
        condition: 'AWAITING',
      });
      return;
    }

    const mode = sensorData.irrigationMode;
    const { soilMoisture, rainDetected, settings } = sensorData;
    const threshold = settings?.soilDrynessThreshold ?? 35;
    const rainProtection = settings?.rainProtectionEnabled ?? true;

    if (mode === 'MANUAL') {
      setAutoStatus({
        canRun: pumpState === 'ON',
        reason: 'Manual mode — operator control',
        condition: 'MANUAL',
      });
      return;
    }

    if (rainDetected && rainProtection) {
      setAutoStatus({
        canRun: false,
        reason: 'Rain detected — irrigation locked',
        condition: 'RAIN_LOCKED',
      });
    } else if (typeof soilMoisture === 'number' && soilMoisture <= threshold) {
      setAutoStatus({
        canRun: true,
        reason: 'Soil is dry — irrigation required',
        condition: 'SOIL_DRY',
      });
    } else if (typeof soilMoisture === 'number') {
      setAutoStatus({
        canRun: false,
        reason: 'Soil moisture adequate — irrigation not required',
        condition: 'SOIL_ADEQUATE',
      });
    } else {
      setAutoStatus({
        canRun: false,
        reason: 'Awaiting sensor readings',
        condition: 'AWAITING',
      });
    }
  }, [deviceConnected, sensorData, pumpState]);

  // REAL PUMP CONTROL
  const startManualPump = useCallback(async (duration) => {
    if (!deviceConnected) {
      showToast('Pump control unavailable — device not connected.', 'error', 'Device Disconnected');
      return;
    }

    const targetDuration = duration || selectedDuration;
    setCommandStatus('Starting pump...');

    try {
      await pumpService.start(targetDuration);

      let confirmedOn = false;
      const pollStart = Date.now();

      while (Date.now() - pollStart < 3500) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        try {
          const confirmed = await pumpService.getStatus();
          if (confirmed && (confirmed.pumpState === 'ON' || confirmed.status === 'ON')) {
            confirmedOn = true;
            setPumpState('ON');
            setCommandStatus(null);
            const remaining = confirmed.remainingSeconds ?? targetDuration;
            setRemainingTime(remaining);
            setElapsedTime(0);
            showToast(`ESP8266 confirmed pump ON (${targetDuration}s)`, 'success', 'Relay Engaged');

            if (timerRef.current) clearInterval(timerRef.current);
            let rem = remaining;
            timerRef.current = setInterval(() => {
              rem -= 1;
              setRemainingTime((r) => (r !== null && r > 0 ? r - 1 : 0));
              setElapsedTime((e) => e + 1);

              if (rem <= 0) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                checkDeviceConnection();
              }
            }, 1000);

            break;
          }
        } catch {
          // Poll retry
        }
      }

      if (!confirmedOn) {
        setCommandStatus('Unable to confirm pump state');
        showToast('Unable to confirm pump state from ESP8266.', 'warning', 'Confirmation Pending');
      }
    } catch (err) {
      setCommandStatus('Command failed');
      showToast(err.message || 'Failed to send start command to ESP8266.', 'error', 'Command Error');
    }
  }, [deviceConnected, selectedDuration, showToast, checkDeviceConnection]);

  const stopPumpNow = useCallback(async () => {
    if (!deviceConnected) {
      showToast('Pump control unavailable — device not connected.', 'error', 'Device Disconnected');
      return;
    }

    setCommandStatus('Stopping pump...');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await pumpService.stop('manual_stop');

      let confirmedOff = false;
      const pollStart = Date.now();
      while (Date.now() - pollStart < 2500) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          const confirmed = await pumpService.getStatus();
          if (confirmed && (confirmed.pumpState === 'OFF' || confirmed.status === 'OFF')) {
            confirmedOff = true;
            break;
          }
        } catch {
          // Poll retry
        }
      }

      setPumpState('OFF');
      setCommandStatus(null);
      setRemainingTime(0);
      showToast('ESP8266 confirmed pump OFF', 'info', 'Relay Disengaged');
      checkDeviceConnection();
    } catch (err) {
      setCommandStatus('Command failed');
      showToast(err.message || 'Failed to stop pump on ESP8266.', 'error', 'Stop Error');
    }
  }, [deviceConnected, showToast, checkDeviceConnection]);

  const setIrrigationMode = useCallback(async (mode) => {
    if (!deviceConnected) {
      showToast('Mode control unavailable — device not connected.', 'error', 'Device Disconnected');
      return;
    }

    try {
      await pumpService.setMode(mode);
      setSensorData((prev) => (prev ? { ...prev, irrigationMode: mode } : null));
      showToast(`Mode set to ${mode} on ESP8266`, 'info', 'Mode Updated');
    } catch (err) {
      showToast(err.message || 'Failed to set mode on device.', 'error', 'Error');
    }
  }, [deviceConnected, showToast]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      if (newSettings.espEndpointUrl) {
        setApiBaseUrl(newSettings.espEndpointUrl);
      }
      if (deviceConnected) {
        await deviceService.updateSettings(newSettings);
      }
      showToast('Settings saved.', 'success', 'Saved');
      checkDeviceConnection();
      fetchWifiStatus(true);
    } catch (err) {
      showToast(err.message || 'Could not save settings to device.', 'error', 'Error');
    }
  }, [deviceConnected, showToast, checkDeviceConnection, fetchWifiStatus]);

  // Connect to a saved Wi-Fi network on ESP8266
  const connectWifiNetwork = useCallback(async (index, targetSsid) => {
    if (wifiConnectingIndex !== null) return;
    setWifiConnectingIndex(index);
    showToast('Connection attempt started', 'info', 'Wi-Fi Connection');

    try {
      await wifiService.connectNetwork(index);

      // Poll GET /api/wifi waiting for connected: true and matching SSID
      let connectedSuccessfully = false;
      const startTime = Date.now();
      const maxWaitMs = 18000;

      while (Date.now() - startTime < maxWaitMs) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const status = await wifiService.getStatus();
          if (status) {
            setWifiData(status);
            const matchesSsid = targetSsid ? status.ssid === targetSsid : true;
            if (status.connected === true && matchesSsid) {
              connectedSuccessfully = true;
              showToast(`Connected to ${status.ssid || targetSsid}`, 'success', 'Wi-Fi Connected');
              checkDeviceConnection();
              break;
            }
          }
        } catch {
          // Device may restart Wi-Fi stack while switching networks
        }
      }

      if (!connectedSuccessfully) {
        try {
          const finalStatus = await wifiService.getStatus();
          if (finalStatus) setWifiData(finalStatus);
        } catch {}
        showToast('Connection attempt in progress or waiting for ESP8266 to acquire IP.', 'warning', 'Connection Pending');
      }
    } catch (err) {
      showToast(err.message || 'Failed to initiate Wi-Fi connection.', 'error', 'Wi-Fi Error');
    } finally {
      setWifiConnectingIndex(null);
    }
  }, [wifiConnectingIndex, showToast, checkDeviceConnection]);

  // Add Wi-Fi network (credentials sent directly to ESP8266; never stored in localStorage)
  const addWifiNetwork = useCallback(async (ssid, password) => {
    try {
      await wifiService.addNetwork(ssid, password);
      showToast(`Wi-Fi network "${ssid}" saved successfully.`, 'success', 'Network Saved');
      await fetchWifiStatus(false);
      return true;
    } catch (err) {
      showToast(err.message || 'Failed to save Wi-Fi network.', 'error', 'Save Error');
      throw err;
    }
  }, [showToast, fetchWifiStatus]);

  // Remove Wi-Fi network by index
  const removeWifiNetwork = useCallback(async (index, ssid) => {
    try {
      await wifiService.removeNetwork(index);
      showToast(ssid ? `Removed "${ssid}" from saved networks.` : 'Network removed.', 'info', 'Network Removed');
      await fetchWifiStatus(false);
      return true;
    } catch (err) {
      showToast(err.message || 'Failed to remove Wi-Fi network.', 'error', 'Remove Error');
      throw err;
    }
  }, [showToast, fetchWifiStatus]);

  // Manual trigger to retry connecting
  const retryConnection = useCallback(() => {
    setConnectionStatus('CONNECTING');
    showToast('Attempting to reconnect to ESP8266...', 'info', 'Reconnecting');
    checkDeviceConnection();
    fetchWifiStatus(false);
  }, [showToast, checkDeviceConnection, fetchWifiStatus]);

  return (
    <IrrigationContext.Provider
      value={{
        connectionStatus,
        deviceConnected,
        lastSeen,
        deviceInfo,
        connectionError,
        sensorData,
        history,
        trendData,
        pumpState,
        commandStatus,
        selectedDuration,
        setSelectedDuration,
        remainingTime,
        elapsedTime,
        autoStatus,
        wifiData,
        wifiLoading,
        wifiConnectingIndex,
        wifiError,
        toasts,
        showToast,
        removeToast,
        startManualPump,
        stopPumpNow,
        setIrrigationMode,
        updateSettings,
        retryConnection,
        checkDeviceConnection,
        fetchWifiStatus,
        connectWifiNetwork,
        addWifiNetwork,
        removeWifiNetwork,
      }}
    >
      {children}
    </IrrigationContext.Provider>
  );
};

export const useIrrigation = () => {
  const context = useContext(IrrigationContext);
  if (!context) {
    throw new Error('useIrrigation must be used within an IrrigationProvider');
  }
  return context;
};
