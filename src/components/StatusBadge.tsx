import React from 'react';
import { DocStatus } from '../types.js';

interface StatusBadgeProps {
  status: string;
  type?: 'vehicle' | 'driver' | 'trip' | 'doc';
  label?: string;
  daysRemaining?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'vehicle',
  label,
  daysRemaining,
}) => {
  // Format labels nicely
  const displayLabel =
    label ||
    status
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'vehicle') {
    switch (status) {
      case 'available':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'in_use':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'maintenance':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'inactive':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
        break;
    }
  } else if (type === 'driver') {
    switch (status) {
      case 'available':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'assigned':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'inactive':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
        break;
    }
  } else if (type === 'trip') {
    switch (status) {
      case 'planned':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'in_progress':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'completed':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'cancelled':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }
  } else if (type === 'doc') {
    switch (status) {
      case 'valid':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'expiring_soon':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
        break;
      case 'expired':
        colorClasses = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'available' || status === 'completed' || status === 'valid'
            ? 'bg-emerald-500'
            : status === 'in_use' || status === 'in_progress' || status === 'assigned'
            ? 'bg-blue-500'
            : status === 'maintenance' || status === 'expiring_soon'
            ? 'bg-amber-500'
            : status === 'expired' || status === 'cancelled'
            ? 'bg-rose-500'
            : 'bg-slate-400'
        }`}
      />
      {displayLabel}
      {daysRemaining !== undefined && (
        <span className="opacity-75 font-normal text-[11px]">
          {daysRemaining <= 0 ? `(${Math.abs(daysRemaining)}d ago)` : `(${daysRemaining}d left)`}
        </span>
      )}
    </span>
  );
};

export const PlateBadge: React.FC<{ plate: string }> = ({ plate }) => {
  return (
    <span className="inline-flex items-center rounded border border-slate-300 bg-slate-50 overflow-hidden shadow-xs font-mono text-xs font-bold text-slate-900 tracking-wider">
      <span className="bg-blue-800 text-white px-1.5 py-0.5 text-[10px] flex items-center justify-center font-sans font-bold">
        EU
      </span>
      <span className="px-2 py-0.5 bg-white">{plate}</span>
    </span>
  );
};
