import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  TournamentState,
  createInitialTournamentState,
  computeTournamentSummary,
  SPORTS_DEFINITIONS,
} from './src/types/tournament.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const PRIMARY_STATE_FILE = path.join(DATA_DIR, 'central_tournament_state.json');
const BACKUP_STATE_FILE = path.join(DATA_DIR, 'central_tournament_state.backup.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadTournamentStateFromDisk(): TournamentState {
  ensureDataDirectory();

  // 1. Try Primary File
  if (fs.existsSync(PRIMARY_STATE_FILE)) {
    try {
      const raw = fs.readFileSync(PRIMARY_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as TournamentState;
      if (parsed && parsed.goldenBets && Array.isArray(parsed.cricketMatches)) {
        return parsed;
      }
    } catch (err) {
      console.error('Primary state file corrupted, attempting backup recovery:', err);
    }
  }

  // 2. Try Backup File
  if (fs.existsSync(BACKUP_STATE_FILE)) {
    try {
      const rawBackup = fs.readFileSync(BACKUP_STATE_FILE, 'utf-8');
      const parsedBackup = JSON.parse(rawBackup) as TournamentState;
      if (parsedBackup && parsedBackup.goldenBets && Array.isArray(parsedBackup.cricketMatches)) {
        fs.writeFileSync(PRIMARY_STATE_FILE, JSON.stringify(parsedBackup, null, 2), 'utf-8');
        return parsedBackup;
      }
    } catch (err) {
      console.error('Backup state file also unreadable, initializing fresh Flat 2110 state:', err);
    }
  }

  // 3. Initialize Default Flat 2110 State to both Primary & Backup
  const initial = createInitialTournamentState();
  saveTournamentStateToDisk(initial, true);
  return initial;
}

function saveTournamentStateToDisk(nextState: TournamentState, isInitial = false): void {
  ensureDataDirectory();

  // Copy existing valid primary state to backup before overwriting
  if (!isInitial && fs.existsSync(PRIMARY_STATE_FILE)) {
    try {
      fs.copyFileSync(PRIMARY_STATE_FILE, BACKUP_STATE_FILE);
    } catch (err) {
      console.error('Failed copying primary to backup:', err);
    }
  }

  const serialized = JSON.stringify(nextState, null, 2);
  fs.writeFileSync(PRIMARY_STATE_FILE, serialized, 'utf-8');

  if (isInitial || !fs.existsSync(BACKUP_STATE_FILE)) {
    fs.writeFileSync(BACKUP_STATE_FILE, serialized, 'utf-8');
  }
}

let tournamentState: TournamentState = loadTournamentStateFromDisk();

// Connected SSE Clients for Multi-Device Real-Time Sync
interface SseClient {
  id: string;
  res: Response;
}
const sseClients = new Map<string, SseClient>();

function broadcastSseUpdate(eventType: 'init' | 'update' = 'update') {
  const payload = JSON.stringify({
    type: eventType,
    state: tournamentState,
    connectedClients: sseClients.size,
    timestamp: new Date().toISOString(),
  });

  for (const [id, client] of sseClients.entries()) {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(id);
    }
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildStandingsGroundingText(state: TournamentState): string {
  const summary = computeTournamentSummary(state);
  const lines = summary.standings.map(
    (s, idx) =>
      `#${idx + 1} ${s.profile.fullTitle}: ${s.totalPoints} Total Pts (Base ${s.basePoints} + Golden 2x Bonus ${s.goldenBonusPoints}), W-D-L: ${s.wins}-${s.draws}-${s.losses}, Normalized Diff (W-L): ${s.normalizedDiff >= 0 ? '+' : ''}${s.normalizedDiff}, Golden Bet: ${SPORTS_DEFINITIONS[s.goldenSport].name} (${s.goldenBetWon ? 'CASHED 2X' : 'Pending/Trailing'}), Cricket SR: ${s.cricketStats.strikeRate}`
  );
  const recentExcuses = state.excuses
    .slice(0, 3)
    .map((e) => `${e.playerId.toUpperCase()} (${e.thartharLevel}% Thartharometer): "${e.quote}"`)
    .join(' | ');

  return `Flat 2110 Standings:\n${lines.join('\n')}\nRecent Excuses: ${recentExcuses}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // 1. SSE Endpoint for Multi-Device Real-Time Sync
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sseClients.set(clientId, { id: clientId, res });

    // Send initial full state immediately
    const initPayload = JSON.stringify({
      type: 'init',
      state: tournamentState,
      connectedClients: sseClients.size,
      timestamp: new Date().toISOString(),
    });
    res.write(`data: ${initPayload}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
    });
  });

  // 2. GET Tournament Data & Disk Persistence Status
  app.get('/api/tournament-data', (_req: Request, res: Response) => {
    let backupTimestamp: string | null = null;
    if (fs.existsSync(BACKUP_STATE_FILE)) {
      try {
        const stat = fs.statSync(BACKUP_STATE_FILE);
        backupTimestamp = stat.mtime.toISOString();
      } catch {
        backupTimestamp = null;
      }
    }

    res.json({
      state: tournamentState,
      backupAvailable: fs.existsSync(BACKUP_STATE_FILE),
      backupTimestamp,
      connectedClients: sseClients.size,
    });
  });

  // 3. POST Tournament Data (Saves to Primary + Backup JSON & Broadcasts via SSE)
  app.post('/api/tournament-data', (req: Request, res: Response) => {
    const incoming: TournamentState = req.body?.state ? req.body.state : req.body;
    if (!incoming || !incoming.goldenBets || !Array.isArray(incoming.cricketMatches)) {
      res.status(400).json({ error: 'Invalid tournament state payload.' });
      return;
    }

    tournamentState = {
      ...incoming,
      version: (tournamentState.version || 1) + 1,
      lastUpdated: new Date().toISOString(),
    };

    saveTournamentStateToDisk(tournamentState, false);
    broadcastSseUpdate('update');

    res.json({
      ok: true,
      state: tournamentState,
      connectedClients: sseClients.size,
    });
  });

  // 4. POST Restore from Disk Backup (`data/central_tournament_state.backup.json`)
  app.post('/api/tournament-data/restore-backup', (_req: Request, res: Response) => {
    if (!fs.existsSync(BACKUP_STATE_FILE)) {
      res.status(404).json({ error: 'No backup file found on disk.' });
      return;
    }
    try {
      const raw = fs.readFileSync(BACKUP_STATE_FILE, 'utf-8');
      const restored = JSON.parse(raw) as TournamentState;
      tournamentState = {
        ...restored,
        version: (tournamentState.version || 1) + 1,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(PRIMARY_STATE_FILE, JSON.stringify(tournamentState, null, 2), 'utf-8');
      broadcastSseUpdate('update');
      res.json({ ok: true, state: tournamentState });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to restore backup file.',
      });
    }
  });

  // 5. POST Reset to Default Flat 2110 Seed State
  app.post('/api/tournament-data/reset', (_req: Request, res: Response) => {
    const fresh = createInitialTournamentState();
    tournamentState = {
      ...fresh,
      version: (tournamentState.version || 1) + 1,
      lastUpdated: new Date().toISOString(),
    };
    saveTournamentStateToDisk(tournamentState, false);
    broadcastSseUpdate('update');
    res.json({ ok: true, state: tournamentState });
  });

  // 6. POST /api/gemini/sheru-quip — Sheru the Tiger Mascot Quip with Tournament Grounding
  app.post('/api/gemini/sheru-quip', async (_req: Request, res: Response) => {
    const grounding = buildStandingsGroundingText(tournamentState);
    const summary = computeTournamentSummary(tournamentState);
    const leader = summary.standings[0];
    const lastPlace = summary.standings[summary.standings.length - 1];

    const fallbackQuips = [
      `ROAR! ${leader.profile.fullTitle} is ruling Flat 2110 with ${leader.totalPoints} points (${leader.normalizedDiff >= 0 ? '+' : ''}${leader.normalizedDiff} diff), while ${lastPlace.profile.fullTitle} is trembling at the bottom waiting for Bai's jhadu!`,
      `Grrr! Addy's Double ACL has more stability than ${lastPlace.profile.name}'s title hopes right now! Meanwhile Mia the Beagle just awarded PG 10 bonus belly-rub points!`,
      `SHERU SPEAKS: ${leader.profile.name} is on ${leader.totalPoints} pts! Dave "Tiger Queen", remember: there is only room for ONE real tiger in Flat 2110, and Bai is coming for those unwashed protein shakers!`,
      `ROAR! With ${leader.wins} wins and a ${leader.goldenBetWon ? 'CASHED 2x Golden Bet' : 'live Golden Bet'}, ${leader.profile.fullTitle} is marching to the Sportsman of the House Crown!`,
    ];

    const ai = getGeminiClient();
    if (!ai) {
      const picked = fallbackQuips[Math.floor(Math.random() * fallbackQuips.length)];
      tournamentState.sheruLastQuip = picked;
      saveTournamentStateToDisk(tournamentState, false);
      broadcastSseUpdate('update');
      res.json({ quip: picked, source: 'grounded-fallback' });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are Sheru the Tiger Mascot of Flat 2110 for the "Hyberabaddies - Sportsman of the House Championship" between three flatmates:
1. Addy "Double ACL"
2. PG "Koniki Supermodel" (loved by Mia the beagle puppy)
3. Dave "Tiger Queen" (constantly scolded by Bai, the Indian house maid)

Current Live Tournament Data:
${grounding}

Write ONE punchy, hilarious, trash-talking 2-sentence mascot roast/quip from Sheru the Tiger referencing the exact current points, Golden Bet status, or Normalized Differential. Keep it under 45 words.`,
      });

      const quipText =
        response.text?.trim() ||
        fallbackQuips[Math.floor(Math.random() * fallbackQuips.length)];

      tournamentState.sheruLastQuip = quipText;
      saveTournamentStateToDisk(tournamentState, false);
      broadcastSseUpdate('update');

      res.json({ quip: quipText, source: 'gemini' });
    } catch (err) {
      console.warn('Gemini Sheru quip fallback triggered:', err);
      const picked = fallbackQuips[Math.floor(Math.random() * fallbackQuips.length)];
      tournamentState.sheruLastQuip = picked;
      saveTournamentStateToDisk(tournamentState, false);
      broadcastSseUpdate('update');
      res.json({ quip: picked, source: 'grounded-fallback' });
    }
  });

  // 7. POST /api/gemini/newsroom — AI Breaking News Generator for Flat 2110 Tabloid
  app.post('/api/gemini/newsroom', async (req: Request, res: Response) => {
    const customTopic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
    const grounding = buildStandingsGroundingText(tournamentState);
    const summary = computeTournamentSummary(tournamentState);
    const leader = summary.standings[0];
    const trailer = summary.standings[2];

    const createFallbackArticle = () => ({
      id: `news-${Date.now()}`,
      headline: `${leader.profile.name.toUpperCase()} SEIZES FLAT 2110 LEAD ON ${leader.totalPoints} PTS AS ${trailer.profile.name.toUpperCase()} BLAMES COURT CONDITIONS!`,
      subheadline: `Normalized Match Differential (${leader.normalizedDiff >= 0 ? '+' : ''}${leader.normalizedDiff}) and Golden Sport strategy separate the Hyberabaddies contenders.`,
      body: `FLAT 2110 PRESS BOX — With ${leader.totalPoints} total points (${leader.basePoints} base + ${leader.goldenBonusPoints} Golden 2x bonus), ${leader.profile.fullTitle} sits atop the Sportsman of the House table. ${customTopic ? `In breaking developments regarding "${customTopic}", ` : ''}eyewitnesses report that Mia the Beagle sprinted across the living room to console PG, while Bai lectured Dave "Tiger Queen" for leaving sports gear in the hallway.`,
      category: 'HYBERABADDIES SPECIAL EDITION',
      author: 'Sheru Chief Correspondent',
      timestamp: new Date().toISOString(),
    });

    const ai = getGeminiClient();
    if (!ai) {
      const fallbackArticle = createFallbackArticle();
      tournamentState.news = [fallbackArticle, ...tournamentState.news.slice(0, 14)];
      saveTournamentStateToDisk(tournamentState, false);
      broadcastSseUpdate('update');
      res.json({ article: fallbackArticle, state: tournamentState });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate a sensationalist, hilarious sports tabloid breaking news article for "The Hyberabaddies Gazette" in Flat 2110 covering the "Sportsman of the House Championship" between Addy "Double ACL", PG "Koniki Supermodel", and Dave "Tiger Queen".
Also mention Mia the beagle (who loves PG) or Bai the maid (who scolds Dave).
${customTopic ? `Special angle requested by reporter: ${customTopic}` : ''}

Live Tournament Standings & Context:
${grounding}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: 'All-caps punchy tabloid headline',
              },
              subheadline: {
                type: Type.STRING,
                description: 'One-sentence subheadline with exact scores or stats',
              },
              body: {
                type: Type.STRING,
                description: '2-3 sentences of dramatic sports tabloid reporting from Flat 2110',
              },
              category: {
                type: Type.STRING,
                description: 'Short tabloid section label e.g. FLAT 2110 EXCLUSIVE',
              },
              author: {
                type: Type.STRING,
                description: 'Byline e.g. Sheru Sports Desk',
              },
            },
            required: ['headline', 'subheadline', 'body', 'category', 'author'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const newArticle = {
        id: `news-${Date.now()}`,
        headline: parsed.headline || createFallbackArticle().headline,
        subheadline: parsed.subheadline || createFallbackArticle().subheadline,
        body: parsed.body || createFallbackArticle().body,
        category: parsed.category || 'FLAT 2110 EXCLUSIVE',
        author: parsed.author || 'Sheru Sports Desk',
        timestamp: new Date().toISOString(),
      };

      tournamentState.news = [newArticle, ...tournamentState.news.slice(0, 14)];
      saveTournamentStateToDisk(tournamentState, false);
      broadcastSseUpdate('update');
      res.json({ article: newArticle, state: tournamentState });
    } catch (err) {
      console.warn('Gemini Newsroom fallback triggered:', err);
      const fallbackArticle = createFallbackArticle();
      tournamentState.news = [fallbackArticle, ...tournamentState.news.slice(0, 14)];
      saveTournamentStateToDisk(tournamentState, false);
      broadcastSseUpdate('update');
      res.json({ article: fallbackArticle, state: tournamentState });
    }
  });

  // Mount Vite in dev or serve static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Hyberabaddies Flat 2110 Championship server running at http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
