export interface TranscribeAudioResponse {
  text: string;
  emptySpeech: boolean;
  model: string;
  mimeType: string;
}

export class TranscriptionRequestError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'TranscriptionRequestError';
    this.code = code;
    this.status = status;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read recorded audio data.'));
        return;
      }
      const commaIndex = result.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('Invalid audio encoding format.'));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };
    reader.onerror = () => {
      reject(new Error('Could not read recorded audio blob.'));
    };
    reader.readAsDataURL(blob);
  });
}

export async function transcribeRecordedAudio(params: {
  audioBlob: Blob;
  mimeType: string | null;
  languageHint?: string;
}): Promise<TranscribeAudioResponse> {
  const { audioBlob, mimeType, languageHint } = params;

  if (!audioBlob || audioBlob.size === 0) {
    throw new TranscriptionRequestError(
      'The recorded audio is empty. Please record your voice first.',
      'EMPTY_AUDIO',
      400
    );
  }

  const audioBase64 = await blobToBase64(audioBlob);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioBase64,
      mimeType: mimeType || audioBlob.type || 'audio/webm',
      languageHint,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    text?: string;
    emptySpeech?: boolean;
    model?: string;
    mimeType?: string;
    error?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new TranscriptionRequestError(
      payload.error || `Server transcription error (${response.status}).`,
      payload.code || 'TRANSCRIPTION_FAILED',
      response.status
    );
  }

  return {
    text: payload.text ?? '',
    emptySpeech: Boolean(payload.emptySpeech),
    model: payload.model ?? 'gemini-3.5-transcribe',
    mimeType: payload.mimeType ?? (mimeType || 'audio/webm'),
  };
}
