const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 Electron API 給前端
contextBridge.exposeInMainWorld('electronAPI', {
    // 設定視窗透明度 (0.1 ~ 1.0)
    setOpacity: (value) => ipcRenderer.send('set-opacity', value),
    // 關閉視窗
    closeWindow: () => ipcRenderer.send('close-window'),
    // 最小化視窗
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    // 取得目前透明度
    getOpacity: () => ipcRenderer.invoke('get-opacity'),
    // 取得目前可見狀態
    getVisible: () => ipcRenderer.invoke('get-visible'),
    // 判斷是否在 Electron 環境
    isElectron: true,

    // --- 圖片選擇與清理 ---
    // 選擇單張速查表圖片 (相容)
    selectImage: () => ipcRenderer.invoke('select-image'),
    // 選擇多張速查表圖片
    selectImages: () => ipcRenderer.invoke('select-images'),
    // 清理未使用的圖片
    cleanupImages: (activeUrls) => ipcRenderer.send('cleanup-images', activeUrls),
    // 開啟圖片資料夾
    openImagesFolder: () => ipcRenderer.send('open-images-folder'),

    // --- 快捷鍵 ---
    // 取得快捷鍵設定
    getHotkeys: () => ipcRenderer.invoke('get-hotkeys'),
    // 設定快捷鍵
    setHotkeys: (hotkeys) => ipcRenderer.invoke('set-hotkeys', hotkeys),
    // 監聽快捷鍵變更
    onHotkeysChanged: (callback) => ipcRenderer.on('hotkeys-changed', (event, ...args) => callback(...args)),
    offHotkeysChanged: () => ipcRenderer.removeAllListeners('hotkeys-changed'),

    // --- 速查表熱鍵事件 ---
    onToggleCheatsheet: (callback) => ipcRenderer.on('toggle-cheatsheet', (event, ...args) => callback(...args)),
    offToggleCheatsheet: () => ipcRenderer.removeAllListeners('toggle-cheatsheet'),

    // --- Vendor Regex 熱鍵事件 ---
    onToggleRegex: (callback) => ipcRenderer.on('toggle-regex', (event, ...args) => callback(...args)),
    offToggleRegex: () => ipcRenderer.removeAllListeners('toggle-regex'),

    // --- 新增熱鍵事件 ---
    onToggleTimer: (callback) => ipcRenderer.on('toggle-timer', (event, ...args) => callback(...args)),
    offToggleTimer: () => ipcRenderer.removeAllListeners('toggle-timer'),
    onPrevAct: (callback) => ipcRenderer.on('prev-act', (event, ...args) => callback(...args)),
    offPrevAct: () => ipcRenderer.removeAllListeners('prev-act'),
    onNextAct: (callback) => ipcRenderer.on('next-act', (event, ...args) => callback(...args)),
    offNextAct: () => ipcRenderer.removeAllListeners('next-act'),

    // --- Viewer Windows ---
    openViewer: (options) => ipcRenderer.send('open-viewer', options),
    closeViewer: (id) => ipcRenderer.send('close-viewer', id),
    isViewerOpen: (id) => ipcRenderer.invoke('is-viewer-open', id),
    getViewerData: (id) => ipcRenderer.invoke('get-viewer-data', id),
    updateViewerData: (id, data) => ipcRenderer.send('update-viewer-data', { id, data }),
    onUpdateViewerData: (callback) => ipcRenderer.on('update-viewer-data', (event, data) => callback(data)),
    offUpdateViewerData: () => ipcRenderer.removeAllListeners('update-viewer-data'),
});
