import React, { useRef } from 'react';
import { AudioTrack } from '../types/audio';
import { Music, Upload, X, Play, CheckCircle2, FileAudio } from 'lucide-react';

interface TrackLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: AudioTrack[];
  currentTrackId?: string;
  onSelectTrack: (track: AudioTrack) => void;
  onUploadLocalFiles: (files: FileList) => void;
}

export const TrackLibraryModal: React.FC<TrackLibraryModalProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrackId,
  onSelectTrack,
  onUploadLocalFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadLocalFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadLocalFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Music Library &amp; Offline Tracks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {/* File Upload Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-950/60 p-6 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group text-center"
          >
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click or Drag &amp; Drop Local Audio Files
              </p>
              <p className="text-xs text-slate-400">Supports MP3, FLAC, WAV, AAC, OGG from device storage</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Track List */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Available Tracks ({tracks.length})
            </h3>

            <div className="flex flex-col gap-1.5">
              {tracks.map((t) => {
                const isSelected = t.id === currentTrackId;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTrack(t);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <FileAudio className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{t.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {t.artist} · {t.album} {t.isDemo ? '(Offline Synth)' : ''}
                        </div>
                      </div>
                    </div>

                    <button className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors shrink-0">
                      <Play className="w-4 h-4 fill-current" />
                    </button>
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
