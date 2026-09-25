import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { useIrrigation } from '../../context/IrrigationContext';
import { Bot, CheckCircle, XCircle, AlertTriangle, Play, WifiOff } from 'lucide-react';

export const AutoModeStatusCard = () => {
  const { deviceConnected, sensorData, autoStatus, pumpState } = useIrrigation();

  const isAuto = deviceConnected && sensorData?.irrigationMode === 'AUTO';
  const dryThreshold = sensorData?.settings?.soilDrynessThreshold ?? 35;
  const soilMoisture = sensorData?.soilMoisture;
  const isSoilDry = typeof soilMoisture === 'number' && soilMoisture <= dryThreshold;
  const rainDetected = sensorData?.rainDetected;

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Auto Irrigation Condition Logic</h3>
              <p className="text-[11px] text-slate-500">Autonomous ESP8266 Sensor Policy</p>
            </div>
          </div>
          <StatusBadge
            status={
              !deviceConnected
                ? 'Device Offline'
                : isAuto
                ? 'AUTO Active'
                : 'MANUAL Active'
            }
            variant={!deviceConnected ? 'red' : isAuto ? 'green' : 'blue'}
            size="sm"
          />
        </div>

        {!deviceConnected ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <WifiOff className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">{autoStatus?.reason || 'Device disconnected'}</p>
            <p className="text-[11px] text-slate-500 leading-normal">
              Connect the ESP8266 NodeMCU to stream real-time soil moisture and rain sensor readings.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">1. Soil Moisture:</span>
                <span className="text-slate-600">
                  {soilMoisture !== undefined ? `${soilMoisture}%` : '--'} (Threshold: &le; {dryThreshold}%)
                </span>
              </div>
              {isSoilDry ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Dry (Trigger)
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-400" /> Adequate
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">2. Rain Sensor:</span>
                <span className="text-slate-600">{rainDetected ? 'Rain Detected' : 'No Rain'}</span>
              </div>
              {!rainDetected ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Permitted
                </span>
              ) : (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" /> Blocked
                </span>
              )}
            </div>

            {/* Condition Result Message */}
            {autoStatus && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  autoStatus.canRun
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : autoStatus.condition === 'RAIN_LOCKED'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                  {autoStatus.canRun ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Auto-Watering Permitted
                    </>
                  ) : autoStatus.condition === 'RAIN_LOCKED' ? (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Rain Protection Lockout
                    </>
                  ) : autoStatus.condition === 'MANUAL' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-brand-600" />
                      Manual Control Active
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Pump Should Remain OFF
                    </>
                  )}
                </div>
                <p className="text-slate-700 font-medium">{autoStatus.reason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Max Auto Runtime: {sensorData?.settings?.maxAutoRuntimeSeconds ? `${sensorData.settings.maxAutoRuntimeSeconds}s` : '--'}
        </span>
      </div>
    </Card>
  );
};
