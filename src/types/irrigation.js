// Type constants and schemas for the Smart Irrigation System

export const PumpState = {
  OFF: 'OFF',
  STARTING: 'STARTING',
  ON: 'ON',
  STOPPING: 'STOPPING',
  ERROR: 'ERROR'
};

export const IrrigationMode = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL'
};

export const MoistureStatus = {
  DRY: 'Dry',
  NORMAL: 'Normal',
  WET: 'Wet'
};

export const RainStatus = {
  DETECTED: 'Rain Detected',
  NO_RAIN: 'No Rain'
};

export const DeviceStatus = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  SYNCING: 'Syncing'
};
