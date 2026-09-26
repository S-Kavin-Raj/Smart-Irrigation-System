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
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // 2. Real Telemetry State - Zero mock data
  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]);
  const [trendData, setTrendData] = useState([]);

  // 3. Hardware Pump State: 'ON' | 'OFF' | 'Unknown'
  const [pumpState, setPumpState] = useState('Unknown');
  const [commandStatus, setCommandStatus] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [remainingTime, setRemainingTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 4. Auto condition summary
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

  const timerRef = useRef(null);

  // Heartbeat & Telemetry Poller
  const checkDeviceConnection = useCallback(async () => {
    try {
      // 1. Device status
      const statusRes = await deviceService.getStatus();

      if (statusRes && statusRes.connected === true) {
        setConnectionStatus('CONNECTED');
        setDeviceConnected(true);
        setConnectionError(null);
        setLastSeen(statusRes.lastSeen || new Date().toISOString());
        setDeviceInfo(statusRes);

        // 2. Fetch real pump state first
        let currentMode = statusRes.pumpMode || 'AUTO';
        try {
          const pumpRes = await pumpService.getStatus();
          if (pumpRes) {
            const isPumpOn = pumpRes.running === true || pumpRes.pumpState === 'ON';
            setPumpState(isPumpOn ? 'ON' : 'OFF');
            if (pumpRes.mode) {
              currentMode = pumpRes.mode;
            }
            if (pumpRes.remainingSeconds !== undefined) {
              setRemainingTime(pumpRes.remainingSeconds);
            }
          }
        } catch (pErr) {
          console.warn('Pump status endpoint error:', pErr);
        }

        // 3. Fetch real sensor data
        try {
          const sensors = await sensorService.getSensors();
          if (sensors) {
            setSensorData({
              ...sensors,
              irrigationMode: currentMode
            });
          }
        } catch (sErr) {
          console.warn('Sensors endpoint error:', sErr);
        }

        // 4. Fetch real irrigation history
        try {
          const hist = await irrigationService.getHistory();
          if (Array.isArray(hist)) {
            setHistory(hist);
          }
        } catch (hErr) {
          console.warn('History endpoint error:', hErr);
        }

        // 5. Fetch trends
        try {
          const trends = await sensorService.getTrends();
          if (Array.isArray(trends)) {
            setTrendData(trends);
          }
        } catch (tErr) {
          console.warn('Trends endpoint error:', tErr);
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

    setSensorData(null);
    setPumpState('Unknown');
    setCommandStatus(null);
    setRemainingTime(null);
    setElapsedTime(0);
    setAutoStatus({
      canRun: false,
      reason: 'Device disconnected',
      condition: 'DISCONNECTED'
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Polling loop: every 3 seconds for live telemetry
  useEffect(() => {
    checkDeviceConnection();
    const interval = setInterval(() => {
      checkDeviceConnection();
    }, 3000);

    return () => clearInterval(interval);
  }, [checkDeviceConnection]);

  // Evaluate Auto Condition logic
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
        reason: 'Manual mode - operator control',
        condition: 'MANUAL'
      });
      return;
    }

    if (rainDetected && rainProtection) {
      setAutoStatus({
        canRun: false,
        reason: 'Rain detected - irrigation locked',
        condition: 'RAIN_LOCKED'
      });
    } else if (typeof soilMoisture === 'number' && soilMoisture <= threshold) {
      setAutoStatus({
        canRun: true,
        reason: 'Soil is dry - irrigation required',
        condition: 'SOIL_DRY'
      });
    } else if (typeof soilMoisture === 'number') {
      setAutoStatus({
        canRun: false,
        reason: 'Soil moisture adequate - irrigation not required',
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
  const startManualPump = useCallback(async (duration) => {
    if (!deviceConnected) {
      showToast('Pump control unavailable - device not connected.', 'error', 'Device Disconnected');
      return;
    }

    const targetDuration = duration || selectedDuration;
    setCommandStatus('Starting pump...');

    try {
      await pumpService.start(targetDuration);

      // Poll to confirm physical pump state is ON
      let confirmedOn = false;
      const pollStart = Date.now();

      while (Date.now() - pollStart < 4000) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          const confirmed = await pumpService.getStatus();
          if (confirmed && confirmed.running === true) {
            confirmedOn = true;
            setPumpState('ON');
            setCommandStatus(null);
            const remaining = confirmed.remainingSeconds || targetDuration;
            setRemainingTime(remaining);
            setElapsedTime(0);
            showToast(`Pump ON (${targetDuration}s)`, 'success', 'Relay Engaged');

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
        } catch {}
      }

      if (!confirmedOn) {
        setCommandStatus(null);
        checkDeviceConnection();
      }
    } catch (err) {
      setCommandStatus('Command failed');
      showToast(err.message || 'Failed to send start command to ESP8266.', 'error', 'Command Error');
    }
  }, [deviceConnected, selectedDuration, showToast, checkDeviceConnection]);

  const stopPumpNow = useCallback(async () => {
    if (!deviceConnected) {
      showToast('Pump control unavailable - device not connected.', 'error', 'Device Disconnected');
      return;
    }

    setCommandStatus('Stopping pump...');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await pumpService.stop('manual_stop');

      // Poll to confirm physical OFF state
      let confirmedOff = false;
      const pollStart = Date.now();
      while (Date.now() - pollStart < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          const confirmed = await pumpService.getStatus();
          if (confirmed && confirmed.running === false) {
            confirmedOff = true;
            break;
          }
        } catch {}
      }

      setPumpState('OFF');
      setCommandStatus(null);
      setRemainingTime(0);
      showToast('Pump OFF', 'info', 'Relay Disengaged');
      checkDeviceConnection();
    } catch (err) {
      setCommandStatus('Command failed');
      showToast(err.message || 'Failed to stop pump on ESP8266.', 'error', 'Stop Error');
    }
  }, [deviceConnected, showToast, checkDeviceConnection]);

  const setIrrigationMode = useCallback(async (mode) => {
    if (!deviceConnected) {
      showToast('Mode control unavailable - device not connected.', 'error', 'Device Disconnected');
      return;
    }

    try {
      await pumpService.setMode(mode);
      setSensorData((prev) => prev ? { ...prev, irrigationMode: mode } : null);
      showToast(`Mode set to ${mode} on ESP8266`, 'info', 'Mode Updated');
      checkDeviceConnection();
    } catch (err) {
      showToast(err.message || 'Failed to set mode on device.', 'error', 'Error');
    }
  }, [deviceConnected, showToast, checkDeviceConnection]);

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

  const retryConnection = useCallback(() => {
    setConnectionStatus('CONNECTING');
    showToast('Attempting to reconnect to ESP8266...', 'info', 'Reconnecting');
    checkDeviceConnection();
  }, [showToast, checkDeviceConnection]);

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
        pumpState, // 'ON' | 'OFF' | 'Unknown'
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
