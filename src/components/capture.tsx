/* Device capture: camera photo, barcode scanner, speech recognition. Each degrades to a manual path. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Upload, ScanBarcode } from 'lucide-react';
import { Button, Input, Notice } from './ui';
import { fileToDataUrl } from '@/services/vision';

export function CameraCapture({ onPhoto }: { onPhoto: (dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'blocked' | 'none'>('starting');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('none'); return; }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        stream.current = s;
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}); }
        setStatus('ready');
      } catch (e) { setStatus((e as Error).name === 'NotAllowedError' ? 'blocked' : 'none'); }
    })();
    return () => { cancelled = true; stream.current?.getTracks().forEach(t => t.stop()); };
  }, []);
  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const k = Math.min(1, 900 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    stream.current?.getTracks().forEach(t => t.stop());
    onPhoto(c.toDataURL('image/jpeg', 0.85));
  };
  const onFile = async (f?: File) => { if (f) onPhoto(await fileToDataUrl(f)); };
  return (
    <div className="grid gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-[#0B1513]">
        <video ref={video} playsInline muted className="size-full object-cover" aria-label="Camera preview" />
        {status !== 'ready' && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm font-semibold text-white">
            {status === 'starting' ? 'Starting camera…' : status === 'blocked' ? 'Camera permission is blocked. Allow it in your browser settings, or upload a photo.' : 'No camera available here. Upload a photo instead.'}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={snap} disabled={status !== 'ready'} icon={<Camera className="size-5" />} className="flex-1">Take photo</Button>
        <label className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#C7DED8] bg-white px-5 font-semibold text-brand-700 focus-within:outline focus-within:outline-3 focus-within:outline-brand-700 hover:bg-brand-50">
          <Upload className="size-5" aria-hidden />Upload a photo
          <input type="file" accept="image/*" className="sr-only" onChange={e => onFile(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}

export function BarcodeScanner({ onCode, busy }: { onCode: (code: string) => void; busy?: boolean }) {
  const [status, setStatus] = useState('Starting camera…');
  const [manual, setManual] = useState('');
  const [err, setErr] = useState('');
  const host = useRef<HTMLDivElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  useEffect(() => {
    let cancelled = false;
    let q: { stop: () => Promise<void>; clear: () => void; isScanning?: boolean } | null = null;
    // the scanner library owns this element's DOM, so React never renders inside it
    const mount = document.createElement('div');
    mount.id = `remitra-qr-${Math.random().toString(36).slice(2)}`;
    host.current?.appendChild(mount);
    const safeStop = () => {
      const s = q; q = null;
      if (!s) return;
      try { if (s.isScanning === false) { s.clear(); return; } s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch { /* ignore */ } }); }
      catch { try { s.clear(); } catch { /* ignore */ } }
    };
    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const inst = new Html5Qrcode(mount.id, { verbose: false });
        q = inst as unknown as typeof q;
        let done = false;
        await inst.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 140 } }, code => {
          if (done) return; done = true; safeStop(); onCodeRef.current(code);
        }, () => {});
        if (cancelled) { safeStop(); return; }
        setStatus('Line up the barcode inside the box.');
      } catch (e) {
        q = null;
        if (!cancelled) setStatus(/NotAllowed|Permission/i.test(String(e)) ? 'Camera permission is blocked. Type the number or upload a photo of the barcode.' : 'No camera available. Type the number or upload a photo of the barcode.');
      }
    })();
    return () => { cancelled = true; safeStop(); mount.remove(); };
  }, []);
  const fromFile = async (f?: File) => {
    if (!f) return;
    setErr('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const el = document.createElement('div'); el.id = `remitra-qr-file-${Date.now()}`; el.hidden = true; document.body.appendChild(el);
      try { onCode(await new Html5Qrcode(el.id).scanFile(f, false)); } finally { el.remove(); }
    } catch { setErr('No barcode found in that photo. Try a sharper, closer photo or type the number.'); }
  };
  const submit = () => {
    const c = manual.replace(/\D/g, '');
    if (c.length < 8 || c.length > 14) return setErr('Enter the 8 to 14 digits printed under the barcode.');
    setErr(''); onCode(c);
  };
  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-[#0B1513]">
        <div ref={host} className="min-h-64 [&_video]:!w-full [&_video]:object-cover" />
        <p className="absolute inset-x-3 bottom-3 rounded-xl bg-black/55 px-3 py-2 text-center text-sm font-semibold text-white" role="status">{status}</p>
      </div>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); submit(); }}>
        <label htmlFor="bc" className="sr-only">Barcode number</label>
        <Input id="bc" inputMode="numeric" placeholder="Or type the barcode number" value={manual} onChange={e => setManual(e.target.value)} aria-invalid={!!err || undefined} aria-describedby={err ? 'bc-err' : undefined} />
        <Button type="submit" loading={busy} icon={<ScanBarcode className="size-5" />}>Look up</Button>
      </form>
      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#C7DED8] bg-white px-4 text-sm font-semibold text-brand-700 focus-within:outline focus-within:outline-3 focus-within:outline-brand-700">
        <Upload className="size-4" aria-hidden />Upload a photo of a barcode
        <input type="file" accept="image/*" className="sr-only" onChange={e => fromFile(e.target.files?.[0])} />
      </label>
      {err && <p id="bc-err" className="text-sm font-semibold text-danger" role="alert">{err}</p>}
      <p className="text-xs text-ink-3">Try 3017624010701 to see a real Open Food Facts lookup.</p>
    </div>
  );
}

type SR = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };

export function useSpeech() {
  const Ctor = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
  const rec = useRef<SR | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const start = useCallback(() => {
    if (!Ctor) { setError('Voice input is not supported in this browser. Type your meal instead.'); return; }
    setError(''); setTranscript('');
    const r = new Ctor(); rec.current = r;
    r.lang = 'en-US'; r.interimResults = true; r.continuous = true;
    let finalText = '';
    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) finalText += x[0].transcript + ' '; else interim += x[0].transcript; }
      setTranscript((finalText + interim).trim());
    };
    r.onerror = e => setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Microphone permission is blocked. Allow it in your browser, or type your meal.'
      : e.error === 'no-speech' ? 'We did not hear anything. Try again, or type your meal.' : e.error === 'network' ? 'The speech service is unavailable. Type your meal instead.' : `Voice input stopped (${e.error}).`);
    r.onend = () => setListening(false);
    try { r.start(); setListening(true); } catch { setError('Could not start voice input.'); }
  }, [Ctor]);
  const stop = useCallback(() => { rec.current?.stop(); }, []);
  useEffect(() => () => { const r = rec.current; if (r) { r.onend = null; try { r.abort(); } catch { /* ignore */ } } }, []);
  return { supported: !!Ctor, listening, transcript, setTranscript, error, start, stop };
}

export function SpeechNotice() {
  return <Notice>Uses your browser's speech recognition. In Chrome, audio is sent to Google's speech service. The mobile app plans on-device speech-to-text.</Notice>;
}
