# ASCII Art Studio

<div align="center">

```
 ╔═══════════════════════════════════════════════════════════════╗
 ║                                                               ║
 ║         Professional Desktop Application for ASCII Art        ║
 ║                                                               ║
 ║   Transform images and videos into stunning ASCII art with    ║
 ║      real-time webcam support and virtual camera features     ║
 ║                                                               ║
 ╚═══════════════════════════════════════════════════════════════╝
```

[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-2021-orange.svg)](https://www.rust-lang.org)

[English](#english) • [Русский](#русский)

</div>

---

<a name="english"></a>
## ► English

### ═══ Overview

ASCII Art Studio is a powerful desktop application that converts images, videos, and real-time webcam feeds into ASCII art. 
Built with modern technologies including Tauri, React, and Rust, it offers professional-grade features with exceptional performance.

### ═══ Key Features

```
┌─ Image Conversion      │ Transform any image into ASCII art with customizable parameters
├─ Video Processing      │ Convert entire videos frame-by-frame with preserved FPS
├─ Real-time Webcam      │ Live ASCII art rendering from your camera
├─ Virtual Camera        │ Stream ASCII art to other applications (OBS, Zoom, etc.)
├─ Multiple Palettes     │ 5 built-in palettes plus custom palette support
├─ Color Support         │ Full color ASCII art with RGB preservation
├─ Hardware Acceleration │ Optional GPU acceleration for better performance
├─ Fine-tuning Controls  │ Adjust brightness, contrast, gamma, and more
├─ Multilingual          │ Full support for English and Russian
├─ Export Options        │ Save as text, image, or video (MP4/GIF)
├─ Figlet Text           │ Generate ASCII text art with 50+ fonts
└─ Multiple Themes       │ Dark, Light, Matrix, Retro, Cyberpunk themes
```

### ═══ Technology Stack

**Frontend:**
- React 19.1 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Lucide React for icons

**Backend:**
- Rust with Tauri 2.0
- Image processing with `image` and `imageproc` crates
- Async runtime with Tokio
- Axum for HTTP server (virtual camera)
- V4L2 support for Linux cameras

### ═══ System Requirements

**All Platforms:**
- Node.js 18+ and npm
- Rust 1.70+ (installed automatically via Tauri)

**Windows:**
- Windows 10/11 (64-bit)
- WebView2 (usually pre-installed)

**Linux:**
- Ubuntu 20.04+ or equivalent
- GTK 3.24+
- WebKitGTK 2.40+
- v4l2loopback (for virtual camera)

**macOS:**
- macOS 10.15 (Catalina) or later

### ═══ Quick Start

#### ▸ Installation

```bash
# Clone the repository
git clone https://github.com/sosulacka/ASCII-ART-STUDIO-.git
cd ASCII-ART-STUDIO-

# Install dependencies
npm install
```

#### ▸ Development

```bash
# Run in development mode with hot reload
npm run dev
```

The application will open automatically. Changes to the frontend will hot-reload, Rust changes require restart.

#### ▸ Building

```bash
# Build production version
npm run build

# Build Tauri app for your platform
npm run tauri build
```

Built applications will be in `src-tauri/target/release/bundle/`

### ═══ Platform-Specific Setup

#### ▸ Windows

No additional setup required. The application works out of the box.

For virtual camera support, you can use the built-in HTTP streaming server that works with OBS Studio as a Browser Source.

#### ▸ Linux

For native camera support:
```bash
sudo apt-get install libv4l-dev v4l-utils
```

For virtual camera (v4l2loopback):
```bash
# Install v4l2loopback
sudo apt-get install v4l2loopback-dkms

# Load the module
sudo modprobe v4l2loopback devices=1 video_nr=10 card_label="ASCII Art Camera"

# Make it persistent
echo "v4l2loopback" | sudo tee /etc/modules-load.d/v4l2loopback.conf
echo "options v4l2loopback devices=1 video_nr=10 card_label='ASCII Art Camera'" | sudo tee /etc/modprobe.d/v4l2loopback.conf
```

For GTK/WebKitGTK:
```bash
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev
```

#### ▸ macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Dependencies are managed by Homebrew (optional)
brew install pkg-config
```

### ═══ Usage Guide

#### ▸ Image Processing
1. Click **"Open Image"** or drag & drop an image
2. Adjust settings: width, palette, brightness, contrast, gamma
3. Preview the result in real-time
4. Export as text, PNG, or copy to clipboard

#### ▸ Video Processing
1. Click **"Open Video"**
2. Configure quality settings
3. Process video (may take time depending on length)
4. Play back with controls
5. Export as MP4 or GIF

#### ▸ Webcam Mode
1. Click **"Start Camera"**
2. Real-time ASCII art preview
3. Optionally start **Virtual Camera** to stream to other apps
4. Virtual camera available at `http://localhost:8765/stream`

#### ▸ Virtual Camera Integration
- **OBS Studio**: Add Browser Source → `http://localhost:8765/stream`
- **VLC**: Media → Open Network Stream → `http://localhost:8765/stream`
- **Zoom/Discord**: Use OBS Virtual Camera with the browser source

### ═══ Customization

#### ▸ Custom Palettes
Create your own ASCII palettes in Settings:
- Characters sorted from darkest to brightest
- Example: ` .:-=+*#%@` (simple) or full extended ASCII

#### ▸ Themes
Switch between themes in Settings:
- **Dark**: Modern dark interface
- **Light**: Clean light interface
- **Retro**: Amber CRT terminal style
- And many others

### ═══ Troubleshooting

**Camera not detected (Windows):**
- Check camera permissions in Windows Settings
- Ensure no other application is using the camera

**Virtual camera not working (Linux):**
- Verify v4l2loopback is loaded: `lsmod | grep v4l2loopback`
- Check /dev/video devices: `ls /dev/video*`

**Build errors:**
- Clear cache: `rm -rf node_modules target` and reinstall
- Update Rust: `rustup update`
- Update Node: Use Node 18 LTS or later

**Performance issues:**
- Enable hardware acceleration in Settings
- Reduce resolution/width for faster processing
- Close other heavy applications

### ═══ License

This project is open source. See LICENSE file for details.

### ═══ Author

**Discord**: @syswow64deleted

Feel free to reach out for questions, suggestions, or collaboration.

### ═══ Acknowledgments

Built with:
- [Tauri](https://tauri.app) - Desktop app framework
- [React](https://reactjs.org) - UI library
- [Rust](https://www.rust-lang.org) - Systems programming language
- [image-rs](https://github.com/image-rs/image) - Image processing


---

<a name="русский"></a>
## ► Русский

### ═══ Обзор

ASCII Art Studio — это мощное десктопное приложение, которое конвертирует изображения, видео и данные с веб-камеры в ASCII-арт в реальном времени. 
Построено на современных технологиях: Tauri, React и Rust, предлагает профессиональные функции с исключительной производительностью.

### ═══ Ключевые возможности

```
┌─ Конвертация изображений    │ Превращайте любое изображение в ASCII-арт
├─ Обработка видео            │ Конвертируйте целые видео покадрово с сохранением FPS
├─ Веб-камера в реальном времени │ Живой рендеринг ASCII-арта с вашей камеры
├─ Виртуальная камера         │ Транслируйте ASCII-арт в другие приложения (OBS, Zoom)
├─ Множество палитр           │ 5 встроенных палитр плюс пользовательские
├─ Цветная поддержка          │ Полноцветный ASCII-арт с сохранением RGB
├─ Аппаратное ускорение       │ Опциональное GPU-ускорение для лучшей производительности
├─ Точная настройка           │ Регулируйте яркость, контраст, гамму и многое другое
├─ Мультиязычность            │ Полная поддержка английского и русского языков
├─ Опции экспорта             │ Сохранение как текст, изображение или видео (MP4/GIF)
├─ Figlet текст               │ Генерируйте ASCII текст-арт с более чем 50 шрифтами
└─ Множество тем              │ Темная, Светлая, Matrix, Ретро, Киберпанк темы
```

### ═══ Технологический стек

**Фронтенд:**
- React 19.1 с TypeScript
- Vite для быстрой разработки
- Tailwind CSS для стилизации
- Lucide React для иконок

**Бэкенд:**
- Rust с Tauri 2.0
- Обработка изображений с `image` и `imageproc`
- Асинхронный runtime с Tokio
- Axum для HTTP сервера (виртуальная камера)
- Поддержка V4L2 для Linux камер


### ═══ Системные требования

**Все платформы:**
- Node.js 18+ и npm
- Rust 1.70+ (устанавливается автоматически через Tauri)

**Windows:**
- Windows 10/11 (64-bit)
- WebView2 (обычно предустановлен)

**Linux:**
- Ubuntu 20.04+ или эквивалент
- GTK 3.24+
- WebKitGTK 2.40+
- v4l2loopback (для виртуальной камеры)

**macOS:**
- macOS 10.15 (Catalina) или новее

### ═══ Быстрый старт

#### ▸ Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/sosulacka/ASCII-ART-STUDIO-.git
cd ASCII-ART-STUDIO-

# Установите зависимости
npm install
```

#### ▸ Разработка

```bash
# Запустите в режиме разработки с hot reload
npm run dev
```

Приложение откроется автоматически. Изменения во фронтенде обновятся автоматически, изменения в Rust требуют перезапуска.

#### ▸ Сборка

```bash
# Соберите production версию
npm run build

# Соберите Tauri приложение для вашей платформы
npm run tauri build
```

Собранные приложения будут в `src-tauri/target/release/bundle/`

### ═══ Настройка для конкретных платформ

#### ▸ Windows

Дополнительная настройка не требуется. Приложение работает сразу после установки.

Для поддержки виртуальной камеры используется встроенный HTTP-сервер потоковой передачи, который работает с OBS Studio как Browser Source.

#### ▸ Linux

Для поддержки нативной камеры:
```bash
sudo apt-get install libv4l-dev v4l-utils
```

Для виртуальной камеры (v4l2loopback):
```bash
# Установите v4l2loopback
sudo apt-get install v4l2loopback-dkms

# Загрузите модуль
sudo modprobe v4l2loopback devices=1 video_nr=10 card_label="ASCII Art Camera"

# Сделайте это постоянным
echo "v4l2loopback" | sudo tee /etc/modules-load.d/v4l2loopback.conf
echo "options v4l2loopback devices=1 video_nr=10 card_label='ASCII Art Camera'" | sudo tee /etc/modprobe.d/v4l2loopback.conf
```

Для GTK/WebKitGTK:
```bash
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev
```

#### ▸ macOS

```bash
# Установите Xcode Command Line Tools
xcode-select --install

# Зависимости управляются через Homebrew (опционально)
brew install pkg-config
```

### ═══ Руководство по использованию

#### ▸ Обработка изображений
1. Нажмите **"Открыть изображение"** или перетащите изображение
2. Настройте параметры: ширину, палитру, яркость, контраст, гамму
3. Просмотрите результат в реальном времени
4. Экспортируйте как текст, PNG или скопируйте в буфер обмена

#### ▸ Обработка видео
1. Нажмите **"Открыть видео"**
2. Настройте параметры качества
3. Обработайте видео (может занять время в зависимости от длины)
4. Воспроизведите с элементами управления
5. Экспортируйте как MP4 или GIF

#### ▸ Режим веб-камеры
1. Нажмите **"Запустить камеру"**
2. Предварительный просмотр ASCII-арта в реальном времени
3. Опционально запустите **Виртуальную камеру** для трансляции в другие приложения
4. Виртуальная камера доступна по адресу `http://localhost:8765/stream`

#### ▸ Интеграция виртуальной камеры
- **OBS Studio**: Добавьте Browser Source → `http://localhost:8765/stream`
- **VLC**: Медиа → Открыть сетевой поток → `http://localhost:8765/stream`
- **Zoom/Discord**: Используйте OBS Virtual Camera с browser source


### ═══ Кастомизация

#### ▸ Пользовательские палитры
Создавайте свои ASCII-палитры в Настройках:
- Символы отсортированы от самого темного к самому светлому
- Пример: ` .:-=+*#%@` (простая) или полная расширенная ASCII

#### ▸ Темы
Переключайтесь между темами в Настройках:
- **Темная**: Современный темный интерфейс
- **Светлая**: Чистый светлый интерфейс
- **Ретро**: Янтарный стиль CRT-терминала
- И многие д ругие

### ═══ Устранение неполадок

**Камера не обнаружена (Windows):**
- Проверьте разрешения камеры в настройках Windows
- Убедитесь, что никакое другое приложение не использует камеру

**Виртуальная камера не работает (Linux):**
- Проверьте, загружен ли v4l2loopback: `lsmod | grep v4l2loopback`
- Проверьте устройства /dev/video: `ls /dev/video*`

**Ошибки сборки:**
- Очистите кэш: `rm -rf node_modules target` и переустановите
- Обновите Rust: `rustup update`
- Обновите Node: Используйте Node 18 LTS или новее

**Проблемы с производительностью:**
- Включите аппаратное ускорение в Настройках
- Уменьшите разрешение/ширину для более быстрой обработки
- Закройте другие тяжелые приложения


### ═══ Лицензия

Этот проект с открытым исходным кодом. См. файл LICENSE для деталей.

### ═══ Автор

**Discord**: @syswow64deleted

Не стесняйтесь обращаться по вопросам, предложениям или для сотрудничества.

### ═══ Благодарности

Создано с использованием:
- [Tauri](https://tauri.app) - Фреймворк для десктопных приложений
- [React](https://reactjs.org) - UI библиотека
- [Rust](https://www.rust-lang.org) - Язык системного программирования
- [image-rs](https://github.com/image-rs/image) - Обработка изображений

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    Made with code in 2026                     ║
║                                                               ║
║            ASCII Art Studio - Where pixels meet characters   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

</div>
