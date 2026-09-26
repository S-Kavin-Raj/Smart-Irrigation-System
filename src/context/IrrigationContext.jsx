import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { deviceService } from '../services/deviceService';
import { sensorService } from '../services/sensorService';
import { pumpService } from '../services/pumpService';
import { irrigationService } from '../services/irrigationService';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { formatTime, formatDate, formatDuration } from '../utils/formatters';

const IrrigationContext = createContext(null);

export const IrrigationProvider = ({ children }) => {
  // 1. Connection State: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
  // INITIAL STATE MUST BE DISCONNECTED (deviceConnected = false)
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

  // 5. Toasts
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
  // Continuously checks whether the ESP8266/backend is reachable
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
        // Response received but device marked not connected
        handleDeviceDisconnect('Device returned disconnected status');
      }
    } catch (err) {
      // Network failed / device unreachable
      handleDeviceDisconnect(err.message || 'Unable to communicate with device');
    }
  }, []);

  const handleDeviceDisconnect = useCallback((reason) => {
    setConnectionStatus((prev) => {
      // If we previously had error or disconnected, keep it
      if (reason && reason.includes('timed out')) return 'DISCONNECTED';
      return 'DISCONNECTED';
    });
    setDeviceConnected(false);
    setConnectionError(reason || 'ESP8266 is offline');

    // Reset sensor data to null (NO FAKE / DEFAULT VALUES)
    setSensorData(null);
    setPumpState('Unknown');
    setCommandStatus(null);
    setRemainingTime(null);
    setElapsedTime(0);
    setAutoStatus(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Run Heartbeat Poller every 4 seconds
  useEffect(() => {
    // Initial attempt marked as CONNECTING
    setConnectionStatus('CONNECTING');
    checkDeviceConnection();

    const interval = setInterval(() => {
      checkDeviceConnection();
    }, 4000);

    return () => clearInterval(interval);
  }, [checkDeviceConnection]);

  // Evaluate Auto Condition logic:
  // Examples:
  // - "Rain detected — irrigation locked"
  // - "Soil is dry — irrigation required"
  // - "Soil moisture adequate — irrigation not required"
  // - "Manual mode — operator control"
  // - "Device disconnected"
  useEffect(() => {
    if (!deviceConnected) {
      setAutoStatus({
        canRun: false,
        reason: 'Device disconnected',
        condition: 'DISCONNECTED'
      });
      return;
    }

    if (!sensorData) {
      setAutoStatus({
        canRun: false,
        reason: 'Awaiting sensor readings',
        condition: 'AWAITING'
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
        condition: 'MANUAL'
      });
      return;
    }

    if (rainDetected && rainProtection) {
      setAutoStatus({
        canRun: false,
        reason: 'Rain detected — irrigation locked',
        condition: 'RAIN_LOCKED'
      });
    } else if (typeof soilMoisture === 'number' && soilMoisture <= threshold) {
      setAutoStatus({
        canRun: true,
        reason: 'Soil is dry — irrigation required',
        condition: 'SOIL_DRY'
      });
    } else if (typeof soilMoisture === 'number') {
      setAutoStatus({
        canRun: false,
        reason: 'Soil moisture adequate — irrigation not required',
        condition: 'SOIL_ADEQUATE'
      });
    } else {
      setAutoStatus({
        canRun: false,
        reason: 'Awaiting sensor readings',
        condition: 'AWAITING'
      });
    }
  }, [deviceConnected, sensorData, pumpState]);

  // REAL PUMP CONTROL
  // Send START command to ESP8266 and wait for confirmation
  const startManualPump = useCallback(async (duration) => {
    if (!deviceConnected) {
      showToast('Pump control unavailable — device not connected.', 'error', 'Device Disconnected');
      return;
    }

    const targetDuration = duration || selectedDuration;
    setCommandStatus('Starting pump...');

    try {
      // POST /api/pump/start with { duration }
      await pumpService.start(targetDuration);

      // Poll GET /api/pump to confirm the physical pump state is ON
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

            // Only then start the countdown timer
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

  // Send STOP command to ESP8266 and wait for confirmation
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
      // POST /api/pump/stop with { reason: "manual_stop" }
      await pumpService.stop('manual_stop');

      // Poll to confirm physical OFF state
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
      // Refresh real history from device
      checkDeviceConnection();
    } catch (err) {
      setCommandStatus('Command failed');
      showToast(err.message || 'Failed to stop pump on ESP8266.', 'error', 'Stop Error');
    }
  }, [deviceConnected, showToast, checkDeviceConnection]);

  // Change Operating Mode on ESP8266 (AUTO / MANUAL)
  const setIrrigationMode = useCallback(async (mode) => {
    if (!deviceConnected) {
      showToast('Mode control unavailable — device not connected.', 'error', 'Device Disconnected');
      return;
    }

    try {
      await pumpService.setMode(mode);
      setSensorData((prev) => prev ? { ...prev, irrigationMode: mode } : null);
      showToast(`Mode set to ${mode} on ESP8266`, 'info', 'Mode Updated');
    } catch (err) {
      showToast(err.message || 'Failed to set mode on device.', 'error', 'Error');
    }
  }, [deviceConnected, showToast]);

  // Update Settings on ESP8266
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
    } catch (err) {
      showToast(err.message || 'Could not save settings to device.', 'error', 'Error');
    }
  }, [deviceConnected, showToast, checkDeviceConnection]);

  // Manual Trigger to retry connecting
  const retryConnection = useCallback(() => {
    setConnectionStatus('CONNECTING');
    showToast('Attempting to reconnect to ESP8266...', 'info', 'Reconnecting');
    checkDeviceConnection();
  }, [showToast, checkDeviceConnection]);

  return (
    <IrrigationContext.Provider
      value={{
        connectionStatus, // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
        deviceConnected, // boolean (initial: false)
        lastSeen,
        deviceInfo,
        connectionError,
        sensorData, // null when disconnected
        history, // [] when disconnected
        trendData,
        pumpState, // 'Unknown' | 'OFF' | 'ON'
        commandStatus,
        selectedDuration,
        setSelectedDuration,
        remainingTime,
        elapsedTime,
        autoStatus,
        toasts,
        showToast,
        removeToast,
        startManualPump,
        stopPumpNow,
        setIrrigationMode,
        updateSettings,
        retryConnection,
        checkDeviceConnection
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
