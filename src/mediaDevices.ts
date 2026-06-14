/**
 * Cross-platform camera access helper for Tauri
 * Handles Linux-specific getUserMedia quirks
 */

import { t, type Lang } from './i18n';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface CameraCapture {
  stop: () => Promise<void>;
  type: 'webapi' | 'native';
}

export async function requestCameraAccess(
  constraints?: MediaStreamConstraints,
  lang: Lang = 'en'
): Promise<MediaStream> {
  const s = t(lang);
  
  // Default constraints optimized for ASCII art conversion
  const defaultConstraints: MediaStreamConstraints = {
    video: {
      // Идеальное высокое разрешение: браузер сам выберет максимальное доступное
      // аппаратное разрешение камеры без падений и ошибок
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: false
  };

  const finalConstraints = constraints || defaultConstraints;

  try {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(s.camErrorNotSupported || 'Browser API does not support camera access');
    }

    // Request permissions
    const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
    
    if (!stream) {
      throw new Error(s.camErrorNoStream || 'Failed to get camera stream');
    }

    return stream;
  } catch (err: any) {
    console.error('Camera access error:', err);
    
    // Provide user-friendly error messages
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error(s.camErrorNotAllowed || 'Camera access denied');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      throw new Error(s.camErrorNotFound || 'Camera not found');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      throw new Error(s.camErrorNotReadable || 'Camera is busy');
    } else if (err.name === 'OverconstrainedError') {
      throw new Error(s.camErrorOverConstrained || 'Camera constraints not supported');
    } else if (err.name === 'SecurityError') {
      throw new Error(s.camErrorSecurity || 'Security error');
    } else {
      throw new Error(`${s.camErrorGeneric || 'Camera error'}: ${err.message || err}`);
    }
  }
}

// Native camera fallback for Linux with base64 encoding
export async function requestNativeCameraAccess(
  targetWidth: number,
  targetHeight: number,
  onFrame: (imageData: ImageData) => void,
  lang: Lang = 'en',
  canProcessFrame?: () => boolean
): Promise<CameraCapture> {
  const s = t(lang);
  
  try {
    const available = await invoke<boolean>('is_native_camera_available');
    if (!available) {
      throw new Error('Native camera not available on this platform');
    }
    
    await invoke('start_native_camera', { deviceIndex: 0, targetWidth, targetHeight });
    
    const unlisten = await listen<{ data: string, width: number, height: number, encoding: string }>('camera-frame', async (event) => {
      // Если мы не можем обработать кадр сейчас (занят предыдущим), пропускаем тяжелое декодирование
      if (canProcessFrame && !canProcessFrame()) {
        return;
      }
      
      const { data, width, height, encoding } = event.payload;
      
      if (encoding === 'base64') {
        try {
          // Быстрое асинхронное декодирование base64 через fetch (намного быстрее чем atob + for loop)
          const response = await fetch(`data:application/octet-stream;base64,${data}`);
          const buffer = await response.arrayBuffer();
          const uint8Array = new Uint8ClampedArray(buffer);
          
          const imageData = new ImageData(uint8Array, width, height);
          onFrame(imageData);
        } catch (err) {
          console.error('Base64 decode error:', err);
        }
      } else {
        const uint8Array = new Uint8ClampedArray(data as any);
        const imageData = new ImageData(uint8Array, width, height);
        onFrame(imageData);
      }
    });
    
    return {
      type: 'native',
      stop: async () => {
        unlisten();
        await invoke('stop_native_camera');
      }
    };
  } catch (err: any) {
    throw new Error(`${s.camErrorGeneric || 'Camera error'}: ${err.message || err}`);
  }
}

export async function enumerateCameraDevices(): Promise<MediaDeviceInfo[]> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (err) {
    console.error('Error enumerating devices:', err);
    return [];
  }
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

