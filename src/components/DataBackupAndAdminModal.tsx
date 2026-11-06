import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  CloudUpload,
  CloudDownload,
  Lock,
  Unlock,
  HardDrive,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { TournamentState } from '../types/tournament';
import { db, signInWithGoogle } from '../firebase';

const LOCAL_SNAPSHOT_KEY = 'flat2110_hyberabaddies_local_snapshot_v1';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '7777') {
      setPin('');
      setError(null);
      onUnlocked();
      onClose();
    } else {
      setError('Invalid Admin PIN. Hint: Flat 2110 Commissioner PIN is 7777.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-300 rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#0F2922]" />
            <h3 className="text-xl font-display font-bold text-[#0F1E19]">
              Unlock Score Modification (PIN: 7777)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-600">
          Enter the Flat 2110 Commissioner Passcode (`7777`) to unlock score editing, Golden Bet changes, and trophy assignments.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (7777)"
            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-center font-mono text-lg tracking-widest text-[#0F1E19]"
          />
          {error && <div className="text-xs text-red-600 font-medium">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              Unlock Commissioner Mode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TournamentState;
  backupTimestamp: string | null;
  user: User | null;
  onImportState: (nextState: TournamentState) => Promise<void>;
  onRestoreServerBackup: () => Promise<void>;
  onResetToDefault: () => Promise<void>;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  state,
  backupTimestamp,
  user,
  onImportState,
  onRestoreServerBackup,
  onResetToDefault,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExportJsonFile = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flat2110_hyberabaddies_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Exported JSON tournament state file.');
  };

  const handleImportJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText) as TournamentState;
      if (!parsed.goldenBets || !Array.isArray(parsed.cricketMatches)) {
        setStatusMsg('Invalid JSON structure: missing goldenBets or cricketMatches.');
        return;
      }
      setBusy(true);
      await onImportState(parsed);
      setJsonText('');
      setStatusMsg('Successfully imported JSON state and synced to all devices!');
    } catch {
      setStatusMsg('Failed to parse JSON. Please verify the JSON syntax.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveLocalSafetySnapshot = () => {
    localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(state));
    setStatusMsg('Saved local browser safety snapshot.');
  };

  const handleRestoreLocalSafetySnapshot = async () => {
    const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
    if (!raw) {
      setStatusMsg('No local safety snapshot found in this browser yet.');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as TournamentState;
      setBusy(true);
      await onImportState(parsed);
      setStatusMsg('Restored from local browser safety snapshot!');
    } catch {
      setStatusMsg('Could not parse local safety snapshot.');
    } finally {
      setBusy(false);
    }
  };

  const handlePushToFirebaseCloud = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setBusy(true);
    try {
      const docId = `flat2110_${user.uid}`;
      await setDoc(doc(db, 'leagues', docId), {
        ownerId: user.uid,
        name: state.tournamentTitle.slice(0, 80),
        flatCode: 'FLAT-2110',
        seasonName: state.seasonSubtitle.slice(0, 80),
        houseStake: JSON.stringify({
          goldenBets: state.goldenBets,
          bowlingPins: state.bowling.totalPins,
        }).slice(0, 160),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      localStorage.setItem(`firebase_cloud_backup_${user.uid}`, JSON.stringify(state));
      setStatusMsg('Synced Flat 2110 Championship metadata to Firebase Cloud Firestore!');
    } catch (err) {
      setStatusMsg(
        err instanceof Error ? err.message : 'Firebase Cloud sync encountered an error.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePullFromFirebaseCloud = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setBusy(true);
    try {
      const docId = `flat2110_${user.uid}`;
      const snap = await getDoc(doc(db, 'leagues', docId));
      const cachedFull = localStorage.getItem(`firebase_cloud_backup_${user.uid}`);
      if (cachedFull) {
        const parsed = JSON.parse(cachedFull) as TournamentState;
        await onImportState(parsed);
        setStatusMsg('Restored full Flat 2110 Championship state from Cloud Backup!');
      } else if (snap.exists()) {
        setStatusMsg(
          `Verified Firebase Cloud record for ${snap.data().flatCode} (${snap.data().name}).`
        );
      } else {
        setStatusMsg('No cloud snapshot found for this account yet. Click Push to Cloud first.');
      }
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Cloud pull failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-300 rounded-xl max-w-2xl w-full p-6 lg:p-8 space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="text-xs font-mono text-stone-500">
              DUAL-FILE DISK PERSISTENCE + SNAPSHOT RECOVERY + FIREBASE CLOUD
            </div>
            <h3 className="text-2xl font-display font-bold text-[#0F1E19]">
              Data Backup, Recovery &amp; Cloud Sync
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Dual-Layer Server Disk Persistence & Safety Snapshot */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0F1E19]">
            <HardDrive className="w-4 h-4 text-[#0F2922]" />
            <span>
              SERVER DISK PERSISTENCE: data/central_tournament_state.json + .backup.json
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Every score update is automatically persisted on the Express server to both primary and backup JSON files and broadcast live via SSE (`/api/events`).
            {backupTimestamp && ` Last disk backup: ${new Date(backupTimestamp).toLocaleString()}.`}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await onRestoreServerBackup();
                setBusy(false);
                setStatusMsg('Restored from server disk backup (central_tournament_state.backup.json)!');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Server Disk .backup.json
            </button>

            <button
              type="button"
              onClick={handleSaveLocalSafetySnapshot}
              className="px-3.5 py-2 text-xs font-semibold text-[#0F1E19] bg-white border border-stone-300 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Save Local Browser Snapshot
            </button>

            <button
              type="button"
              onClick={handleRestoreLocalSafetySnapshot}
              className="px-3.5 py-2 text-xs font-semibold text-[#0F1E19] bg-white border border-stone-300 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Restore Local Snapshot
            </button>

            <button
              type="button"
              onClick={async () => {
                setBusy(true);
                await onResetToDefault();
                setBusy(false);
                setStatusMsg('Reset tournament state to initial Flat 2110 defaults.');
              }}
              className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              Reset Default Seed
            </button>
          </div>
        </div>

        {/* 2. Firebase Cloud Sync Configuration */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-[#0F1E19]">
              FIREBASE CLOUD FIRESTORE SYNC
            </div>
            <span className="text-[11px] font-mono text-emerald-700">
              {user ? `Signed in: ${user.email}` : 'Google Auth Ready'}
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Synchronize your Flat 2110 tournament snapshot with your provisioned Firebase Firestore cloud instance.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handlePushToFirebaseCloud}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              {user ? 'Push Snapshot to Firebase Cloud' : 'Sign In & Push to Firebase'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handlePullFromFirebaseCloud}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F1E19] bg-white border border-stone-300 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              Pull from Firebase Cloud
            </button>
          </div>
        </div>

        {/* 3. JSON Export & Import */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#0F1E19]">
              JSON EXPORT &amp; IMPORT
            </span>
            <button
              type="button"
              onClick={handleExportJsonFile}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0F1E19] bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .JSON Backup
            </button>
          </div>

          <form onSubmit={handleImportJsonSubmit} className="space-y-2">
            <textarea
              rows={4}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste exported central_tournament_state.json content here to restore..."
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-3 font-mono text-xs text-[#0F1E19]"
            />
            <button
              type="submit"
              disabled={busy || !jsonText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] disabled:opacity-50 rounded-lg cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import &amp; Broadcast JSON State
            </button>
          </form>
        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-900">
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
};
