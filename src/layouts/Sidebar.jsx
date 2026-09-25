import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Cpu, Droplets, Wifi, WifiOff } from 'lucide-react';
import { useIrrigation } from '../context/IrrigationContext';
import { getApiBaseUrl } from '../services/api';

export const Sidebar = ({ isOpen, onClose }) => {
  const { deviceConnected, connectionStatus, pumpState } = useIrrigation();
  const currentEndpoint = getApiBaseUrl();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/history', label: 'Irrigation History', icon: History },
    { to: '/sensors', label: 'Sensors & Charts', icon: Cpu },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Droplets className="w-6 h-6 animate-pulse-subtle" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block">AquaFlow</span>
            <span className="text-[11px] font-medium text-brand-600 block uppercase tracking-wider">ESP8266 IoT Controller</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs border border-brand-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {item.to === '/' && deviceConnected && pumpState === 'ON' && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 animate-pulse">
                    ACTIVE
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ESP8266 Device Status Card in Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                {deviceConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                )}
                ESP8266
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : connectionStatus === 'CONNECTING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {connectionStatus === 'CONNECTED'
                  ? 'Connected'
                  : connectionStatus === 'CONNECTING'
                  ? 'Connecting...'
                  : 'Disconnected'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between items-center">
              <span>Endpoint:</span>
              <span className="font-mono text-slate-700 truncate max-w-[120px]" title={currentEndpoint}>
                {currentEndpoint.replace('http://', '')}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between items-center mt-1">
              <span>Relay:</span>
              <span className="font-medium text-slate-700">
                {deviceConnected ? (pumpState === 'ON' ? 'Active 12V' : 'Standby') : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
