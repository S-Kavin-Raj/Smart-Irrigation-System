import React from 'react';
import { SensorCard } from './SensorCard';
import { Droplets, Thermometer, CloudRain, Wind, Power, Cpu } from 'lucide-react';
import { useIrrigation } from '../../context/IrrigationContext';
import { getMoistureStatus, formatDuration } from '../../utils/formatters';

export const SensorGrid = () => {
  const { sensorData, deviceConnected, pumpState, remainingTime, elapsedTime } = useIrrigation();

  // If device is not connected or sensorData is null, values MUST be "--"
  const soilMoistureVal = (deviceConnected && sensorData?.soilMoisture !== undefined)
    ? sensorData.soilMoisture
    : '--';

  const temperatureVal = (deviceConnected && sensorData?.temperature !== undefined)
    ? sensorData.temperature
    : '--';

  const humidityVal = (deviceConnected && sensorData?.humidity !== undefined)
    ? sensorData.humidity
    : '--';

  const rainVal = (deviceConnected && sensorData?.rainDetected !== undefined)
    ? (sensorData.rainDetected ? 'Rain Detected' : 'No Rain')
    : '--';

  const pumpStatusVal = deviceConnected
    ? pumpState
    : '--';

  const irrigationModeVal = (deviceConnected && sensorData?.irrigationMode)
    ? sensorData.irrigationMode
    : '--';

  // Status badges only when connected
  const moistureStatus = (deviceConnected && typeof soilMoistureVal === 'number')
    ? getMoistureStatus(soilMoistureVal)
    : null;

  const rainStatus = (deviceConnected && sensorData?.rainDetected !== undefined)
    ? (sensorData.rainDetected ? 'Rain Active' : 'Clear Sky')
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
      {/* 1. Soil Moisture */}
      <SensorCard
        title="Soil Moisture"
        subtitle="Capacitive (CD74HC4067 MUX)"
        value={soilMoistureVal}
        unit={typeof soilMoistureVal === 'number' ? '%' : ''}
        status={moistureStatus}
        icon={Droplets}
        variant="blue"
        footer={
          deviceConnected && typeof soilMoistureVal === 'number' ? (
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-500 ${
                  moistureStatus === 'Dry' ? 'bg-amber-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, soilMoistureVal))}%` }}
              />
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">Sensor offline — no telemetry</span>
          )
        }
      />

      {/* 2. Temperature */}
      <SensorCard
        title="Temperature"
        subtitle="DHT11 Sensor (D4)"
        value={temperatureVal}
        unit={typeof temperatureVal === 'number' ? '°C' : ''}
        status={deviceConnected && typeof temperatureVal === 'number' ? `${(temperatureVal * 1.8 + 32).toFixed(1)}°F` : null}
        icon={Thermometer}
        variant="amber"
        footer={
          <span className="text-[11px] text-slate-400">
            {deviceConnected ? 'Ambient field temperature' : 'Sensor offline — no telemetry'}
          </span>
        }
      />

      {/* 3. Humidity */}
      <SensorCard
        title="Humidity"
        subtitle="DHT11 Sensor (D4)"
        value={humidityVal}
        unit={typeof humidityVal === 'number' ? '%' : ''}
        status={
          deviceConnected && typeof humidityVal === 'number'
            ? (humidityVal > 70 ? 'High' : humidityVal < 40 ? 'Low' : 'Optimal')
            : null
        }
        icon={Wind}
        variant="indigo"
        footer={
          <span className="text-[11px] text-slate-400">
            {deviceConnected ? 'Relative atmospheric moisture' : 'Sensor offline — no telemetry'}
          </span>
        }
      />

      {/* 4. Rain Detection */}
      <SensorCard
        title="Rain Detection"
        subtitle="FC-37 Rain (CD74HC4067 MUX)"
        value={rainVal}
        status={rainStatus}
        icon={CloudRain}
        variant={rainVal === 'Rain Detected' ? 'blue' : 'emerald'}
        footer={
          <span className="text-[11px] text-slate-400">
            {deviceConnected
              ? (sensorData?.rainDetected ? 'Rain protection active' : 'Clear weather conditions')
              : 'Sensor offline — no telemetry'}
          </span>
        }
      />

      {/* 5. Pump Status */}
      <SensorCard
        title="Pump Status"
        subtitle="12V Submersible (Relay D1)"
        value={pumpStatusVal}
        status={deviceConnected ? (pumpState === 'ON' ? 'Active Relay' : 'Standby') : 'Disconnected'}
        icon={Power}
        variant={pumpState === 'ON' ? 'emerald' : 'blue'}
        active={pumpState === 'ON'}
        footer={
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              {deviceConnected
                ? (pumpState === 'ON' ? `Running: ${formatDuration(elapsedTime)}` : 'Relay Standby (Low)')
                : 'Relay state unknown'}
            </span>
            {pumpState === 'ON' && (
              <span className="text-brand-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                Live
              </span>
            )}
          </div>
        }
      />

      {/* 6. Irrigation Mode */}
      <SensorCard
        title="Irrigation Mode"
        subtitle="System Control Policy"
        value={irrigationModeVal}
        status={deviceConnected ? (irrigationModeVal === 'AUTO' ? 'Autonomous' : 'Manual') : null}
        icon={Cpu}
        variant="blue"
        footer={
          <span className="text-[11px] text-slate-400">
            {deviceConnected
              ? (irrigationModeVal === 'AUTO' ? 'Autonomous threshold policy' : 'Operator controlled duration')
              : 'Connect ESP8266 to configure'}
          </span>
        }
      />
    </div>
  );
};
