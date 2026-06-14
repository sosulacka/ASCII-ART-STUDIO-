import {
  useState, useRef, useEffect, useCallback, useMemo,
  MouseEvent as ReactMouseEvent, WheelEvent
} from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save } from '@tauri-apps/plugin-dialog';
import {
  Image as ImageIcon, Video, Save, Play, Sliders,
  Palette, Type, Monitor, SkipBack, SkipForward,
  Pause, Square, Film, ChevronDown, Settings,
  Minus, Maximize2, Minimize2, X
} from 'lucide-react';
import figlet from 'figlet';
import './App.css';

import { THEMES, type Theme } from './themes';
import { t, type Lang } from './i18n';
import { useConfig } from './useConfig';
import SplashScreen from './SplashScreen';
import { SettingsPanel } from './SettingsPanel';
import { FIGLET_FONTS } from './figletFonts';
import { requestCameraAccess, stopMediaStream, requestNativeCameraAccess, type CameraCapture } from './mediaDevices';
import { ToastContainer, type ToastData, type ToastType } from './Toast';
import { localizeError } from './errorParser';

function applyTheme(theme: Theme, fontFamily: string) {
  const r = document.documentElement.style;
  r.setProperty('--bg-app',            theme.bgApp);
  r.setProperty('--bg-sidebar',        theme.bgSidebar);
  r.setProperty('--bg-section',        theme.bgSection);
  r.setProperty('--bg-hover',          theme.bgHover);
  r.setProperty('--bg-modal',          theme.bgModal);
  r.setProperty('--bg-input',          theme.bgInput);
  r.setProperty('--bg-dropdown',       theme.bgDropdown);
  r.setProperty('--bg-dropdown-opt',   theme.bgDropdownOption);
  r.setProperty('--border',            theme.border);
  r.setProperty('--border-strong',     theme.borderStrong);
  r.setProperty('--text-primary',      theme.textPrimary);
  r.setProperty('--text-secondary',    theme.textSecondary);
  r.setProperty('--text-muted',        theme.textMuted);
  r.setProperty('--text-disabled',     theme.textDisabled);
  r.setProperty('--accent',            theme.accent);
  r.setProperty('--accent-hover',      theme.accentHover);
  r.setProperty('--accent-text',       theme.accentText);
  r.setProperty('--btn-primary',       theme.btnPrimary);
  r.setProperty('--btn-primary-hover', theme.btnPrimaryHover);
  r.setProperty('--btn-primary-text',  theme.btnPrimaryText);
  r.setProperty('--btn-ghost',         theme.btnGhost);
  r.setProperty('--btn-ghost-hover',   theme.btnGhostHover);
  r.setProperty('--slider-track',      theme.sliderTrack);
  r.setProperty('--slider-thumb',      theme.sliderThumb);
  r.setProperty('--scrollbar',         theme.scrollbar);
  r.setProperty('--star-color',        theme.starColor);
  r.setProperty('--font-mono', `'${fontFamily}', 'Consolas', monospace`);
}

function TitleBar({ title, strings }: { title: string; strings: ReturnType<typeof t> }) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.isMaximized().then(setIsMaximized).catch(console.error);

    const unlistenPromise = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized).catch(console.error);
    });

    return () => {
      unlistenPromise.then(f => f()).catch(() => {});
    };
  }, []);

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = async () => {
    await getCurrentWindow().toggleMaximize();
    setIsMaximized(await getCurrentWindow().isMaximized());
  };
  const handleClose = () => getCurrentWindow().close();

  return (
    <div className="titlebar" data-tauri-drag-region>
      
      <div className="titlebar-left">
        <Monitor size={13} />
        <span className="titlebar-title">{title}</span>
      </div>

      {}
      <div className="titlebar-drag" data-tauri-drag-region />

      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn--minimize"
          onClick={handleMinimize}
          title={strings.minimize}
        >
          <Minus size={12} />
        </button>
        <button
          className="titlebar-btn titlebar-btn--maximize"
          onClick={handleMaximize}
          title={isMaximized ? strings.restore : strings.maximize}
        >
          {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <button
          className="titlebar-btn titlebar-btn--close"
          onClick={handleClose}
          title={strings.close}
        >
          <X size={12} />
        </button>
      </div>

    </div>
  );
}


function TiltButton({
  children, className = '', ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el || rest.disabled) return;
    const r  = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top  - r.height / 2) / r.height) * -10;
    const ry = ((e.clientX - r.left - r.width  / 2) / r.width ) *  10;
    el.style.transform =
      `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-btn ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function StarField({ show, count, minSize, maxSize, color }: {
  show: boolean;
  count: number;
  minSize: number;
  maxSize: number;
  color: string;
}) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * (maxSize - minSize) + minSize,
      o: Math.random() * 0.5 + 0.1,
      d: Math.random() * 4 + 2,
      dx: (Math.random() - 0.5) * 30,
      dy: (Math.random() - 0.5) * 30,
    }));
  }, [count, minSize, maxSize]);

  if (!show) return null;

  return (
    <div className="starfield">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.s,
          height: s.s,
          opacity: s.o,
          animationDuration: `${s.d}s`,
          backgroundColor: color,
          ['--dx' as any]: `${s.dx}px`,
          ['--dy' as any]: `${s.dy}px`,
          ['--dur' as any]: `${s.d}s`,
        }} />
      ))}
    </div>
  );
}


interface DropdownOption { value: number; label: string; }

function Dropdown({ options, value, onChange }: {
  options: DropdownOption[];
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value) ?? options[0];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button
        className={`dropdown-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span>{selected.label}</span>
        <span className="dropdown-arrow"><ChevronDown size={12} /></span>
      </button>
      {open && (
        <div className="dropdown-menu">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`dropdown-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function SaveModal({ type, lang, onClose, onChoose }: {
  type: 'image' | 'video' | 'text';
  lang: Lang;
  onClose: () => void;
  onChoose: (f: string) => void;
}) {
  const s = t(lang);
  return (
    <div className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <p className="modal-title">{s.formatTitle}</p>
        <p className="modal-subtitle">
          {type === 'video' ? s.formatSubVideo : type === 'text' ? s.formatSubText : s.formatSubImage}
        </p>
        <div className="modal-buttons">
          {type === 'video' ? (
            <>
              <button className="modal-btn" onClick={() => onChoose('gif')}>
                <span className="modal-btn-ext">.gif</span>
                <span>{s.gifAnim}</span>
              </button>
              <button className="modal-btn" onClick={() => onChoose('mp4')}>
                <span className="modal-btn-ext">.mp4</span>
                <span>{s.mp4Video}</span>
              </button>
            </>
          ) : type === 'text' ? (
            <>
              <button className="modal-btn" onClick={() => onChoose('txt')}>
                <span className="modal-btn-ext">.txt</span>
                <span>{s.textTxt}</span>
              </button>
              <button className="modal-btn" onClick={() => onChoose('md')}>
                <span className="modal-btn-ext">.md</span>
                <span>{s.markdownMd}</span>
              </button>
              <button className="modal-btn" onClick={() => onChoose('png')}>
                <span className="modal-btn-ext">.png</span>
                <span>{s.pngImage}</span>
              </button>
              <button className="modal-btn" onClick={() => onChoose('gif')}>
                <span className="modal-btn-ext">.gif</span>
                <span>{s.gifImage}</span>
              </button>
            </>
          ) : (
            <>
              <button className="modal-btn" onClick={() => onChoose('html')}>
                <span className="modal-btn-ext">.html</span>
                <span>{s.coloredHtml}</span>
              </button>
              <button className="modal-btn" onClick={() => onChoose('txt')}>
                <span className="modal-btn-ext">.txt</span>
                <span>{s.textTxt}</span>
              </button>
              <button className="modal-btn" onClick={() => onChoose('png')}>
                <span className="modal-btn-ext">.png</span>
                <span>PNG Image</span>
              </button>
              <button className="modal-btn" onClick={() => onChoose('gif')}>
                <span className="modal-btn-ext">.gif</span>
                <span>GIF Image</span>
              </button>
            </>
          )}
        </div>
        <button className="modal-cancel" onClick={onClose}>{s.cancel}</button>
      </div>
    </div>
  );
}

function LangTransition({ active, theme, lang }: {
  active: boolean;
  theme: Theme;
  lang: Lang;
}) {
  return (
    <div
      className={`lang-transition-overlay ${active ? 'active' : ''}`}
      style={{ background: theme.splashBg }}
    >
      <svg className="lang-spinner" viewBox="0 0 50 50"
        style={{ stroke: theme.splashSpinner }}>
        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="3"
          strokeDasharray="80 120" strokeLinecap="round" />
      </svg>
      <div className="lang-spinner-text" style={{ color: theme.splashText }}>
        {t(lang).splashLang}
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, decimals = 0, onChange }: {
  label: string; value: number;
  min: number; max: number;
  step?: number; decimals?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-row">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">
          {decimals > 0 ? value.toFixed(decimals) : value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider-strict"
      />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="check-row">
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="checkbox-strict"
      />
      <span>{label}</span>
    </label>
  );
}

interface VideoFramesResult {
  frames: string[];
  fps: number;
  total_frames: number;
}

export default function App() {
  const { config, saveConfig, resetConfig, loaded } = useConfig();
  const [splashDone, setSplashDone] = useState(false);

  const currentTheme = THEMES.find(th => th.id === config.themeId) ?? THEMES[0];
  const currentLang  = config.lang;
  const s            = t(currentLang);

  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdCounter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const localizedMessage = localizeError(message, currentLang);
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, message: localizedMessage, type, duration }]);
  }, [currentLang]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (loaded) applyTheme(currentTheme, config.fontFamily);
  }, [currentTheme, config.fontFamily, loaded]);

  const [langTransition, setLangTransition] = useState(false);
  const prevLang = useRef<Lang>(currentLang);
  useEffect(() => {
    if (prevLang.current !== currentLang) {
      setLangTransition(true);
      setTimeout(() => setLangTransition(false), 1200);
      prevLang.current = currentLang;
    }
  }, [currentLang]);

  const [showSettings, setShowSettings] = useState(false);

  const [filePath, setFilePath]   = useState<string | null>(null);
  const [isVideo, setIsVideo]     = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const [width, setWidth]                 = useState(config.defaultWidth);
  const [fontRatio, setFontRatio]         = useState(config.defaultFontRatio);
  const [brightness, setBrightness]       = useState(0);
  const [contrast, setContrast]           = useState(0);
  const [gamma, setGamma]                 = useState(1.0);
  const [paletteIndex, setPaletteIndex]   = useState(config.defaultPalette);
  const [customPalette, setCustomPalette] = useState('');
  const [invert, setInvert]               = useState(false);
  const [useColor, setUseColor]           = useState(false);
  const [bgColor, setBgColor]             = useState(config.defaultBg);
  const [zoom, setZoom]                   = useState(config.defaultZoom);

  useEffect(() => {
    if (loaded) {
      setWidth(config.defaultWidth);
      setFontRatio(config.defaultFontRatio);
      setPaletteIndex(config.defaultPalette);
      setBgColor(config.defaultBg);
      setZoom(config.defaultZoom);
    }
  }, [loaded]);

  const [imageOutput, setImageOutput]   = useState('');
  const [videoFrames, setVideoFrames]   = useState<string[]>([]);
  const [videoFps, setVideoFps]         = useState(25);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg]       = useState('');

  const [sidebarMode, setSidebarMode] = useState<'ascii' | 'text' | 'webcam'>('ascii');
  const [textInput, setTextInput]     = useState('ASCII ART');
  const [textOutput, setTextOutput]   = useState('');
  const [selectedFigletFont, setSelectedFigletFont] = useState('Standard');
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);
  const [hoveredPreview, setHoveredPreview] = useState('');

  const [cameraActive, setCameraActive] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);
  const webcamOutputRef = useRef<HTMLPreElement>(null); 
  const [virtualCameraActive, setVirtualCameraActive] = useState(false);
  const [virtualCameraFrameCount, setVirtualCameraFrameCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraRef = useRef<CameraCapture | null>(null);
  const frameRequestId = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const processingFrameRef = useRef(false);
  
  const loadedFonts = useRef(new Map<string, string>());

  const processingVirtualFrameRef = useRef(false);

  const fetchAndLoadFont = useCallback(async (fontName: string, ext: 'flf' | 'tlf') => {
    if (loadedFonts.current.has(fontName)) {
      return loadedFonts.current.get(fontName)!;
    }
    const url = `https://raw.githubusercontent.com/xero/figlet-fonts/master/${encodeURIComponent(fontName)}.${ext}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const content = await res.text();
    loadedFonts.current.set(fontName, content);
    try {
      figlet.parseFont(fontName, content);
    } catch (err) {
      console.error("Figlet parse error", err);
    }
    try {
      await invoke('save_font_to_temp', { name: `${fontName}.${ext}`, content });
    } catch (err) {
      console.error("Tauri save_font_to_temp error", err);
    }
    return content;
  }, []);

  useEffect(() => {
    const popular = ["Standard", "Slant", "Doom", "3-D", "Banner", "Speed", "Big"];
    popular.forEach(f => {
      const match = FIGLET_FONTS.find(font => font.name === f);
      if (match) {
        fetchAndLoadFont(match.name, match.ext).catch(() => {});
      }
    });
  }, [fetchAndLoadFont]);

  useEffect(() => {
    if (!hoveredFont) {
      setHoveredPreview('');
      return;
    }
    const font = FIGLET_FONTS.find(f => f.name === hoveredFont);
    if (!font) return;
    setHoveredPreview(s.loadingPreview || 'Loading preview...');
    fetchAndLoadFont(font.name, font.ext).then(() => {
      figlet.text("ASCII", { font: font.name as any }, (err, result) => {
        if (!err && result) {
          setHoveredPreview(result);
        } else {
          setHoveredPreview(`[${s.previewError || 'Preview error'}]`);
        }
      });
    }).catch(err => {
      setHoveredPreview(`[${s.errorLabel || 'Error'}]: ${err.message}`);
    });
  }, [hoveredFont, fetchAndLoadFont]);

  const handleRenderText = useCallback(async () => {
    if (!textInput.trim()) {
      setTextOutput('');
      return;
    }
    const match = FIGLET_FONTS.find(f => f.name === selectedFigletFont) ?? { name: 'Standard', ext: 'flf' };
    try {
      await fetchAndLoadFont(match.name, match.ext);
      figlet.text(textInput, {
        font: match.name as any,
        width: width,
      }, (err, result) => {
        if (err) {
          setTextOutput(`[Error rendering]: ${err.message}`);
        } else {
          setTextOutput(result || '');
        }
      });
    } catch (err: any) {
      setTextOutput(`[Error loading font ${selectedFigletFont}]: ${err.message}`);
    }
  }, [textInput, selectedFigletFont, width, fetchAndLoadFont]);

  useEffect(() => {
    if (sidebarMode === 'text') {
      handleRenderText();
    }
  }, [sidebarMode, handleRenderText]);


  const startVirtualCamera = async () => {
    if (!cameraActive) {
      showToast(s.enableCameraFirst || 'Please enable camera first!', 'warning');
      return;
    }
    
    if (!canvasRef.current) {
      showToast(s.canvasNotReady || 'Canvas not ready. Try again.', 'warning');
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const outputWidth = canvas.width * 6;
      const outputHeight = canvas.height * 11;
      
      const result = await invoke<string>('start_virtual_camera', { 
        width: canvas.width, 
        height: canvas.height,
        port: config.virtualCameraPort
      });
      
      setVirtualCameraActive(true);
      setVirtualCameraFrameCount(0);
      const localizedResult = localizeError(result, currentLang);
      setStatusMsg(`${localizedResult} | ${s.resolution || 'Resolution'}: ${outputWidth}x${outputHeight}px`);
      showToast(localizedResult, 'success');
    } catch (err: any) {
      const errorMsg = localizeError(String(err), currentLang);
      setStatusMsg(errorMsg);
      showToast(errorMsg, 'error');
      setVirtualCameraActive(false);
    }
  };

  const stopVirtualCamera = async () => {
    try {
      const result = await invoke<string>('stop_virtual_camera');
      setVirtualCameraActive(false);
      setVirtualCameraFrameCount(0);
      const localizedResult = localizeError(result, currentLang);
      setStatusMsg(localizedResult);
      showToast(localizedResult, 'info');
    } catch (err: any) {
      const errorMsg = localizeError(String(err), currentLang);
      setStatusMsg(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const sendWebcamFrameToVirtualCamera = async (
    rgbData: number[],
    width: number,
    height: number,
    palette: string,
    brightness: number,
    contrast: number,
    gamma: number,
    invert: boolean,
    useColor: boolean
  ) => {
    try {
      await invoke('render_and_send_ascii_frame', {
        rgbData,
        width,
        height,
        palette,
        brightness,
        contrast,
        gamma,
        invert,
        useColor
      });
      
      setVirtualCameraFrameCount(prev => prev + 1);
    } catch (err) {
      if (Math.random() < 0.01) {
        setStatusMsg(`${s.virtualCameraError || 'Virtual camera error'}: ${err}`);
      }
    }
  };

  const convertCanvasToAsciiFromImageData = (
    imageData: ImageData,
    w: number,
    h: number,
    palette: string,
    brightness: number,
    contrast: number,
    gamma: number,
    invert: boolean,
    useColor: boolean
  ): string => {
    const data = imageData.data;
    const paletteChars = Array.from(palette);
    const paletteLen = paletteChars.length;
    const paletteMax = paletteLen - 1;

    const contrastFactor = contrast !== 0 
      ? (259 * (contrast + 255)) / (255 * (259 - contrast))
      : 0;
    
    const hasContrast = contrast !== 0;
    const hasBrightness = brightness !== 0;
    const hasGamma = gamma !== 1.0;
    
    const gammaLUT = hasGamma ? new Uint8Array(256) : null;
    if (hasGamma && gammaLUT) {
      for (let i = 0; i < 256; i++) {
        gammaLUT[i] = Math.round(Math.pow(i / 255, gamma) * 255);
      }
    }
    
    const lines: string[] = [];
    
    if (useColor) {
      lines.push("<pre style='margin:0;padding:0;line-height:1.0;font-family:monospace;'>");
    }
    
    let currentSpanColor = '';
    let currentLine = '';

    for (let y = 0; y < h; y++) {
      currentLine = '';
      if (useColor && currentSpanColor !== '') {
        currentSpanColor = '';
      }
      
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];

        if (hasBrightness) {
          r = r + brightness;
          g = g + brightness;
          b = b + brightness;
        }

        if (hasContrast) {
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));

        if (hasGamma && gammaLUT) {
          r = gammaLUT[Math.round(r)];
          g = gammaLUT[Math.round(g)];
          b = gammaLUT[Math.round(b)];
        }

        let gray = r * 0.299 + g * 0.587 + b * 0.114;
        
        if (invert) {
          gray = 255 - gray;
        }

        gray = Math.min(255, Math.max(0, gray));

        const charIdx = Math.floor((gray / 255) * paletteMax);
        const c = paletteChars[charIdx];

        if (useColor) {
          const hexR = Math.round(r) | 0;
          const hexG = Math.round(g) | 0;
          const hexB = Math.round(b) | 0;
          const hex = '#' + ((1 << 24) + (hexR << 16) + (hexG << 8) + hexB).toString(16).slice(1).toUpperCase();
          
          if (hex !== currentSpanColor) {
            if (currentSpanColor !== '') {
              currentLine += '</span>';
            }
            currentLine += `<span style='color:${hex}'>`;
            currentSpanColor = hex;
          }
          
          if (c === '<') currentLine += '&lt;';
          else if (c === '>') currentLine += '&gt;';
          else if (c === '&') currentLine += '&amp;';
          else if (c === ' ') currentLine += '&nbsp;';
          else currentLine += c;
        } else {
          currentLine += c;
        }
      }

      if (useColor && currentSpanColor !== '') {
        currentLine += '</span>';
        currentSpanColor = '';
      }

      lines.push(currentLine);
    }

    if (useColor) {
      return lines.join('<br>') + '</pre>';
    } else {
      return lines.join('\n');
    }
  };

  const convertCanvasToAscii = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    palette: string,
    brightness: number,
    contrast: number,
    gamma: number,
    invert: boolean,
    useColor: boolean
  ): string => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const paletteChars = Array.from(palette);
    const paletteLen = paletteChars.length;
    const paletteMax = paletteLen - 1;

    const contrastFactor = contrast !== 0 
      ? (259 * (contrast + 255)) / (255 * (259 - contrast))
      : 0;
    
    const hasContrast = contrast !== 0;
    const hasBrightness = brightness !== 0;
    const hasGamma = gamma !== 1.0;
    
    const gammaLUT = hasGamma ? new Uint8Array(256) : null;
    if (hasGamma && gammaLUT) {
      for (let i = 0; i < 256; i++) {
        gammaLUT[i] = Math.round(Math.pow(i / 255, gamma) * 255);
      }
    }
    
    const lines: string[] = [];
    
    if (useColor) {
      lines.push("<pre style='margin:0;padding:0;line-height:1.0;font-family:monospace;'>");
    }
    
    let currentSpanColor = '';
    let currentLine = '';

    for (let y = 0; y < h; y++) {
      currentLine = '';
      if (useColor && currentSpanColor !== '') {
        currentSpanColor = ''; 
      }
      
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];

        if (hasBrightness) {
          r = r + brightness;
          g = g + brightness;
          b = b + brightness;
        }

        if (hasContrast) {
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));

        if (hasGamma && gammaLUT) {
          r = gammaLUT[Math.round(r)];
          g = gammaLUT[Math.round(g)];
          b = gammaLUT[Math.round(b)];
        }

        let gray = r * 0.299 + g * 0.587 + b * 0.114;
        
        if (invert) {
          gray = 255 - gray;
        }

        gray = Math.min(255, Math.max(0, gray));

        const charIdx = Math.floor((gray / 255) * paletteMax);
        const c = paletteChars[charIdx];

        if (useColor) {
          const hexR = Math.round(r) | 0;
          const hexG = Math.round(g) | 0;
          const hexB = Math.round(b) | 0;
          const hex = '#' + ((1 << 24) + (hexR << 16) + (hexG << 8) + hexB).toString(16).slice(1).toUpperCase();
          
          if (hex !== currentSpanColor) {
            if (currentSpanColor !== '') {
              currentLine += '</span>';
            }
            currentLine += `<span style='color:${hex}'>`;
            currentSpanColor = hex;
          }
          
          if (c === '<') currentLine += '&lt;';
          else if (c === '>') currentLine += '&gt;';
          else if (c === '&') currentLine += '&amp;';
          else if (c === ' ') currentLine += '&nbsp;';
          else currentLine += c;
        } else {
          currentLine += c;
        }
      }

      if (useColor && currentSpanColor !== '') {
        currentLine += '</span>';
        currentSpanColor = '';
      }

      lines.push(currentLine);
    }

    if (useColor) {
      return lines.join('<br>') + '</pre>';
    } else {
      return lines.join('\n');
    }
  };

  const paramsRef = useRef({ width, fontRatio, paletteIndex, customPalette, brightness, contrast, gamma, invert, useColor });
  const virtualCameraActiveRef = useRef(false);
  const lastFrameTimeRef = useRef(performance.now());
  const fpsCounterRef = useRef(0);
  const currentFpsRef = useRef(60);
  const fpsUpdateIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    paramsRef.current = { width, fontRatio, paletteIndex, customPalette, brightness, contrast, gamma, invert, useColor };
  }, [width, fontRatio, paletteIndex, customPalette, brightness, contrast, gamma, invert, useColor]);

  useEffect(() => {
    virtualCameraActiveRef.current = virtualCameraActive;
  }, [virtualCameraActive]);

  const webcamLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    
    if (!canvas || !ctx) {
      frameRequestId.current = requestAnimationFrame(webcamLoop);
      return;
    }
    
    // FPS измерение
    const now = performance.now();
    fpsCounterRef.current++;
    const elapsed = now - lastFrameTimeRef.current;
    
    // Обновляем FPS каждые 500ms
    if (elapsed >= 500) {
      const measuredFps = Math.round((fpsCounterRef.current * 1000) / elapsed);
      currentFpsRef.current = measuredFps;
      
      // Отправляем новый FPS на виртуальную камеру
      if (virtualCameraActiveRef.current) {
        invoke('set_virtual_camera_fps', { fps: measuredFps }).catch(() => {});
      }
      
      fpsCounterRef.current = 0;
      lastFrameTimeRef.current = now;
    }
    
    const params = paramsRef.current;
    
    if (videoRef.current && streamRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      
      canvas.width = params.width;
      const vAspectRatio = video.videoHeight / video.videoWidth;
      canvas.height = Math.max(1, Math.round((params.width * vAspectRatio) / params.fontRatio));

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    if (canvas.width > 0 && canvas.height > 0) {
      const pOptions = [
        " .:-=+*#%@",
        " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@",
        " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczxyujcqL0ozmwqpdbkhao*#MW&8%B@$",
        " ░▒▓█",
        " 01",
      ];
      const palette = params.customPalette || pOptions[Math.min(params.paletteIndex, pOptions.length - 1)];

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const ascii = convertCanvasToAsciiFromImageData(
        imageData,
        canvas.width,
        canvas.height,
        palette,
        params.brightness,
        params.contrast,
        params.gamma,
        params.invert,
        false
      );
      
      if (webcamOutputRef.current && ascii) {
        webcamOutputRef.current.textContent = ascii;
      }
      
      if (virtualCameraActiveRef.current && !processingVirtualFrameRef.current) {
        processingVirtualFrameRef.current = true;
        const data = imageData.data;
        const rgbBuffer = new Uint8Array(canvas.width * canvas.height * 3);
        for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
          rgbBuffer[j] = data[i];
          rgbBuffer[j + 1] = data[i + 1];
          rgbBuffer[j + 2] = data[i + 2];
        }
        
        const b64 = btoa(String.fromCharCode(...rgbBuffer));
        invoke('render_and_send_ascii_frame_b64', {
          rgbB64: b64,
          width: canvas.width,
          height: canvas.height,
          palette,
          brightness: params.brightness,
          contrast: params.contrast,
          gamma: params.gamma,
          invert: params.invert,
          useColor: params.useColor
        }).catch(() => {})
          .finally(() => {
            processingVirtualFrameRef.current = false;
          });
      }
    }
    
    frameRequestId.current = requestAnimationFrame(webcamLoop);
  }, []);

  const startCamera = async () => {
    try {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia not available');
        }

        const stream = await requestCameraAccess({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30, max: 30 }
          }
        }, currentLang);
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraActive(true);
        if (frameRequestId.current) {
          cancelAnimationFrame(frameRequestId.current);
        }
        frameRequestId.current = requestAnimationFrame(webcamLoop);
        setStatusMsg(s.cameraStartedWebAPI || 'Camera started (WebAPI)');
        showToast(s.cameraStartedWebAPI || 'Camera started (WebAPI)', 'success');
        return;
      } catch (webApiError: any) {
        const targetHeight = Math.max(1, Math.round((width * 0.75) / fontRatio));
        const nativeCapture = await requestNativeCameraAccess(width, targetHeight, (imageData) => {
          if (processingFrameRef.current) {
            return;
          }
          
          processingFrameRef.current = true;
          
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              createImageBitmap(imageData).then(bitmap => {
                if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                  canvas.width = bitmap.width;
                  canvas.height = bitmap.height;
                }
                
                ctx.drawImage(bitmap, 0, 0);
                bitmap.close();
                processingFrameRef.current = false;
              }).catch(err => {
                processingFrameRef.current = false;
              });
            } else {
              processingFrameRef.current = false;
            }
          } else {
            processingFrameRef.current = false;
          }
        }, currentLang, () => !processingFrameRef.current);
        
        nativeCameraRef.current = nativeCapture;
        setCameraActive(true);
        
        await new Promise<void>((resolve) => {
          const checkCanvas = () => {
            if (canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
              resolve();
            } else {
              setTimeout(checkCanvas, 50);
            }
          };
          checkCanvas();
        });
        
        if (frameRequestId.current) {
          cancelAnimationFrame(frameRequestId.current);
        }
        frameRequestId.current = requestAnimationFrame(webcamLoop);
        setStatusMsg(s.cameraStartedNative || 'Camera started (Native)');
        showToast(s.cameraStartedNative || 'Camera started (Native)', 'success');
      }
    } catch (err: any) {
      const errorMsg = `${s.camErrorGeneric || 'Camera error'}: ${err.message || err}`;
      setStatusMsg(errorMsg);
      showToast(errorMsg, 'error');
      setCameraActive(false);
    }
  };

  const stopCamera = useCallback(async () => {
    if (frameRequestId.current) {
      cancelAnimationFrame(frameRequestId.current);
      frameRequestId.current = null;
    }
    
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    
    if (nativeCameraRef.current) {
      await nativeCameraRef.current.stop();
      nativeCameraRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (virtualCameraActive) {
      await stopVirtualCamera();
    }
    
    setCameraActive(false);
    if (webcamOutputRef.current) {
      webcamOutputRef.current.textContent = '';
    }
    setStatusMsg(s.cameraStopped || "Camera stopped.");
  }, [virtualCameraActive]);

  useEffect(() => {
    return () => {
      if (frameRequestId.current) cancelAnimationFrame(frameRequestId.current);
      stopMediaStream(streamRef.current);
      if (nativeCameraRef.current) {
        nativeCameraRef.current.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (cameraActive && sidebarMode === 'webcam') {
      const targetHeight = Math.max(1, Math.round((width * 0.75) / fontRatio));
      if (nativeCameraRef.current) {
        invoke('set_native_camera_resolution', { width, height: targetHeight }).catch(() => {});
      }
    }
  }, [width, fontRatio]);

  const startRecording = async () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = async () => {
        setRecordingActive(false);
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        setStatusMsg(s.savingWebcamVideo || 'Saving webcam recording...');
        try {
          const tempFilePath = await invoke<string>('save_webcam_temp_video', { bytes: Array.from(bytes) });
          setFilePath(tempFilePath);
          setIsVideo(true);
          setHasResult(false);
          setImageOutput('');
          setVideoFrames([]);
          setCurrentFrame(0);
          stopCamera();
          setSidebarMode('ascii');
          const msg = s.recordingComplete || 'Recording complete! Press "Execute" to generate ASCII video.';
          setStatusMsg(msg);
          showToast(msg, 'success');
        } catch (err) {
          const errorMsg = `${s.recordingError || 'Recording error'}: ${err}`;
          setStatusMsg(errorMsg);
          showToast(errorMsg, 'error');
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingActive(true);
      const msg = s.recordingStarted || 'Recording webcam...';
      setStatusMsg(msg);
      showToast(msg, 'info');
    } catch (err) {
      console.error(err);
      const errorMsg = `${s.recordingError || 'Recording error'}: ${err}`;
      setStatusMsg(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'image' | 'video' | 'text'>('image');

  const outputRef       = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPlayback = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback((frames: string[], fps: number) => {
    if (frames.length === 0) return;
    stopPlayback();
    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setCurrentFrame(p => (p + 1 >= frames.length ? 0 : p + 1));
    }, 1000 / fps);
  }, [stopPlayback]);

  useEffect(() => () => { stopPlayback(); }, [stopPlayback]);

  const handleLoad = async (mediaType: 'image' | 'video') => {
    const filters = mediaType === 'image'
      ? [{ name: 'Images', extensions: ['png','jpg','jpeg','webp','bmp'] }]
      : [{ name: 'Video / GIF', extensions: ['mp4','avi','mkv','gif','mov','webm'] }];

    const file = await open({ filters });
    if (file && typeof file === 'string') {
      setFilePath(file);
      setIsVideo(mediaType === 'video');
      setHasResult(false);
      setImageOutput('');
      setVideoFrames([]);
      setCurrentFrame(0);
      stopPlayback();
      setStatusMsg(`${s.loaded}: ${file.split(/[\\/]/).pop() ?? ''}`);
    }
  };

  const buildParams = () => ({
    file_path:      filePath!,
    width,
    palette_index:  paletteIndex,
    custom_palette: customPalette || null,
    brightness,
    contrast,
    gamma,
    font_ratio:     fontRatio,
    use_color:      useColor,
    invert,
  });

  const handleGenerate = async () => {
    if (!filePath) return;
    setIsProcessing(true);
    stopPlayback();
    setHasResult(false);

    try {
      if (isVideo) {
        setStatusMsg(s.processing);
        const result = await invoke<VideoFramesResult>('process_video_frames', {
          params: buildParams(),
        });
        setVideoFrames(result.frames);
        setVideoFps(result.fps);
        setCurrentFrame(0);
        setHasResult(true);
        setStatusMsg(`${result.total_frames} ${s.framesAt} ${result.fps.toFixed(1)} FPS`);
        if (config.autoPlay) {
          setTimeout(() => startPlayback(result.frames, result.fps), 50);
        }
      } else {
        setStatusMsg(s.processing);
        const result = await invoke<string>('process_image', {
          params: buildParams(),
        });
        setImageOutput(result);
        setHasResult(true);
        setStatusMsg(s.done);
        showToast(s.done, 'success');
      }
    } catch (e) {
      const errorMsg = localizeError(String(e), currentLang);
      setStatusMsg(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveClick = () => {
    if (!hasResult || isProcessing) return;
    setSaveModalType(isVideo ? 'video' : 'image');
    setShowSaveModal(true);
  };

  const handleFormatChosen = async (fmt: string) => {
    setShowSaveModal(false);
    if (sidebarMode === 'text') await doSaveText(fmt);
    else if (isVideo) await doSaveVideo(fmt);
    else await doSaveImage(fmt);
  };

  const doSaveText = async (fmt: string) => {
    if (!textOutput) return;

    if (fmt === 'png' || fmt === 'gif') {
      const savePath = await save({
        filters: [{ name: `${fmt.toUpperCase()} Image`, extensions: [fmt] }],
        defaultPath: `ascii_text.${fmt}`,
      });
      if (!savePath || typeof savePath !== 'string') return;

      try {
        setIsProcessing(true);
        setStatusMsg(s.savingAs?.replace('{0}', fmt.toUpperCase()) || `Saving as ${fmt.toUpperCase()}...`);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const errorMsg = `${s.error}: ${s.canvasContextError}`;
          setStatusMsg(errorMsg);
          showToast(errorMsg, 'error');
          return;
        }

        const cleanText = textOutput.replace(/<[^>]*>/g, '');
        const lines = cleanText.split('\n');
        
        ctx.font = `10px ${config.fontFamily}, Consolas, monospace`;
        const charWidth = 6;
        const charHeight = 11;
        
        let maxWidth = 0;
        for (const line of lines) {
          maxWidth = Math.max(maxWidth, line.length);
        }
        
        canvas.width = maxWidth * charWidth;
        canvas.height = lines.length * charHeight;
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = `10px ${config.fontFamily}, Consolas, monospace`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'top';
        
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], 0, i * charHeight);
        }
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            const errorMsg = `${s.error}: ${s.blobCreateError}`;
            setStatusMsg(errorMsg);
            showToast(errorMsg, 'error');
            setIsProcessing(false);
            return;
          }
          
          const bytes = new Uint8Array(await blob.arrayBuffer());
          await invoke('save_binary_file', { 
            bytes: Array.from(bytes), 
            filePath: savePath 
          });
          const successMsg = `${s.saved}: ${savePath.split(/[\\/]/).pop() ?? ''}`;
          setStatusMsg(successMsg);
          showToast(successMsg, 'success');
          setIsProcessing(false);
        }, `image/${fmt}`);
      } catch (e) {
        const errorMsg = localizeError(String(e), currentLang);
        setStatusMsg(errorMsg);
        showToast(errorMsg, 'error');
        setIsProcessing(false);
      }
    } else {
      const isMd = fmt === 'md';
      const savePath = await save({
        filters: [isMd
          ? { name: 'Markdown File', extensions: ['md'] }
          : { name: 'Text File', extensions: ['txt'] }],
        defaultPath: isMd ? 'ascii_text.md' : 'ascii_text.txt',
      });
      if (!savePath || typeof savePath !== 'string') return;

      try {
        const cleanText = textOutput.replace(/<[^>]*>/g, '');
        const content = isMd ? `\`\`\`\n${cleanText}\n\`\`\`` : cleanText;
        await invoke('save_to_file', { content, filePath: savePath });
        const successMsg = `${s.saved}: ${savePath.split(/[\\/]/).pop() ?? ''}`;
        setStatusMsg(successMsg);
        showToast(successMsg, 'success');
      } catch (e) {
        const errorMsg = localizeError(String(e), currentLang);
        setStatusMsg(errorMsg);
        showToast(errorMsg, 'error');
      }
    }
  };

  const doSaveImage = async (fmt: string) => {
    if (fmt === 'png' || fmt === 'gif') {
      const savePath = await save({
        filters: [{ name: `${fmt.toUpperCase()} Image`, extensions: [fmt] }],
        defaultPath: `ascii_art.${fmt}`,
      });
      if (!savePath || typeof savePath !== 'string') return;

      try {
        setIsProcessing(true);
        setStatusMsg(s.savingAs?.replace('{0}', fmt.toUpperCase()) || `Saving as ${fmt.toUpperCase()}...`);
        const result = await invoke<string>('save_image_as_raster', {
          params: buildParams(),
          outputPath: savePath,
        });
        const localizedResult = localizeError(result, currentLang);
        setStatusMsg(localizedResult);
        showToast(localizedResult, 'success');
      } catch (e) {
        const errorMsg = localizeError(String(e), currentLang);
        setStatusMsg(errorMsg);
        showToast(errorMsg, 'error');
      } finally {
        setIsProcessing(false);
      }
    } else {
      const isHtml = fmt === 'html';
      const savePath = await save({
        filters: [isHtml
          ? { name: 'HTML File', extensions: ['html'] }
          : { name: 'Text File', extensions: ['txt'] }],
        defaultPath: isHtml ? 'ascii_art.html' : 'ascii_art.txt',
      });
      if (!savePath || typeof savePath !== 'string') return;

      try {
        const content = isHtml
          ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>` +
            `body{background:${bgColor};font-family:${config.fontFamily},Consolas,monospace;` +
            `font-size:8px;line-height:1.0;white-space:pre;margin:0;padding:10px;}` +
            `</style></head><body>${imageOutput}</body></html>`
          : imageOutput;
        await invoke('save_to_file', { content, filePath: savePath });
        const successMsg = `${s.saved}: ${savePath.split(/[\\/]/).pop() ?? ''}`;
        setStatusMsg(successMsg);
        showToast(successMsg, 'success');
      } catch (e) {
        const errorMsg = localizeError(String(e), currentLang);
        setStatusMsg(errorMsg);
        showToast(errorMsg, 'error');
      }
    }
  };

  const doSaveVideo = async (fmt: string) => {
    const savePath = await save({
      filters: [fmt === 'gif'
        ? { name: 'Animated GIF', extensions: ['gif'] }
        : { name: 'MP4 Video',    extensions: ['mp4'] }],
      defaultPath: fmt === 'gif' ? 'ascii_video.gif' : 'ascii_video.mp4',
    });
    if (!savePath || typeof savePath !== 'string') return;

    setIsProcessing(true);
    stopPlayback();
    setStatusMsg(fmt === 'gif' ? s.renderGif : s.renderMp4);

    try {
      const result = await invoke<string>('save_video', {
        params:     buildParams(),
        outputPath: savePath,
        format:     fmt,
      });
      const localizedResult = localizeError(result, currentLang);
      setStatusMsg(localizedResult);
      showToast(localizedResult, 'success');
    } catch (e) {
      const errorMsg = localizeError(String(e), currentLang);
      setStatusMsg(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsProcessing(false);
      if (videoFrames.length > 0) startPlayback(videoFrames, videoFps);
    }
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom(p => Math.max(2, Math.min(64, e.deltaY < 0 ? p + 1 : p - 1)));
    }
  };

  const currentContent  = isVideo ? (videoFrames[currentFrame] ?? '') : imageOutput;
  const isHtmlContent   = useColor && !!currentContent && !currentContent.startsWith('[');

  const paletteOptions: DropdownOption[] = [
    { value: 0, label: s.paletteStandard },
    { value: 1, label: s.paletteUltra },
    { value: 2, label: s.paletteDetailed },
    { value: 3, label: s.paletteBlocks },
    { value: 4, label: s.paletteBinary },
  ];

  if (!loaded || !splashDone) {
    return (
      <SplashScreen
        theme={currentTheme}
        lang={currentLang}
        onDone={() => setSplashDone(true)}
      />
    );
  }

  return (
    <div className="app-root">
      <TitleBar title={s.appTitle} strings={s} />

      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="app-body">
        <StarField 
          show={config.showStars} 
          count={config.starsCount}
          minSize={config.starsMinSize}
          maxSize={config.starsMaxSize}
          color={config.starsColor}
        />

        <LangTransition
          active={langTransition}
          theme={currentTheme}
          lang={currentLang}
        />

        {showSettings && (
          <SettingsPanel
            config={config}
            lang={currentLang}
            onSave={saveConfig}
            onReset={resetConfig}
            onClose={() => setShowSettings(false)}
        onPaletteChange={(val) => setPaletteIndex(val)}
      />
        )}

        {showSaveModal && (
          <SaveModal
            type={saveModalType}
            lang={currentLang}
            onClose={() => setShowSaveModal(false)}
            onChoose={handleFormatChosen}
          />
        )}

        {}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Monitor size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="sidebar-title">{s.appTitle}</span>
            <button
              className="header-icon-btn"
              onClick={() => setShowSettings(true)}
              title={s.settings}
            >
              <Settings size={14} />
            </button>
          </div>

          <div className="sidebar-body custom-scrollbar">

            {}
            <section className="panel-section">
              <div className="btn-row">
                <TiltButton
                  onClick={() => {
                    setSidebarMode('ascii');
                    stopCamera();
                  }}
                  className={sidebarMode === 'ascii' ? 'btn-primary' : 'btn-ghost'}
                  style={{ flex: 1 }}
                >
                  <ImageIcon size={12} /> 
                </TiltButton>
                <TiltButton
                  onClick={() => {
                    setSidebarMode('text');
                    stopCamera();
                  }}
                  className={sidebarMode === 'text' ? 'btn-primary' : 'btn-ghost'}
                  style={{ flex: 1 }}
                >
                  <Type size={12} /> {s.textToAscii}
                </TiltButton>
                <TiltButton
                  onClick={() => {
                    setSidebarMode('webcam');
                    setFilePath(null);
                    setIsVideo(false);
                    setHasResult(false);
                    setImageOutput('');
                    // Оптимальные настройки для webcam
                    setPaletteIndex(config.defaultPalette); // Используем палитру из настроек
                    setBrightness(20);  // Увеличить яркость
                    setContrast(30);    // Увеличить контраст
                    setUseColor(false); // Принудительно отключить HTML рендер
                  }}
                  className={sidebarMode === 'webcam' ? 'btn-primary' : 'btn-ghost'}
                  style={{ flex: 1 }}
                >
                  <Video size={12} /> {s.webcamToAscii}
                </TiltButton>
              </div>
            </section>

            {}
            {sidebarMode === 'ascii' && (
              <section className="panel-section">
                <div className="btn-row">
                  <TiltButton
                    onClick={() => handleLoad('image')}
                    className="btn-ghost"
                    style={{ flex: 1 }}
                  >
                    <ImageIcon size={12} /> {s.openImage}
                  </TiltButton>
                  <TiltButton
                    onClick={() => handleLoad('video')}
                    className="btn-ghost"
                    style={{ flex: 1 }}
                  >
                    <Video size={12} /> {s.openVideo}
                  </TiltButton>
                </div>
                {filePath && (
                  <div className="file-badge">
                    <Film size={10} />
                    <span>{filePath.split(/[\\/]/).pop()}</span>
                  </div>
                )}
              </section>
            )}

            {}
            {sidebarMode === 'text' && (
              <>
                <section className="panel-section">
                  <h2 className="section-title">
                    <Type size={11} /> {s.textToAscii}
                  </h2>
                  <input
                    type="text"
                    placeholder={s.enterText}
                    className="text-input"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      {s.selectFont}
                    </label>
                    <Dropdown
                      options={FIGLET_FONTS.map((f, idx) => ({ value: idx, label: f.name }))}
                      value={FIGLET_FONTS.findIndex(f => f.name === selectedFigletFont)}
                      onChange={(idx) => {
                        const font = FIGLET_FONTS[idx];
                        if (font) {
                          setSelectedFigletFont(font.name);
                          setHoveredFont(font.name);
                        }
                      }}
                    />
                  </div>

                  <SliderRow
                    label={s.width} value={width}
                    min={20} max={600} onChange={setWidth}
                  />

                  {hoveredPreview && (
                    <div style={{
                      marginTop: 8,
                      padding: 8,
                      background: 'var(--bg-section)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      fontSize: 8,
                      lineHeight: 1,
                      overflow: 'auto',
                      maxHeight: 120,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                    }}>
                      <pre style={{ margin: 0 }}>{hoveredPreview}</pre>
                    </div>
                  )}
                </section>
              </>
            )}

            {}
            {sidebarMode === 'webcam' && (
              <>
                <section className="panel-section">
                  <h2 className="section-title">
                    <Video size={11} /> {s.webcamToAscii}
                  </h2>
                  <div className="btn-row">
                    {!cameraActive ? (
                      <TiltButton
                        onClick={startCamera}
                        className="btn-primary"
                        style={{ flex: 1 }}
                      >
                        <Play size={12} /> {s.startCamera}
                      </TiltButton>
                    ) : (
                      <TiltButton
                        onClick={stopCamera}
                        className="btn-ghost"
                        style={{ flex: 1 }}
                      >
                        <Square size={12} /> {s.stopCamera}
                      </TiltButton>
                    )}
                  </div>

                  {cameraActive && (
                    <>
                      <div className="btn-row" style={{ marginTop: 8 }}>
                        {!recordingActive ? (
                          <TiltButton
                            onClick={startRecording}
                            className="btn-primary"
                            style={{ flex: 1 }}
                          >
                            <Film size={12} /> {s.startRecord}
                          </TiltButton>
                        ) : (
                          <TiltButton
                            onClick={stopRecording}
                            className="btn-ghost"
                            style={{ flex: 1 }}
                          >
                            <Square size={12} /> {s.stopRecord}
                          </TiltButton>
                        )}
                      </div>

                      <div className="btn-row" style={{ marginTop: 8 }}>
                        {!virtualCameraActive ? (
                          <TiltButton
                            onClick={startVirtualCamera}
                            className="btn-primary"
                            style={{ flex: 1 }}
                          >
                            <Monitor size={12} /> {s.startVirtualCam}
                          </TiltButton>
                        ) : (
                          <TiltButton
                            onClick={stopVirtualCamera}
                            className="btn-ghost"
                            style={{ flex: 1 }}
                          >
                            <Monitor size={12} /> {s.stopVirtualCam}
                          </TiltButton>
                        )}
                      </div>
                    </>
                  )}

                  {recordingActive && (
                    <div className="file-badge" style={{ marginTop: 8 }}>
                      <Film size={10} />
                      <span>{s.recordingActive}</span>
                    </div>
                  )}

                  {virtualCameraActive && (
                    <div className="file-badge" style={{ marginTop: 8 }}>
                      <Monitor size={10} />
                      <span>{s.virtualCamActive} ({virtualCameraFrameCount} {s.framesLabel || 'frames'})</span>
                    </div>
                  )}

                  {virtualCameraActive && canvasRef.current && (
                    <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 4 }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>
                        MJPEG Stream URL:
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="text"
                          readOnly
                          value={`http://localhost:${config.virtualCameraPort}/stream`}
                          style={{
                            flex: 1,
                            fontSize: 10,
                            padding: '4px 6px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            borderRadius: 2,
                            color: 'var(--accent)',
                            fontFamily: 'monospace',
                          }}
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`http://localhost:${config.virtualCameraPort}/stream`);
                            const msg = s.urlCopied || 'URL copied!';
                            setStatusMsg(msg);
                            showToast(msg, 'success');
                            setTimeout(() => setStatusMsg(''), 2000);
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: 9,
                            background: 'var(--btn-primary)',
                            color: 'var(--btn-primary-text)',
                            border: 'none',
                            borderRadius: 2,
                            cursor: 'pointer',
                          }}
                          title={s.copyUrl}
                        >
                          {s.copyUrl}
                        </button>
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>
                        {s.resolution}: {canvasRef.current.width * 6}x{canvasRef.current.height * 11}px ({canvasRef.current.width}x{canvasRef.current.height} {s.symbolsLabel})
                      </div>
                    </div>
                  )}

                  <SliderRow
                    label={s.width} value={width}
                    min={20} max={200} onChange={setWidth}
                  />
                  <SliderRow
                    label={s.fontRatio} value={fontRatio}
                    min={1.0} max={3.0} step={0.1} decimals={1}
                    onChange={setFontRatio}
                  />
                  <div className="grid-2">
                    <SliderRow
                      label={s.brightness} value={brightness}
                      min={-100} max={100} onChange={setBrightness}
                    />
                    <SliderRow
                      label={s.contrast} value={contrast}
                      min={-100} max={100} onChange={setContrast}
                    />
                  </div>
                  <SliderRow
                    label={s.gamma} value={gamma}
                    min={0.1} max={3.0} step={0.05} decimals={2}
                    onChange={setGamma}
                  />
                  <Dropdown
                    options={paletteOptions}
                    value={paletteIndex}
                    onChange={setPaletteIndex}
                  />
                  {}
                  <CheckRow
                    label={s.invert}
                    checked={invert}
                    onChange={setInvert}
                  />

                  {}
                  <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </section>
              </>
            )}

            {}
            {sidebarMode === 'ascii' && (
              <>
                <section className="panel-section">
                  <h2 className="section-title">
                    <Sliders size={11} /> {s.geometry}
                  </h2>
                  <SliderRow
                    label={s.width} value={width}
                    min={20} max={600} onChange={setWidth}
                  />
                  <SliderRow
                    label={s.fontRatio} value={fontRatio}
                    min={1.0} max={3.0} step={0.1} decimals={1}
                    onChange={setFontRatio}
                  />
                  <div className="grid-2">
                    <SliderRow
                      label={s.brightness} value={brightness}
                      min={-100} max={100} onChange={setBrightness}
                    />
                    <SliderRow
                      label={s.contrast} value={contrast}
                      min={-100} max={100} onChange={setContrast}
                    />
                  </div>
                  <SliderRow
                    label={s.gamma} value={gamma}
                    min={0.1} max={3.0} step={0.05} decimals={2}
                    onChange={setGamma}
                  />
                </section>

                {/* Символы */}
                <section className="panel-section">
                  <h2 className="section-title">
                    <Palette size={11} /> {s.symbols}
                  </h2>
                  <Dropdown
                    options={paletteOptions}
                    value={paletteIndex}
                    onChange={setPaletteIndex}
                  />
                  <input
                    type="text"
                    placeholder="Custom charset..."
                    className="text-input"
                    value={customPalette}
                    onChange={e => setCustomPalette(e.target.value)}
                  />
                  <div className="checks">
                    <CheckRow
                      label={s.colorRender}
                      checked={useColor}
                      onChange={setUseColor}
                    />
                    <CheckRow
                      label={s.invert}
                      checked={invert}
                      onChange={setInvert}
                    />
                  </div>
                </section>

                {}
                <section className="panel-section">
                  <h2 className="section-title">
                    <Type size={11} /> {s.viewport}
                  </h2>
                  <div className="color-row">
                    <span>{s.bgColor}</span>
                    <input
                      type="color" value={bgColor}
                      onChange={e => setBgColor(e.target.value)}
                      className="color-input"
                    />
                  </div>
                </section>
              </>
            )}

            {}
            {isVideo && hasResult && videoFrames.length > 0 && (
              <section className="panel-section">
                <h2 className="section-title">
                  <Film size={11} /> {s.player}
                </h2>
                <div className="player-controls">
                  <button className="player-btn"
                    onClick={() => setCurrentFrame(0)}>
                    <SkipBack size={13} />
                  </button>
                  <button
                    className="player-btn player-btn--main"
                    onClick={() => isPlaying
                      ? stopPlayback()
                      : startPlayback(videoFrames, videoFps)}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button className="player-btn"
                    onClick={() => { stopPlayback(); setCurrentFrame(0); }}>
                    <Square size={13} />
                  </button>
                  <button className="player-btn"
                    onClick={() => setCurrentFrame(videoFrames.length - 1)}>
                    <SkipForward size={13} />
                  </button>
                </div>

                {config.showFps && (
                  <div className="frame-info">
                    {currentFrame + 1} / {videoFrames.length}
                    &nbsp;·&nbsp;
                    {videoFps.toFixed(1)} FPS
                  </div>
                )}

                <input
                  type="range"
                  min={0} max={videoFrames.length - 1}
                  value={currentFrame}
                  className="slider-strict"
                  onChange={e => {
                    stopPlayback();
                    setCurrentFrame(Number(e.target.value));
                  }}
                />
              </section>
            )}
          </div>

          {statusMsg && <div className="status-bar">{statusMsg}</div>}

          <div className="sidebar-footer">
            {sidebarMode === 'ascii' ? (
              <>
                <TiltButton
                  onClick={handleGenerate}
                  disabled={!filePath || isProcessing}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {isProcessing
                    ? <><span className="spinner" /> {s.processing}</>
                    : <><Play size={13} /> {s.execute}</>}
                </TiltButton>

                <button
                  className="btn-icon"
                  onClick={handleSaveClick}
                  disabled={!hasResult || isProcessing}
                  title={s.save}
                >
                  <Save size={14} />
                </button>
              </>
            ) : sidebarMode === 'text' ? (
              <>
                <TiltButton
                  onClick={() => {
                    if (textOutput) {
                      navigator.clipboard.writeText(textOutput.replace(/<[^>]*>/g, ''));
                      const msg = s.copied || 'Copied!';
                      setStatusMsg(msg);
                      showToast(msg, 'success');
                      setTimeout(() => setStatusMsg(''), 2000);
                    }
                  }}
                  disabled={!textOutput}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  <Save size={13} /> {s.copyClipboard || 'Copy'}
                </TiltButton>
                <button
                  className="btn-icon"
                  onClick={() => {
                    if (!textOutput) return;
                    setSaveModalType('text');
                    setShowSaveModal(true);
                  }}
                  disabled={!textOutput}
                  title={s.save}
                >
                  <Save size={14} />
                </button>
              </>
            ) : (
              <>
                <TiltButton
                  onClick={() => {
                    if (webcamOutputRef.current && webcamOutputRef.current.textContent) {
                      const text = webcamOutputRef.current.textContent.replace(/<[^>]*>/g, '');
                      navigator.clipboard.writeText(text);
                      setStatusMsg(s.copied || 'Copied!');
                      setTimeout(() => setStatusMsg(''), 2000);
                    }
                  }}
                  disabled={!cameraActive}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  <Save size={13} /> {s.copyClipboard || 'Copy'}
                </TiltButton>
              </>
            )}
          </div>
        </aside>

        {}
        <div
          className="viewport"
          style={{
            backgroundColor: bgColor,
            cursor: config.cursorCross ? 'crosshair' : 'default',
          }}
          onWheel={handleWheel}
        >
          {config.showGrid && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
              backgroundImage:
                'linear-gradient(var(--border) 1px, transparent 1px),' +
                'linear-gradient(90deg, var(--border) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
          )}

          <div ref={outputRef} className="viewport-inner custom-scrollbar">
            {sidebarMode === 'text' ? (
              isHtmlContent && textOutput ? (
                <div
                  dangerouslySetInnerHTML={{ __html: textOutput }}
                  className="ascii-output"
                  style={{ fontSize: `${zoom}px`, lineHeight: '1.0', userSelect: 'text' }}
                />
              ) : (
                <pre
                  className="ascii-output ascii-output--plain"
                  style={{ fontSize: `${zoom}px`, lineHeight: '1.0', userSelect: 'text' }}
                >
                  {textOutput || `${s.enterText || 'Enter text...'}\n\n${s.ctrlZoom}`}
                </pre>
              )
            ) : sidebarMode === 'webcam' ? (
              cameraActive ? (
                <pre
                  ref={webcamOutputRef}
                  className="ascii-output ascii-output--plain"
                  style={{ fontSize: `${zoom}px`, lineHeight: '1.0', userSelect: 'text' }}
                >
                  {s.cameraLoading}
                </pre>
              ) : (
                <pre
                  className="ascii-output ascii-output--plain"
                  style={{ fontSize: `${zoom}px`, lineHeight: '1.0' }}
                >
                  {s.startCamera || 'Start camera to see live ASCII output'}
                </pre>
              )
            ) : (
              isHtmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: currentContent }}
                  className="ascii-output"
                  style={{ fontSize: `${zoom}px`, lineHeight: '1.0', userSelect: 'text' }}
                />
              ) : (
                <pre
                  className="ascii-output ascii-output--plain"
                  style={{ fontSize: `${zoom}px`, lineHeight: '1.0', userSelect: 'text' }}
                >
                  {currentContent || `${s.waitingInput}\n\n${s.ctrlZoom}`}
                </pre>
              )
            )}
          </div>

          <div className="viewport-badges">
            <div className="badge">Zoom: {zoom}px</div>
            {isVideo && hasResult && (
              <div className={`badge ${isPlaying ? 'badge--active' : ''}`}>
                {isPlaying ? '▶' : '⏸'} {currentFrame + 1}/{videoFrames.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}