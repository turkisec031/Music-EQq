import React, { useState } from 'react';
import { EQPreset } from '../types/audio';
import { BookmarkPlus, Download, Upload, Trash2, X, Check, Copy } from 'lucide-react';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: EQPreset[];
  activePresetId: string;
  onSelectPreset: (p: EQPreset) => void;
  onSaveCurrentAsPreset: (name: string) => void;
  onDeleteUserPreset: (id: string) => void;
  onImportPresetsJson: (jsonStr: string) => boolean;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  activePresetId,
  onSelectPreset,
  onSaveCurrentAsPreset,
  onDeleteUserPreset,
  onImportPresetsJson,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveCurrentAsPreset(newPresetName.trim());
    setNewPresetName('');
  };

  const handleExportJSON = () => {
    const userPresets = presets.filter((p) => p.category === 'user');
    const dataStr = JSON.stringify(userPresets, null, 2);
    navigator.clipboard.writeText(dataStr);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const handleImportSubmit = () => {
    if (onImportPresetsJson(importJsonText)) {
      setImportJsonText('');
      setShowImportArea(false);
    } else {
      alert('Invalid preset JSON format!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-bold text-white">Custom EQ Presets Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-5">
          {/* Save Current EQ Curve as Preset */}
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Custom Preset Name..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 transition-opacity shrink-0"
            >
              Save Current Curve
            </button>
          </form>

          {/* Preset List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Preset Profiles</span>
              <div className="flex gap-2">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                >
                  {copiedStatus ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedStatus ? 'Copied!' : 'Export JSON'}</span>
                </button>
                <button
                  onClick={() => setShowImportArea(!showImportArea)}
                  className="flex items-center gap-1 text-[10px] text-pink-400 hover:underline"
                >
                  <Upload className="w-3 h-3" />
                  <span>Import</span>
                </button>
              </div>
            </div>

            {/* Import Text Area */}
            {showImportArea && (
              <div className="flex flex-col gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <textarea
                  rows={3}
                  placeholder="Paste JSON preset data here..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={handleImportSubmit}
                  className="self-end px-3 py-1.5 bg-pink-600 text-white font-bold text-xs rounded-lg hover:bg-pink-500"
                >
                  Confirm Import
                </button>
              </div>
            )}

            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
              {presets.map((p) => {
                const isActive = p.id === activePresetId;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPreset(p);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-pink-950/60 border-pink-500/60 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.category.toUpperCase()} · {p.mode}
                      </div>
                    </div>

                    {p.category === 'user' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUserPreset(p.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete Preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
