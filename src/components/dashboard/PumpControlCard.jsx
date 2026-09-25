import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useIrrigation } from '../../context/IrrigationContext';
import { formatDuration } from '../../utils/formatters';
import { Play, Square, Timer, Plus, Minus, Zap, ShieldAlert, WifiOff } from 'lucide-react';

export const PumpControlCard = () => {
  const {
    deviceConnected,
    sensorData,
    pumpState,
    commandStatus,
    selectedDuration,
    setSelectedDuration,
    remainingTime,
    elapsedTime,
    startManualPump,
    stopPumpNow,
    setIrrigationMode,
  } = useIrrigation();

  const [confirmModal, setConfirmModal] = useState(false);

  const mode = (deviceConnected && sensorData?.irrigationMode) ? sensorData.irrigationMode : 'MANUAL';
  const isAuto = mode === 'AUTO';
  const isPumpRunning = deviceConnected && pumpState === 'ON';
  const isStarting = commandStatus === 'Starting pump...' || commandStatus?.includes('Command sent');

  const presets = [10, 30, 60, 120, 300];

  const handleStart = () => {
    if (!deviceConnected) return;
    if (selectedDuration >= 300) {
      setConfirmModal(true);
    } else {
      startManualPump(selectedDuration);
    }
  };

  const handleConfirmStart = () => {
    setConfirmModal(false);
    startManualPump(selectedDuration);
  };

  const incrementDuration = () => setSelectedDuration((prev) => Math.min(600, prev + 10));
  const decrementDuration = () => setSelectedDuration((prev) => Math.max(10, prev - 10));

  const progressPercent = (selectedDuration > 0 && remainingTime !== null)
    ? Math.max(0, Math.min(100, ((selectedDuration - remainingTime) / selectedDuration) * 100))
    : 0;

  return (
    <Card className="relative overflow-hidden">
      {/* Top Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-600" />
            Pump Control Center
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Relay (D1) Control for 12V Submersible Irrigation Motor
          </p>
        </div>

        {/* Mode Toggle Pills (Disabled when offline) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            disabled={!deviceConnected}
            onClick={() => setIrrigationMode('AUTO')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !deviceConnected
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : isAuto
                ? 'bg-white text-brand-700 shadow-xs border border-slate-200/60 cursor-pointer'
                : 'text-slate-600 hover:text-slate-900 cursor-pointer'
            }`}
          >
            AUTO MODE
          </button>
          <button
            disabled={!deviceConnected}
            onClick={() => setIrrigationMode('MANUAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !deviceConnected
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : !isAuto
                ? 'bg-white text-brand-700 shadow-xs border border-slate-200/60 cursor-pointer'
                : 'text-slate-600 hover:text-slate-900 cursor-pointer'
            }`}
          >
            MANUAL MODE
          </button>
        </div>
      </div>

      {/* Offline Notice Banner */}
      {!deviceConnected && (
        <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-600 text-xs">
          <WifiOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>
            <strong>Pump control unavailable — device not connected.</strong> Connect the ESP8266 to enable manual or automatic irrigation.
          </span>
        </div>
      )}

      {/* Main Control Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Pump Status & Visualizer */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-white rounded-xl p-5 border border-slate-200/80 flex flex-col items-center justify-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            {isPumpRunning && (
              <div className="absolute w-28 h-28 rounded-full bg-brand-400/20 animate-water-ripple" />
            )}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                !deviceConnected
                  ? 'bg-slate-100 text-slate-300'
                  : isPumpRunning
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Zap className={`w-9 h-9 ${isPumpRunning ? 'animate-bounce' : ''}`} />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Hardware Relay State
            </span>
            <div className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <span>
                {!deviceConnected
                  ? 'ESP OFFLINE'
                  : isPumpRunning
                  ? 'PUMP IS RUNNING'
                  : 'PUMP IS OFF'}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  !deviceConnected
                    ? 'bg-rose-400'
                    : isPumpRunning
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
            </div>
            {commandStatus && (
              <p className="text-xs font-medium text-brand-600 pt-1">{commandStatus}</p>
            )}
          </div>

          {/* Real-time Countdown Banner (Shown ONLY when confirmed running) */}
          {isPumpRunning && remainingTime !== null && (
            <div className="mt-4 w-full bg-brand-50 border border-brand-200 rounded-xl p-3 text-brand-900">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Remaining: {formatDuration(remainingTime)}</span>
                <span>Elapsed: {formatDuration(elapsedTime)}</span>
              </div>
              <div className="w-full bg-brand-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Duration Configuration & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-slate-400" />
                Manual Irrigation Duration
              </label>
              <span className="text-xs font-medium text-slate-500">
                Max 600s (10 min)
              </span>
            </div>

            {/* Stepper + Input */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrementDuration}
                disabled={!deviceConnected || isPumpRunning || isStarting || selectedDuration <= 10}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg border border-slate-200 disabled:opacity-40 transition cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl h-11 px-4">
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {selectedDuration}
                </span>
                <span className="text-xs font-medium text-slate-500 ml-2">seconds</span>
                <span className="text-xs text-slate-400 ml-1">({formatDuration(selectedDuration)})</span>
              </div>

              <button
                type="button"
                onClick={incrementDuration}
                disabled={!deviceConnected || isPumpRunning || isStarting || selectedDuration >= 600}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg border border-slate-200 disabled:opacity-40 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedDuration(preset)}
                  disabled={!deviceConnected || isPumpRunning || isStarting}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    !deviceConnected
                      ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                      : selectedDuration === preset
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset} sec {preset >= 60 ? `(${preset / 60}m)` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: START and STOP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              disabled={!deviceConnected || isPumpRunning || isStarting}
              loading={isStarting}
              icon={Play}
              className="w-full shadow-md shadow-brand-600/20"
            >
              {isStarting ? 'Starting pump...' : 'START PUMP'}
            </Button>

            <Button
              variant="danger"
              size="lg"
              onClick={stopPumpNow}
              disabled={!deviceConnected || (!isPumpRunning && !isStarting)}
              icon={Square}
              className="w-full shadow-md shadow-rose-600/20"
            >
              STOP NOW
            </Button>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Confirm Extended Irrigation</h4>
                <p className="text-sm text-slate-600 mt-1">
                  You are about to run the pump for{' '}
                  <strong className="text-slate-900">{formatDuration(selectedDuration)}</strong>.
                  Please ensure your water reservoir is filled and soil drainage is sufficient.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmStart}>
                Confirm & Start Pump
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
