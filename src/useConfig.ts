import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Lang } from './i18n';

export interface AppConfig {
  themeId: string;
  lang: Lang;
  fontFamily: string;
  showStars: boolean;
  starsCount: number;
  starsMinSize: number;
  starsMaxSize: number;
  starsColor: string;
  animSpeed: number;
  autoPlay: boolean;
  maxFrames: number;
  defaultWidth: number;
  defaultPalette: number;
  defaultFontRatio: number;
  showFps: boolean;
  smoothScale: boolean;
  hwAccel: boolean;
  compressHtml: boolean;
  defaultBg: string;
  defaultZoom: number;
  showGrid: boolean;
  cursorCross: boolean;
  saveLastPath: boolean;
  notifications: boolean;
  logLevel: string;
  maxHistory: number;
  virtualCameraPort: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  themeId: 'dark',
  lang: 'ru',
  fontFamily: 'Consolas',
  showStars: true,
  starsCount: 100,
  starsMinSize: 1.0,
  starsMaxSize: 3.0,
  starsColor: '#ffffff',
  animSpeed: 150,
  autoPlay: true,
  maxFrames: 300,
  defaultWidth: 120,
  defaultPalette: 0,
  defaultFontRatio: 2.0,
  showFps: true,
  smoothScale: true,
  hwAccel: true,
  compressHtml: true,
  defaultBg: '#0a0a0b',
  defaultZoom: 8,
  showGrid: false,
  cursorCross: true,
  saveLastPath: true,
  notifications: true,
  logLevel: 'info',
  maxHistory: 20,
  virtualCameraPort: 8765,
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    invoke<string>('load_config')
      .then(raw => {
        try {
          const parsed = JSON.parse(raw) as Partial<AppConfig>;
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        } catch {
          setConfig(DEFAULT_CONFIG);
        }
      })
      .catch(() => setConfig(DEFAULT_CONFIG))
      .finally(() => setLoaded(true));
  }, []);

  const saveConfig = useCallback((cfg: AppConfig) => {
    setConfig(cfg);
    invoke('save_config', { content: JSON.stringify(cfg, null, 2) }).catch(console.error);
  }, []);

  const resetConfig = useCallback(() => {
    saveConfig(DEFAULT_CONFIG);
  }, [saveConfig]);

  return { config, setConfig, saveConfig, resetConfig, loaded };
}