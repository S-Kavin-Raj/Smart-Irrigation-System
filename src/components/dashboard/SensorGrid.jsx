import React from 'react';
import { SensorCard } from './SensorCard';
import { Droplets, Thermometer, CloudRain, Wind, Power, Cpu } from 'lucide-react';
import { useIrrigation } from '../../context/IrrigationContext';
import { getMoistureStatus, formatDuration } from '../../utils/formatters';

export const SensorGrid = () => {
  const { sensorData, deviceConnected, pumpState, remainingTime, elapsedTime } = useIrrigation();

  const isConnected = deviceConnected;

  const soilMoistureVal = (isConnected && sensorData?.soilMoisture !== undefined && sensorData?.soilMoisture !== null)
    ? sensorData.soilMoisture
    : '--';

  const temperatureVal = (isConnected && sensorData?.temperature !== undefined && sensorData?.temperature !== null)
    ? sensorData.temperature
    : '--';

  const humidityVal = (isConnected && sensorData?.humidity !== undefined && sensorData?.humidity !== null)
    ? sensorData.humidity
    : '--';

  const rainVal = (isConnected && sensorData?.rainDetected !== undefined)
    ? (sensorData.rainDetected ? 'Detected' : 'Not Detected')
    : '--';

  const pumpStatusVal = isConnected
    ? (pumpState === 'ON' ? 'ON' : 'OFF')
    : '--';

  const irrigationModeVal = (isConnected && sensorData?.irrigationMode)
    ? sensorData.irrigationMode
    : '--';

  const moistureStatus = (isConnected && typeof soilMoistureVal === 'number')
    ? getMoistureStatus(soilMoistureVal)
    : null;

  const rainStatus = (isConnected && sensorData?.rainDetected !== undefined)
    ? (sensorData.rainDetected ? 'Rain Active' : 'Clear Sky')
    : null;

  const isPumpOn = isConnected && pumpState === 'ON';

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
          isConnected && typeof soilMoistureVal === 'number' ? (
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-500 ${
                  moistureStatus === 'Dry' ? 'bg-amber-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, soilMoistureVal))}%` }}
              />
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">Sensor offline - no telemetry</span>
          )
        }
      />

      {/* 2. Temperature */}
      <SensorCard
        title="Temperature"
        subtitle="DHT11 Sensor (D4)"
        value={temperatureVal}
        unit={typeof temperatureVal === 'number' ? '°C' : ''}
        status={isConnected && typeof temperatureVal === 'number' ? `${(temperatureVal * 1.8 + 32).toFixed(1)}°F` : null}
        icon={Thermometer}
        variant="amber"
        footer={
          <span className="text-[11px] text-slate-400">
            {isConnected ? 'Ambient field temperature' : 'Sensor offline - no telemetry'}
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
          isConnected && typeof humidityVal === 'number'
            ? (humidityVal > 70 ? 'High' : humidityVal < 40 ? 'Low' : 'Optimal')
            : null
        }
        icon={Wind}
        variant="indigo"
        footer={
          <span className="text-[11px] text-slate-400">
            {isConnected ? 'Relative atmospheric moisture' : 'Sensor offline - no telemetry'}
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
        variant={sensorData?.rainDetected ? 'blue' : 'emerald'}
        footer={
          <span className="text-[11px] text-slate-400">
            {isConnected
              ? (sensorData?.rainDetected ? 'Rain protection active' : 'Clear weather conditions')
              : 'Sensor offline - no telemetry'}
          </span>
        }
      />

      {/* 5. Pump Status */}
      <SensorCard
        title="Pump Status"
        subtitle="Relay D1"
        value={pumpStatusVal}
        status={isConnected ? (isPumpOn ? 'Active' : 'Standby') : 'Disconnected'}
        icon={Power}
        variant={isPumpOn ? 'emerald' : 'blue'}
        active={isPumpOn}
        footer={
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">
              {isConnected
                ? (isPumpOn ? `Relay D1 • Running (${formatDuration(elapsedTime)})` : 'Relay D1 • Standby')
                : 'ESP Offline'}
            </span>
            {isPumpOn && (
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
        status={isConnected ? (irrigationModeVal === 'AUTO' ? 'Autonomous' : 'Manual') : null}
        icon={Cpu}
        variant="blue"
        footer={
          <span className="text-[11px] text-slate-400">
            {isConnected
              ? (irrigationModeVal === 'AUTO' ? 'Autonomous threshold policy' : 'Operator controlled duration')
              : 'ESP Offline'}
          </span>
        }
      />
    </div>
  );
};
