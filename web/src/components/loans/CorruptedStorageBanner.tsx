/**
 * Dhanya Corrupted Storage Banner Component
 * Application: web
 * Displays a recovery alert when browser local storage is corrupted or reset.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface CorruptedStorageBannerProps {
  onResetToDefault: () => void;
  onDismiss: () => void;
}

export const CorruptedStorageBanner: React.FC<CorruptedStorageBannerProps> = ({
  onResetToDefault,
  onDismiss,
}) => {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-950 block">Local Storage Anomaly Detected</strong>
          <span className="text-amber-800 text-[11px] leading-relaxed">
            One or more stored debt liability entries contained corrupted parameters. Safe fallbacks were applied automatically to protect your calculations.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={onResetToDefault}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restore Sample Data</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
