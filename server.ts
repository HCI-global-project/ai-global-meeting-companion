import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const TRANSCRIBE_MODEL = 'gemini-3.5-transcribe';
const MAX_INLINE_AUDIO_BYTES = 18 * 1024 * 1024; // 18 MB inline request guard

const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/m4a',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/flac',
  'audio/aac',
  'audio/x-aac',
]);

function normalizeMimeType(rawMime?: string): string {
  if (!rawMime || typeof rawMime !== 'string') return 'audio/webm';
  const base = rawMime.split(';')[0]?.trim().toLowerCase() ?? '';
  if (base === 'audio/x-m4a') return 'audio/mp4';
  return base;
}

function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return key;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      geminiConfigured: Boolean(getConfiguredApiKey()),
      transcribeModel: TRANSCRIBE_MODEL,
    });
  });

  app.post('/api/transcribe', async (req, res) => {
    const apiKey = getConfiguredApiKey();
    if (!apiKey) {
      res.status(503).json({
        code: 'API_KEY_MISSING',
        error:
          'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Google AI Studio Settings > Secrets and restart the server.',
      });
      return;
    }

    const { audioBase64, mimeType, languageHint } = (req.body ?? {}) as {
      audioBase64?: unknown;
      mimeType?: unknown;
      languageHint?: unknown;
    };

    if (typeof audioBase64 !== 'string' || audioBase64.trim().length === 0) {
      res.status(400).json({
        code: 'EMPTY_AUDIO',
        error:
          'The recorded audio is empty. Please record your voice before transcribing.',
      });
      return;
    }

    const decodedSizeBytes = Buffer.from(audioBase64, 'base64').byteLength;
    if (decodedSizeBytes === 0) {
      res.status(400).json({
        code: 'EMPTY_AUDIO',
        error:
          'No audio bytes were found in this recording. Please record again.',
      });
      return;
    }

    if (decodedSizeBytes > MAX_INLINE_AUDIO_BYTES) {
      res.status(413).json({
        code: 'AUDIO_TOO_LARGE',
        error:
          'Recording exceeds the 18 MB inline transcription limit. Please record a shorter segment.',
      });
      return;
    }

    const normalizedMime = normalizeMimeType(
      typeof mimeType === 'string' ? mimeType : undefined
    );

    if (!SUPPORTED_AUDIO_MIME_TYPES.has(normalizedMime)) {
      res.status(415).json({
        code: 'UNSUPPORTED_FORMAT',
        error: `Unsupported audio format (${normalizedMime}). Supported formats include WebM, MP4/M4A, OGG/Opus, WAV, MP3, FLAC, and AAC.`,
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const hintText =
        typeof languageHint === 'string' && languageHint.trim().length > 0
          ? ` The listener's active interface language is ${languageHint.trim()}, though the speaker may speak Korean, English, Japanese, Burmese, Russian, Spanish, or another language.`
          : '';

      const response = await ai.models.generateContent({
        model: TRANSCRIBE_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: audioBase64,
              },
            },
            {
              text:
                'Transcribe the spoken audio verbatim in its original spoken language (supporting Korean, English, Japanese, Burmese, Russian, Spanish, and other languages).' +
                hintText +
                ' Return only the transcribed words with natural punctuation and no extra commentary or timestamps. If there is only silence or no intelligible speech, return an empty string.',
            },
          ],
        },
      });

      const transcribedText = (response.text ?? '').trim();

      res.json({
        text: transcribedText,
        emptySpeech: transcribedText.length === 0,
        model: TRANSCRIBE_MODEL,
        mimeType: normalizedMime,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Transcription request failed.';
      const lower = message.toLowerCase();

      console.error('Gemini transcription error:', message);

      if (
        lower.includes('api_key_invalid') ||
        lower.includes('permission_denied') ||
        lower.includes('403')
      ) {
        res.status(403).json({
          code: 'API_KEY_INVALID',
          error:
            'The server Gemini API key was rejected. Please verify GEMINI_API_KEY in Google AI Studio Settings > Secrets.',
        });
        return;
      }

      if (lower.includes('resource_exhausted') || lower.includes('429')) {
        res.status(429).json({
          code: 'RATE_LIMITED',
          error:
            'Gemini API free-tier rate limit or quota was reached. Please wait a moment and try again.',
        });
        return;
      }

      if (lower.includes('not_found') || lower.includes('404')) {
        res.status(404).json({
          code: 'MODEL_UNAVAILABLE',
          error: `The transcription model (${TRANSCRIBE_MODEL}) was not found or is unavailable for this API key.`,
        });
        return;
      }

      res.status(502).json({
        code: 'TRANSCRIPTION_FAILED',
        error: `Transcription failed: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Loop server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Loop server:', err);
  process.exit(1);
});
