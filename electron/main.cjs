const { app, BrowserWindow, globalShortcut, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let isVisible = true;
let savedOpacity = 0.9;

// 判斷是否為開發環境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ============================================================
// 持久化設定檔 (視窗位置/大小、快捷鍵、透明度)
// ============================================================
const CONFIG_FILE = path.join(app.getPath('userData'), 'poe-helper-config.json');

function loadElectronConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
    } catch (e) { console.error('載入設定失敗:', e); }
    return {};
}

function saveElectronConfig(data) {
    try {
        const existing = loadElectronConfig();
        const merged = { ...existing, ...data };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    } catch (e) { console.error('儲存設定失敗:', e); }
}

// ============================================================
// 圖片持久化機制 (複製到 userData)
// ============================================================
const USER_IMAGES_DIR = path.join(app.getPath('userData'), 'user_images');
if (!fs.existsSync(USER_IMAGES_DIR)) {
    fs.mkdirSync(USER_IMAGES_DIR, { recursive: true });
}

function copyImageToUserData(sourcePath) {
    try {
        const ext = path.extname(sourcePath);
        const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
        const targetPath = path.join(USER_IMAGES_DIR, filename);
        fs.copyFileSync(sourcePath, targetPath);
        return `file:///${targetPath.replace(/\\/g, '/')}`;
    } catch (e) {
        console.error('複製圖片失敗:', e);
        return `file:///${sourcePath.replace(/\\/g, '/')}`; // Fallback to original path
    }
}

// ============================================================
// 獨立視窗狀態與設定
// ============================================================
const viewerWindows = {};
const viewerData = {};

function saveViewerBounds(id, bounds) {
    const data = loadElectronConfig();
    if (!data.viewerBounds) data.viewerBounds = {};
    data.viewerBounds[id] = bounds;
    saveElectronConfig({ viewerBounds: data.viewerBounds });
}

function getViewerBounds(id) {
    const data = loadElectronConfig();
    return data.viewerBounds?.[id] || { width: 800, height: 600, center: true };
}

// 載入設定
const config = loadElectronConfig();
savedOpacity = config.opacity ?? 0.9;

// 快捷鍵預設值
let hotkeys = config.hotkeys ?? {
    toggle: 'F10',
    cheatsheet: 'F9',
    regex: 'F8',
    timer: '',
    prevAct: '',
    nextAct: ''
};

// ============================================================
// 防抖儲存視窗位置/大小
// ============================================================
let saveBoundsTimer = null;
function debounceSaveBounds() {
    if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
    saveBoundsTimer = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const bounds = mainWindow.getBounds();
            saveElectronConfig({ bounds });
        }
    }, 500);
}

// ============================================================
// 註冊全域快捷鍵
// ============================================================
function registerHotkeys() {
    globalShortcut.unregisterAll();

    // 隱藏/顯示
    if (hotkeys.toggle) {
        try {
            globalShortcut.register(hotkeys.toggle, () => {
                if (!mainWindow) return;
                if (isVisible) {
                    mainWindow.setOpacity(0);
                    isVisible = false;
                } else {
                    mainWindow.setOpacity(savedOpacity);
                    isVisible = true;
                }
            });
        } catch (e) { console.error('註冊隱藏快捷鍵失敗:', e); }
    }

    // 速查表
    if (hotkeys.cheatsheet) {
        try {
            globalShortcut.register(hotkeys.cheatsheet, () => {
                if (!mainWindow) return;
                mainWindow.webContents.send('toggle-cheatsheet');
            });
        } catch (e) { console.error('註冊速查表快捷鍵失敗:', e); }
    }

    // Regex
    if (hotkeys.regex) {
        try {
            globalShortcut.register(hotkeys.regex, () => {
                if (!mainWindow) return;
                mainWindow.webContents.send('toggle-regex');
            });
        } catch (e) { console.error('註冊 Regex 快捷鍵失敗:', e); }
    }

    // 計時器 開始/暫停
    if (hotkeys.timer) {
        try {
            globalShortcut.register(hotkeys.timer, () => {
                if (!mainWindow) return;
                mainWindow.webContents.send('toggle-timer');
            });
        } catch (e) { console.error('註冊計時器快捷鍵失敗:', e); }
    }

    // 上一章
    if (hotkeys.prevAct) {
        try {
            globalShortcut.register(hotkeys.prevAct, () => {
                if (!mainWindow) return;
                mainWindow.webContents.send('prev-act');
            });
        } catch (e) { console.error('註冊上一章快捷鍵失敗:', e); }
    }

    // 下一章
    if (hotkeys.nextAct) {
        try {
            globalShortcut.register(hotkeys.nextAct, () => {
                if (!mainWindow) return;
                mainWindow.webContents.send('next-act');
            });
        } catch (e) { console.error('註冊下一章快捷鍵失敗:', e); }
    }
}

// ============================================================
// 建立視窗
// ============================================================
function createWindow() {
    // 從設定載入視窗位置/大小
    const savedBounds = config.bounds ?? {};
    const windowOptions = {
        width: savedBounds.width ?? 400,
        height: savedBounds.height ?? 780,
        minWidth: 300,
        minHeight: 200,
        alwaysOnTop: true,
        frame: false,
        opacity: savedOpacity,
        resizable: true,
        thickFrame: true,
        skipTaskbar: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        },
    };

    // 如果有儲存的位置，套用之
    if (savedBounds.x !== undefined && savedBounds.y !== undefined) {
        windowOptions.x = savedBounds.x;
        windowOptions.y = savedBounds.y;
    }

    mainWindow = new BrowserWindow(windowOptions);

    // 設定置頂層級為最高
    mainWindow.setAlwaysOnTop(true, 'screen-saver');

    // 開發模式或生產模式
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
    }

    // --- 註冊全域快捷鍵 ---
    registerHotkeys();

    // --- 監聽視窗移動/縮放，防抖儲存 ---
    mainWindow.on('resize', debounceSaveBounds);
    mainWindow.on('move', debounceSaveBounds);

    // --- IPC：設定透明度 ---
    ipcMain.on('set-opacity', (event, value) => {
        if (mainWindow && value >= 0.1 && value <= 1.0) {
            savedOpacity = value;
            saveElectronConfig({ opacity: value });
            if (isVisible) {
                mainWindow.setOpacity(value);
            }
        }
    });

    // --- IPC：關閉視窗 ---
    ipcMain.on('close-window', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) win.close();
    });

    // --- IPC：最小化 ---
    ipcMain.on('minimize-window', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) win.minimize();
    });

    // --- IPC: 獨立視窗 (Viewer) ---
    ipcMain.on('open-viewer', (event, { id, title, images, hotkeyLabel }) => {
        viewerData[id] = { images, hotkeyLabel };
        if (viewerWindows[id] && !viewerWindows[id].isDestroyed()) {
            viewerWindows[id].focus();
            viewerWindows[id].webContents.send('update-viewer-data', viewerData[id]);
            return;
        }

        const bounds = getViewerBounds(id);
        const winOpts = {
            width: bounds.width,
            height: bounds.height,
            title: title || 'PoE Helper Viewer',
            frame: false,
            backgroundColor: '#121212',
            webPreferences: {
                preload: path.join(__dirname, 'preload.cjs'),
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: false
            }
        };

        if (bounds.x !== undefined && bounds.y !== undefined) {
            winOpts.x = bounds.x;
            winOpts.y = bounds.y;
        } else {
            winOpts.center = true;
        }

        const win = new BrowserWindow(winOpts);
        win.setAlwaysOnTop(true, 'screen-saver'); // 跟主視窗一樣置頂

        const url = isDev
            ? `http://localhost:5173/#viewer?id=${id}`
            : `file://${path.join(__dirname, '..', 'build', 'index.html')}#viewer?id=${id}`;

        win.loadURL(url);

        win.webContents.once('did-finish-load', () => {
            win.webContents.send('update-viewer-data', viewerData[id]);
        });

        let debounceTimer;
        const saveBounds = () => {
            if (!win.isDestroyed()) saveViewerBounds(id, win.getBounds());
        };
        win.on('resize', () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(saveBounds, 500); });
        win.on('move', () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(saveBounds, 500); });
        win.on('closed', () => { delete viewerWindows[id]; });

        viewerWindows[id] = win;
    });

    ipcMain.on('close-viewer', (event, id) => {
        if (viewerWindows[id] && !viewerWindows[id].isDestroyed()) {
            viewerWindows[id].close();
        }
    });

    ipcMain.handle('is-viewer-open', (event, id) => {
        return !!(viewerWindows[id] && !viewerWindows[id].isDestroyed());
    });

    ipcMain.handle('get-viewer-data', (event, id) => {
        return viewerData[id] || { images: [], hotkeyLabel: '' };
    });

    ipcMain.on('update-viewer-data', (event, { id, data }) => {
        viewerData[id] = { ...viewerData[id], ...data };
        if (viewerWindows[id] && !viewerWindows[id].isDestroyed()) {
            viewerWindows[id].webContents.send('update-viewer-data', viewerData[id]);
        }
    });

    // --- IPC：取得透明度 ---
    ipcMain.handle('get-opacity', () => savedOpacity);

    // --- IPC：取得可見狀態 ---
    ipcMain.handle('get-visible', () => isVisible);

    // --- IPC：選單張圖片 (相容舊版) ---
    ipcMain.handle('select-image', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: '選擇速查表圖片',
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return copyImageToUserData(result.filePaths[0]);
        }
        return null;
    });

    // --- IPC：選多張圖片 ---
    ipcMain.handle('select-images', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: '選擇速查表圖片 (可多選)',
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths.map(p => copyImageToUserData(p));
        }
        return null;
    });

    // --- IPC：清理未使用的圖片 ---
    ipcMain.on('cleanup-images', (event, activeUrls) => {
        try {
            const activeFilenames = new Set(
                activeUrls
                    .filter(url => url.includes('/user_images/'))
                    .map(url => {
                        const parts = url.split('/');
                        return decodeURIComponent(parts[parts.length - 1]);
                    })
            );

            if (fs.existsSync(USER_IMAGES_DIR)) {
                const files = fs.readdirSync(USER_IMAGES_DIR);
                files.forEach(file => {
                    if (!activeFilenames.has(file)) {
                        try {
                            fs.unlinkSync(path.join(USER_IMAGES_DIR, file));
                        } catch (err) {
                            console.error(`刪除未使用圖片失敗 ${file}:`, err);
                        }
                    }
                });
            }
        } catch (e) {
            console.error('清理圖片時發生錯誤:', e);
        }
    });

    // --- IPC：開啟圖片目錄 ---
    ipcMain.on('open-images-folder', () => {
        if (fs.existsSync(USER_IMAGES_DIR)) {
            shell.openPath(USER_IMAGES_DIR);
        }
    });

    // --- IPC：取得快捷鍵設定 ---
    ipcMain.handle('get-hotkeys', () => hotkeys);

    // --- IPC：設定快捷鍵 ---
    ipcMain.handle('set-hotkeys', (event, newHotkeys) => {
        hotkeys = { ...hotkeys, ...newHotkeys };
        saveElectronConfig({ hotkeys });
        registerHotkeys();
        // 通知前端快捷鍵已更新
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('hotkeys-changed', hotkeys);
        }
        return hotkeys;
    });

    // --- 關閉時最終儲存 ---
    mainWindow.on('close', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const bounds = mainWindow.getBounds();
            saveElectronConfig({ bounds, opacity: savedOpacity });
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    // 檢查更新
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
});

// --- 自動更新事件 ---
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: '發現新版本',
        message: '發現新程式版本，正在背景下載更新...',
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: '更新準備就緒',
        message: '新版本已下載完成，是否立即重新啟動應用程式以套用更新？',
        buttons: ['立即重新啟動並安裝', '稍後']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

autoUpdater.on('error', (err) => {
    console.error('更新器發生錯誤:', err);
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
