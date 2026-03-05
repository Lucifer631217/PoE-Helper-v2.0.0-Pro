import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    RotateCcw,
    Check,
    Settings,
    Eye,
    EyeOff,
    Sword,
    X,
    Minus,
    GripVertical,
    Sun,
    Moon,
    Type,
    FileEdit,
    Save,
    Undo2,
    Image as ImageIcon,
    Search,
    Plus,
    Trash2,
    Copy,
    Keyboard,
    Timer,
    ListChecks,
    Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const isElectron = !!(window.electronAPI && window.electronAPI.isElectron);

// ============================================================
// 預設攻略資料
// ============================================================
const DEFAULT_GUIDE = {
    "第一章：獅眼守望": [
        "● 絕望岩灘：殺死希拉克進城",
        "● 暮光海灘：踩點 -> 炙熱鹽沼 (打破三個鳥蛋)",
        "● 海潮地穴：踩點 -> 回暮光海灘 -> 海潮孤島",
        "● 海潮孤島：殺酷寒之使拿醫藥箱 (回城領跑速水)",
        "● 水聲之淵：殺死深淵巨蟹 (天賦點)",
        "● 禁靈之獄下層：完成迷宮試煉①",
        "● 禁靈之獄上層：殺死典獄長布魯圖斯",
        "● 魅影船墓：找不滅之火 -> 殺費爾船長 (天賦點)",
        "● 怨忿之窟深處：擊殺莫薇兒 (進第二章)"
    ],
    "第二章：森林營地": [
        "● 獸穴：殺死白色巨獸 (領第二支水)",
        "● 罪孽之殿第二層：完成試煉② -> 拿寶石",
        "● 靜謐陵墓：完成試煉③ -> 拿黃金之手 (天賦點)",
        "● 西部密林：殺巨蛛之母 -> 殺阿特力隊長 (天賦點)",
        "● 盜賊任務：殺或幫阿莉雅/克雷頓/歐克 (天賦獎勵)",
        "● 濕地：殺歐克 -> 移除樹根 -> 瓦爾廢墟",
        "● 北部密林：踩點 -> 瀑布洞穴 (拿跑速工藝)",
        "● 古金字塔：擊殺瓦爾超靈 (進第三章)"
    ],
    "第三章：薩恩營地": [
        "● 火葬場：完成試煉④ -> 擊敗派蒂拿手鐲 (防禦工藝)",
        "● 下水道：收集 3 個半身像 (天賦點)",
        "● 市集地帶：黑石陵寢完成試煉⑤ (元素攻擊工藝)",
        "● 激戰廣場：拿絲帶線軸 -> 不朽海港拿亞硫酸",
        "● 日耀神殿：與達拉對話拿煉獄之粉 (火傷工藝)",
        "● 月影神殿：擊退派蒂拿神塔之鑰 (電傷工藝)",
        "● 皇家花園：完成試煉⑥ -> 拿全能力工藝",
        "● 圖書館：找四張書頁 (解鎖寶石購買)",
        "● 塔頂：擊殺神主 (進第四章)"
    ],
    "第四章：統治者之殿": [
        "● 乾凅湖岸：擊殺福爾 (拿紅旗)",
        "● 漆黑礦坑：釋放迪虛瑞特精神 (天賦點)",
        "● 水晶礦脈：踩點 (拿冰傷工藝)",
        "● 岡姆的堡壘：擊殺岡姆拿憤怒之眼 (連線工藝)",
        "● 大競技場：擊殺德拉索拿慾望之眼 (插槽工藝)",
        "● 獸腹：擊殺派蒂 (元素抗性工藝)",
        "● 育靈之室：殺德瑞/馬雷葛羅/薛朗",
        "● 黑靈核心：擊殺馬拉凱 (進第五章)"
    ],
    "第五章：監守高塔": [
        "● 鎮壓地帶：拿探測棒 -> 殺判官卡斯蒂克斯",
        "● 無罪之室：擊殺聖宗與善",
        "● 葬骨禮堂：拿純淨之印 (天賦點/工藝)",
        "● 聖物間：拿齊三個聖物 (天賦點)",
        "● 聖堂屋頂：擊殺奇塔弗 (抗性 -30%)"
    ],
    "第六章：獅眼守望 (重返)": [
        "● 絕望岩灘：全清圖 (解鎖莉莉全寶石)",
        "● 炙熱鹽沼：擊殺拜恥女王 (拿征服之眼)",
        "● 卡魯堡壘：擊殺圖克瑪哈 (天賦點/工藝)",
        "● 禁靈之獄：完成試煉⑦ -> 殺薜朗",
        "● 災變峽谷：擊殺艾貝拉斯 (天賦點)",
        "● 濕地：擊殺傀儡女王瑞斯拉薩 (天賦點)",
        "● 絕望烽塔：點火送黑旗 (工藝)",
        "● 海洋王座：擊殺海洋王 (進第七章)"
    ],
    "第七章：橋墩營地": [
        "● 靜謐陵墓：完成試煉⑧ -> 拿馬雷葛羅的地圖",
        "● 罪孽之殿：放入地圖進書房 -> 殺馬雷葛羅拿毒液",
        "● 罪孽之殿第二層：完成試煉⑨",
        "● 絕望之巢：擊殺葛魯斯寇 (天賦點)",
        "● 驚魂樹洞：抓 7 隻螢火蟲",
        "● 堤道：拿奇夏拉之星 (天賦點/工藝)",
        "● 艾爾卡莉之網：擊殺艾爾卡莉 (進第八章)"
    ],
    "第八章：薩恩營地 (重返)": [
        "● 德瑞的腐化池：擊殺德瑞",
        "● 甦醒奇點：擊殺托爾曼 (天賦點)",
        "● 糧儲關口：擊殺古靈軍團 (天賦點)",
        "● 日耀神殿：擊殺諸神晨曦 (日耀之石/工藝)",
        "● 月耀神殿：擊殺諸神黃昏 (月影之石/工藝)",
        "● 大浴場：完成試煉⑩ (工藝)",
        "● 恐懼之沼：擊殺伊果 (天賦點)",
        "● 天壇：擊殺日耀與月影雙神 (進第九章)"
    ],
    "第九章：統治者之殿 (重返)": [
        "● 瓦斯堤里荒漠：找風暴之刃 (工藝)",
        "● 沸騰湖泊：殺巨蜥拿蜥毒 (工藝)",
        "● 沙瀑流坑：擊殺夏卡莉女神 (天賦點)",
        "● 隧道遺跡：完成試煉⑪ (工藝)",
        "● 颶風神殿：擊殺卡洛翰 (天賦點)",
        "● 煉油廠：殺艾達將軍拿查爾森之粉",
        "● 黑靈之核：擊殺墮道三巨頭 (進第十章)"
    ],
    "第十章：奧瑞亞的碼頭": [
        "● 聖堂屋頂：救班恩",
        "● 葬骨禮堂：完成試煉⑫ (天賦點/工藝)",
        "● 鎮壓地帶：擊殺范尼達 (天賦點)",
        "● 褻瀆之室：擊殺伊爾莉斯 (純淨之杖/工藝)",
        "● 祭壇：擊殺奇塔弗 (抗性再 -30%)",
        "※ 終章提醒：打 /passives 確認 24 點天賦是否拿齊！"
    ]
};

// ============================================================
// LocalStorage
// ============================================================
const STORAGE_KEY = 'poe_helper_config';
const GUIDE_KEY = 'poe_helper_guide';
function loadConfig() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch (e) { } return null; }
function saveConfig(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { } }
function loadGuide() { try { const r = localStorage.getItem(GUIDE_KEY); if (r) return JSON.parse(r); } catch (e) { } return null; }
function saveGuide(d) { try { localStorage.setItem(GUIDE_KEY, JSON.stringify(d)); } catch (e) { } }

// ============================================================
// Toast
// ============================================================
const Toast = ({ message, visible }) => (
    <AnimatePresence>
        {visible && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#323232] text-white px-5 py-2 rounded-full shadow-lg text-xs font-medium z-[60]">
                {message}
            </motion.div>
        )}
    </AnimatePresence>
);

// ============================================================
// 攻略編輯器 Modal
// ============================================================
// ============================================================
// Vendor Regex 視窗
// ============================================================
const RegexModal = ({ regexes, setRegexes, onClose, dark, toast }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleCopy = (r) => {
        if (!r.regex) return;
        navigator.clipboard.writeText(r.regex).then(() => {
            toast(`已複製：${r.name}`);
            onClose();
        });
    };

    const handleAdd = () => setRegexes([...regexes, { id: Date.now(), name: '新標籤', regex: '' }]);
    const handleUpdate = (id, k, v) => setRegexes(regexes.map(r => r.id === id ? { ...r, [k]: v } : r));
    const handleRemove = (id) => setRegexes(regexes.filter(r => r.id !== id));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={cn("w-full max-w-sm max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden",
                    dark ? "bg-[#292a2d] text-gray-200 border border-gray-700" : "bg-white text-[#3c4043] border border-gray-200"
                )}
            >
                {/* 標題 */}
                <div className={cn("px-5 py-4 flex items-center justify-between border-b shrink-0", dark ? "border-gray-700 bg-[#323336]" : "bg-gray-50 border-gray-200")}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Search size={16} />
                        </div>
                        <div>
                            <span className="text-sm font-bold block">Regex</span>
                            <p className="text-[10px] text-gray-500 font-medium">點擊標籤即可自動複製字串</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"><X size={18} /></button>
                </div>

                {/* 列表 */}
                <div className={cn("flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar", dark ? "bg-[#202124]" : "bg-[#f8f9fa]")}>
                    {regexes.length === 0 && (
                        <div className="text-center py-6 text-xs text-gray-500">目前沒有設定任何 Regex</div>
                    )}
                    {regexes.map(r => (
                        <div key={r.id} className={cn("flex items-center gap-2 p-2 rounded-xl border transition-all", dark ? "bg-[#292a2d] border-gray-700" : "bg-white border-gray-200 shadow-sm")}>
                            {isEditing ? (
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <input value={r.name} onChange={e => handleUpdate(r.id, 'name', e.target.value)} placeholder="標籤名稱" className={cn("text-xs px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", dark ? "bg-white/5 text-gray-200 border border-white/10" : "bg-black/5 text-gray-800 border-none")} />
                                    <input value={r.regex} onChange={e => handleUpdate(r.id, 'regex', e.target.value)} placeholder="Regex 字串" className={cn("text-[10px] font-mono px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500", dark ? "bg-white/5 text-gray-400 border border-white/10" : "bg-black/5 text-gray-500 border-none")} />
                                </div>
                            ) : (
                                <button onClick={() => handleCopy(r)} className="flex-1 flex items-center justify-between text-left px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors group">
                                    <span className="text-xs font-bold">{r.name}</span>
                                    <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                </button>
                            )}
                            {isEditing && (
                                <button onClick={() => handleRemove(r.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            )}
                        </div>
                    ))}
                    {isEditing && (
                        <button onClick={handleAdd} className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-blue-500 hover:bg-blue-500/10 rounded-xl border border-dashed border-blue-500/30 transition-colors">
                            <Plus size={14} /> 新增 Regex
                        </button>
                    )}
                </div>

                {/* 底部 */}
                <div className={cn("px-5 py-3 flex items-center justify-between border-t shrink-0 select-none", dark ? "border-gray-700 bg-[#323336]" : "border-gray-200 bg-gray-50")}>
                    <button onClick={() => setIsEditing(!isEditing)} className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border", isEditing ? (dark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-50 text-blue-600 border-blue-200") : (dark ? "text-gray-400 border-transparent hover:bg-gray-700" : "text-gray-600 border-transparent hover:bg-gray-200"))}>
                        {isEditing ? <Check size={14} /> : <FileEdit size={14} />} {isEditing ? '完成編輯' : '編輯列表'}
                    </button>
                    {!isEditing && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded text-[10px] font-bold border border-indigo-500/20">
                            <kbd>F8</kbd> 快捷鍵
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============================================================
// 速查表視窗 (Cheatsheet)
// ============================================================
const CheatsheetViewer = ({ images, onClose, hotkeyLabel }) => {
    const [scale, setScale] = useState(1);
    const [currentIdx, setCurrentIdx] = useState(0);

    const handleWheel = (e) => {
        setScale(s => Math.min(Math.max(0.1, s - e.deltaY * 0.0015), 10));
    };

    const srcs = Array.isArray(images) ? images : (images ? [images] : []);
    if (srcs.length === 0) return null;
    const currentSrc = srcs[Math.min(currentIdx, srcs.length - 1)];

    const prevImg = () => { setCurrentIdx(i => (i - 1 + srcs.length) % srcs.length); setScale(1); };
    const nextImg = () => { setCurrentIdx(i => (i + 1) % srcs.length); setScale(1); };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#121212] flex flex-col overflow-hidden"
            onWheel={handleWheel}
        >
            <div className="h-8 bg-black/40 flex items-center justify-between px-3 shrink-0 select-none border-b border-white/10" style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold border border-blue-500/30">
                        <kbd>{hotkeyLabel || 'F9'}</kbd> 隱藏
                    </div>
                    {srcs.length > 1 && (
                        <div className="flex items-center gap-1">
                            <button onClick={prevImg} className="p-1 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors"><ChevronLeft size={12} /></button>
                            <span className="text-gray-400 text-[10px] font-bold min-w-[32px] text-center">{currentIdx + 1}/{srcs.length}</span>
                            <button onClick={nextImg} className="p-1 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors"><ChevronRight size={12} /></button>
                        </div>
                    )}
                    <span className="text-gray-400 text-[10px] font-medium hidden sm:inline">縮放: {Math.round(scale * 100)}% (滾輪) · 拖曳平移</span>
                    <button onClick={() => setScale(1)} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors">100%</button>
                    <button onClick={() => setScale(s => s * 0.5)} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors">50%</button>
                </div>
                <button onClick={onClose} style={{ WebkitAppRegion: 'no-drag' }} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-red-500/80 transition-colors">
                    <X size={14} />
                </button>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0iIzMzMyI+PC9jaXJjbGU+Cjwvc3ZnPg==')]" style={{ WebkitAppRegion: 'no-drag' }}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentSrc}
                        src={currentSrc}
                        drag
                        style={{ scale }}
                        className="max-w-none max-h-none origin-center cursor-move"
                        draggable={false}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    />
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const GuideEditor = ({ guideData, onSave, onClose, onReset, dark }) => {
    // 將 guide 物件轉為可編輯的文字格式
    const guideToText = (guide) => {
        return Object.entries(guide).map(([chapter, tasks]) => {
            return `## ${chapter}\n${tasks.join('\n')}`;
        }).join('\n\n');
    };

    const textToGuide = (text) => {
        const guide = {};
        const chapters = text.split(/^## /m).filter(Boolean);
        for (const ch of chapters) {
            const lines = ch.trim().split('\n');
            const title = lines[0].trim();
            const tasks = lines.slice(1).map(l => l.trim()).filter(Boolean);
            if (title && tasks.length > 0) guide[title] = tasks;
        }
        return guide;
    };

    const [text, setText] = useState(guideToText(guideData));
    const [error, setError] = useState('');

    const handleSave = () => {
        try {
            const parsed = textToGuide(text);
            const keys = Object.keys(parsed);
            if (keys.length === 0) { setError('至少需要一個章節'); return; }
            onSave(parsed);
        } catch (e) { setError('格式錯誤，請檢查'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={cn("w-full h-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden",
                    dark ? "bg-[#292a2d] text-gray-200 border border-gray-700" : "bg-white text-[#3c4043] border border-gray-200"
                )}
            >
                {/* 編輯器標題 */}
                <div className={cn("px-5 py-4 flex items-center justify-between border-b shrink-0", dark ? "border-gray-700 bg-[#323336]" : "bg-gray-50 border-gray-200")}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FileEdit size={18} />
                        </div>
                        <div>
                            <span className="text-sm font-bold block">自定義攻略內容</span>
                            <p className="text-[10px] text-gray-500 font-medium">修改後點擊儲存即可套用</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"><X size={18} /></button>
                </div>

                {/* 格式說明 */}
                <div className={cn("px-5 py-2.5 text-[11px] shrink-0 border-b flex items-center gap-2", dark ? "bg-[#1e1f22] text-gray-400 border-gray-700" : "bg-blue-50/30 text-blue-600 border-blue-100/50")}>
                    <span className="font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-[4px] text-[9px]">TIPS</span>
                    <span>格式：使用 <code className="bg-blue-500/10 px-1 rounded font-mono">## 章節名稱</code> 作為標題，下方每行輸入一個任務內容。</span>
                </div>

                {/* 編輯區 */}
                <div className="flex-1 overflow-hidden p-1 relative flex flex-col">
                    <textarea
                        value={text} onChange={e => { setText(e.target.value); setError(''); }}
                        className={cn("w-full flex-1 px-5 py-4 text-[13px] font-mono resize-y outline-none leading-relaxed custom-scrollbar min-h-[300px] caret-blue-500 focus:ring-1 focus:ring-blue-500/20",
                            dark ? "bg-[#1e1f22] text-gray-300 placeholder-gray-600 border-gray-700" : "bg-white text-[#3c4043] placeholder-gray-400 border-gray-100"
                        )}
                        placeholder="## 第一章：獅眼守望&#10;● 任務內容一&#10;● 任務內容二"
                        spellCheck={false}
                        autoFocus
                    />
                </div>

                {/* 錯誤提示 */}
                {error && <div className="px-5 py-2 text-xs text-red-500 bg-red-50/50 border-t border-red-100 font-medium shrink-0">{error}</div>}

                {/* 底部按鈕 */}
                <div className={cn("px-5 py-4 flex items-center justify-between border-t shrink-0 bg-gray-50/30", dark ? "border-gray-700" : "border-gray-200")}>
                    <button onClick={onReset}
                        className={cn("flex items-center gap-2 px-4 py-2 text-xs rounded-xl transition-all active:scale-95 border border-transparent hover:border-gray-200 shadow-sm",
                            dark ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" : "text-[#5f6368] hover:bg-gray-100"
                        )}>
                        <Undo2 size={14} /><span>還原預設</span>
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className={cn("px-5 py-2 text-xs rounded-xl transition-all",
                                dark ? "text-gray-400 hover:bg-gray-700" : "text-[#5f6368] hover:bg-gray-100"
                            )}>取消</button>
                        <button onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 text-xs text-white bg-[#1a73e8] hover:bg-[#1765cc] rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                            <Save size={14} /><span>儲存攻略</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};


// ============================================================
// 快捷鍵設定 Modal
// ============================================================
const HOTKEY_LABELS = {
    toggle: '隱藏/顯示',
    cheatsheet: '速查表',
    regex: 'Regex',
};

const HotkeySettingsModal = ({ hotkeys, onSave, onClose, dark }) => {
    const [draft, setDraft] = useState({ ...hotkeys });
    const [recording, setRecording] = useState(null); // which key is being recorded

    useEffect(() => {
        if (!recording) return;
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
            setDraft(prev => ({ ...prev, [recording]: key }));
            setRecording(null);
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [recording]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={cn("w-full max-w-xs rounded-2xl shadow-2xl flex flex-col overflow-hidden",
                    dark ? "bg-[#292a2d] text-gray-200 border border-gray-700" : "bg-white text-[#3c4043] border border-gray-200"
                )}
            >
                {/* 標題 */}
                <div className={cn("px-5 py-4 flex items-center justify-between border-b shrink-0", dark ? "border-gray-700 bg-[#323336]" : "bg-gray-50 border-gray-200")}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Keyboard size={16} />
                        </div>
                        <div>
                            <span className="text-sm font-bold block">自定義快捷鍵</span>
                            <p className="text-[10px] text-gray-500 font-medium">點擊「錄入」後按下想設定的按鍵</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"><X size={18} /></button>
                </div>

                {/* 快捷鍵列表 */}
                <div className={cn("px-4 py-3 space-y-2", dark ? "bg-[#202124]" : "bg-[#f8f9fa]")}>
                    {Object.entries(HOTKEY_LABELS).map(([key, label]) => (
                        <div key={key} className={cn("flex items-center justify-between p-3 rounded-xl border", dark ? "bg-[#292a2d] border-gray-700" : "bg-white border-gray-200 shadow-sm")}>
                            <span className="text-xs font-bold">{label}</span>
                            <div className="flex items-center gap-2">
                                <kbd className={cn("text-xs px-2.5 py-1 rounded-lg font-mono font-bold min-w-[40px] text-center",
                                    recording === key
                                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse"
                                        : dark ? "bg-gray-700 text-gray-300 border border-gray-600" : "bg-gray-100 text-gray-700 border border-gray-200"
                                )}>
                                    {recording === key ? '...' : draft[key]}
                                </kbd>
                                <button onClick={() => setRecording(recording === key ? null : key)}
                                    className={cn("text-[10px] px-2 py-1 rounded-lg font-medium transition-all active:scale-95",
                                        recording === key
                                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                    )}>
                                    {recording === key ? '取消' : '錄入'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 底部 */}
                <div className={cn("px-5 py-3 flex items-center justify-end gap-3 border-t shrink-0", dark ? "border-gray-700 bg-[#323336]" : "border-gray-200 bg-gray-50")}>
                    <button onClick={onClose} className={cn("px-4 py-2 text-xs rounded-xl transition-all", dark ? "text-gray-400 hover:bg-gray-700" : "text-[#5f6368] hover:bg-gray-100")}>取消</button>
                    <button onClick={() => onSave(draft)} className="flex items-center gap-2 px-5 py-2 text-xs text-white bg-[#1a73e8] hover:bg-[#1765cc] rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                        <Save size={14} /><span>儲存</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============================================================
// 主應用
// ============================================================
const FONT_FAMILIES = [
    { label: '微軟正黑', value: '"Microsoft JhengHei", "Apple LiGothic Medium", "PingFang TC", sans-serif' },
    { label: '標楷體', value: 'BiauKai, "DFKai-SB", serif' },
    { label: '黑體', value: '"Heiti TC", "LiHei Pro", sans-serif' },
    { label: '預設', value: 'sans-serif' },
];

const FONT_WEIGHTS = [
    { label: '細', value: '300' },
    { label: '正常', value: 'normal' },
    { label: '粗', value: 'bold' },
    { label: '極粗', value: '900' },
];

const FONT_SIZES = [
    { label: '小', value: 11 },
    { label: '中', value: 13 },
    { label: '大', value: 15 },
    { label: '特', value: 17 },
];

const App = () => {
    const saved = loadConfig();
    const [actIdx, setActIdx] = useState(saved?.last_act ?? 0);
    const [checkedTasks, setCheckedTasks] = useState(saved?.checked ?? {});
    const [elapsedMs, setElapsedMs] = useState(saved?.time ?? 0);
    const [isRunning, setIsRunning] = useState(false);
    const [opacity, setOpacity] = useState(saved?.alpha ?? 0.9);
    const [dark, setDark] = useState(saved?.dark ?? false);
    const [fontSize, setFontSize] = useState(saved?.fontSize ?? 13);
    const [fontFamily, setFontFamily] = useState(saved?.fontFamily ?? '"Microsoft JhengHei", "Apple LiGothic Medium", "PingFang TC", sans-serif');
    const [fontWeight, setFontWeight] = useState(saved?.fontWeight ?? 'normal');
    // 多張速查表圖片 (從舊的單張格式自動遷移)
    const [cheatsheets, setCheatsheets] = useState(() => {
        if (saved?.cheatsheets && Array.isArray(saved.cheatsheets)) return saved.cheatsheets;
        if (saved?.cheatsheet) return [saved.cheatsheet];
        return [];
    });
    const [actImages, setActImages] = useState(saved?.actImages ?? {});
    const [showActMap, setShowActMap] = useState(false);
    const [regexes, setRegexes] = useState(saved?.regexes ?? [
        { id: 1, name: '3連色 (紅綠藍)', regex: 'r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r' },
        { id: 2, name: '跑速鞋 (10%以上)', regex: '1[0-9]% increased movement speed' }
    ]);
    const [showRegex, setShowRegex] = useState(false);
    const [showCheatsheet, setShowCheatsheet] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [showHotkeySettings, setShowHotkeySettings] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [guideData, setGuideData] = useState(() => loadGuide() || DEFAULT_GUIDE);
    // 隱藏計時器 & 任務攻略
    const [showTimer, setShowTimer] = useState(saved?.showTimer ?? true);
    const [showGuide, setShowGuide] = useState(saved?.showGuide ?? true);
    // 快捷鍵
    const [hotkeys, setHotkeys] = useState({ toggle: 'F10', cheatsheet: 'F9', regex: 'F8' });
    const acts = Object.keys(guideData);
    const safeActIdx = actIdx < acts.length ? actIdx : 0;
    const currentAct = acts[safeActIdx];
    const startTimeRef = useRef(Date.now() - elapsedMs);

    // --- 初始化載入快捷鍵 ---
    useEffect(() => {
        if (!isElectron) return;
        window.electronAPI.getHotkeys().then(hk => { if (hk) setHotkeys(hk); });
    }, []);

    // --- 計時器 ---
    useEffect(() => {
        let raf;
        const tick = () => { setElapsedMs(Date.now() - startTimeRef.current); raf = requestAnimationFrame(tick); };
        if (isRunning) { startTimeRef.current = Date.now() - elapsedMs; raf = requestAnimationFrame(tick); }
        return () => cancelAnimationFrame(raf);
    }, [isRunning]);

    // --- 速查表快捷鍵 ---
    useEffect(() => {
        if (!isElectron) return;
        const toggle = () => {
            setShowCheatsheet(prev => {
                if (!prev && cheatsheets.length === 0) {
                    toast('請先至設定選擇速查表圖片');
                    return false;
                }
                return !prev;
            });
        };
        window.electronAPI.onToggleCheatsheet(toggle);
        return () => window.electronAPI.offToggleCheatsheet();
    }, [cheatsheets]);

    // --- Regex 快捷鍵 ---
    useEffect(() => {
        if (!isElectron) return;
        const toggleRegex = () => setShowRegex(prev => !prev);
        window.electronAPI.onToggleRegex(toggleRegex);
        return () => window.electronAPI.offToggleRegex();
    }, []);

    // --- 監聽快捷鍵變更事件 ---
    useEffect(() => {
        if (!isElectron) return;
        window.electronAPI.onHotkeysChanged(hk => setHotkeys(hk));
        return () => window.electronAPI.offHotkeysChanged();
    }, []);

    const fmt = (ms) => {
        const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // --- 持久化 ---
    const persist = useCallback(() => {
        saveConfig({ last_act: safeActIdx, checked: checkedTasks, time: elapsedMs, alpha: opacity, dark, fontSize, fontFamily, fontWeight, cheatsheets, actImages, regexes, showTimer, showGuide });
    }, [safeActIdx, checkedTasks, elapsedMs, opacity, dark, fontSize, fontFamily, fontWeight, cheatsheets, actImages, regexes, showTimer, showGuide]);
    useEffect(() => { persist(); }, [safeActIdx, checkedTasks, opacity, dark, fontSize, fontFamily, fontWeight, cheatsheets, actImages, regexes, showTimer, showGuide]);
    useEffect(() => { if (!isRunning) { persist(); return; } const id = setInterval(persist, 5000); return () => clearInterval(id); }, [isRunning, persist]);

    const handleOpacity = (val) => { setOpacity(val); if (isElectron) window.electronAPI.setOpacity(val); };
    const toggleTask = (task) => { const k = `${currentAct}_${task}`; setCheckedTasks(p => ({ ...p, [k]: !p[k] })); };
    const nextAct = () => setActIdx(i => (i + 1) % acts.length);
    const prevAct = () => setActIdx(i => (i - 1 + acts.length) % acts.length);

    const resetAll = () => {
        if (!window.confirm('確認重置所有進度？')) return;
        setCheckedTasks({}); setElapsedMs(0); setIsRunning(false); setActIdx(0);
        startTimeRef.current = Date.now();
        saveConfig({ last_act: 0, checked: {}, time: 0, alpha: opacity, dark, fontSize, fontFamily, fontWeight, cheatsheets, actImages, regexes, showTimer, showGuide });
        toast('進度已重置');
    };

    const toast = (msg) => { setToastMsg(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 2500); };

    // --- 攻略儲存 ---
    const handleGuideSave = (newGuide) => {
        setGuideData(newGuide); saveGuide(newGuide);
        setActIdx(0); setCheckedTasks({});
        setShowEditor(false);
        toast('攻略已更新');
    };
    const handleGuideReset = () => {
        setGuideData(DEFAULT_GUIDE); saveGuide(null);
        localStorage.removeItem(GUIDE_KEY);
        setActIdx(0); setCheckedTasks({});
        setShowEditor(false);
        toast('已還原預設攻略');
    };

    // --- 進度 ---
    const totalTasks = Object.values(guideData).flat().length;
    const completedTasks = Object.values(checkedTasks).filter(Boolean).length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const currentTasks = guideData[currentAct] || [];
    const currentCompleted = currentTasks.filter(t => checkedTasks[`${currentAct}_${t}`]).length;
    const currentPercent = currentTasks.length > 0 ? Math.round((currentCompleted / currentTasks.length) * 100) : 0;

    // --- 主題色 ---
    const bg = dark ? 'bg-[#202124]' : 'bg-[#f8f9fa]';
    const cardBg = dark ? 'bg-[#292a2d]' : 'bg-white';
    const textPrimary = dark ? 'text-gray-200' : 'text-[#3c4043]';
    const textSecondary = dark ? 'text-gray-500' : 'text-[#9aa0a6]';
    const border = dark ? 'border-gray-700/50' : 'border-gray-200';

    return (
        <div className={cn("flex flex-col h-full font-sans overflow-hidden rounded-xl relative", bg, textPrimary)}>

            {/* ===== 標題列 ===== */}
            <header className={cn("px-2.5 py-1.5 flex items-center justify-between shadow-sm z-10 select-none shrink-0 border-b", cardBg, border)}
                style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white">
                        <Sword size={12} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xs font-bold leading-none">
                            {completedTasks}/{totalTasks} ({progressPercent}%)
                            <span className="ml-1.5 opacity-50 font-normal text-[9px]">v2.2.0</span>
                        </h1>
                        <p className={cn("text-[9px] font-medium", textSecondary)}>{isElectron ? `${hotkeys.toggle} 隱藏` : 'PoE Helper'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' }}>
                    <button onClick={resetAll} className={cn("p-1.5 rounded-full transition-all active:scale-90 hover:bg-red-500/10 hover:text-red-400", textSecondary)} title="重置進度">
                        <RotateCcw size={14} />
                    </button>
                    <button onClick={() => setShowSettings(s => !s)} className={cn("p-1.5 rounded-full transition-all active:scale-90", showSettings ? "bg-blue-500/20 text-[#1a73e8]" : cn("hover:bg-gray-500/10", textSecondary))} title="設定">
                        <Settings size={14} />
                    </button>
                    {isElectron && (<>
                        <button onClick={() => window.electronAPI.minimizeWindow()} className={cn("p-1.5 hover:bg-gray-500/10 rounded-full transition-colors", textSecondary)} title="最小化"><Minus size={14} /></button>
                        <button onClick={() => window.electronAPI.closeWindow()} className={cn("p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors", textSecondary)} title="關閉"><X size={14} /></button>
                    </>)}
                </div>
            </header>

            {/* ===== 設定面板 ===== */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                        className={cn("overflow-hidden border-b shrink-0", cardBg, border)}>
                        <div className="px-3 py-2.5 space-y-2.5">

                            {/* 透明度 */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5"><Eye size={12} className={textSecondary} /><span className="text-[11px] font-medium">透明度</span></div>
                                    <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded", dark ? "bg-gray-700" : "bg-gray-100", textSecondary)}>{Math.round(opacity * 100)}%</span>
                                </div>
                                <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={e => handleOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#1a73e8]" />
                            </div>

                            {/* 字型、粗細、大小設定面板 (Row 1) */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                                {/* 字型選擇 */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                        <Type size={12} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {FONT_FAMILIES.map(ff => (
                                            <button key={ff.value} onClick={() => setFontFamily(ff.value)}
                                                className={cn("px-1.5 py-1 rounded text-[10px] font-medium transition-all active:scale-95 truncate max-w-[48px]",
                                                    fontFamily.includes(ff.value.split(',')[0])
                                                        ? "bg-[#1a73e8] text-white"
                                                        : cn("hover:bg-gray-500/10", textSecondary)
                                                )}
                                                title={ff.label}>
                                                {ff.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />
                                {/* 粗細設定 */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {FONT_WEIGHTS.map(fw => (
                                        <button key={fw.value} onClick={() => setFontWeight(fw.value)}
                                            className={cn("px-1.2 py-1 rounded text-[10px] font-medium transition-all active:scale-95",
                                                fontWeight === fw.value
                                                    ? "bg-[#1a73e8] text-white"
                                                    : cn("hover:bg-gray-500/10", textSecondary)
                                            )}>
                                            {fw.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />
                                {/* 大小設定 */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {FONT_SIZES.map(fs => (
                                        <button key={fs.value} onClick={() => setFontSize(fs.value)}
                                            className={cn("px-1.5 py-1 rounded text-[10px] font-medium transition-all active:scale-95",
                                                fontSize === fs.value
                                                    ? "bg-[#1a73e8] text-white"
                                                    : cn("hover:bg-gray-500/10", textSecondary)
                                            )}>
                                            {fs.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 深淺模式 & 自訂快捷鍵 (Row 2) */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => setDark(d => !d)}
                                    className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 flex-1 justify-center",
                                        dark ? "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25" : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                                    )}>
                                    {dark ? <Sun size={12} /> : <Moon size={12} />}
                                    <span>{dark ? '淺色模式' : '深色模式'}</span>
                                </button>
                                {isElectron && (
                                    <button onClick={() => { setShowHotkeySettings(true); setShowSettings(false); }}
                                        className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                            dark ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                        )}>
                                        <Keyboard size={12} /><span>自訂快捷鍵</span>
                                    </button>
                                )}
                            </div>



                            {/* 自定義攻略與Vendor Regex (同一行) */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setShowEditor(true); setShowSettings(false); }}
                                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                        dark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-[#5f6368] hover:bg-gray-200"
                                    )}>
                                    <FileEdit size={12} /><span>自定義攻略</span>
                                </button>
                                <button onClick={() => { setShowRegex(true); setShowSettings(false); }}
                                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                        dark ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                    )}>
                                    <Search size={12} /><span>Regex</span>
                                </button>
                            </div>

                            {/* 顯示/隱藏 計時器 & 攻略 */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowTimer(v => !v)}
                                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                        showTimer ? (dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600") : (dark ? "bg-gray-700 text-gray-500" : "bg-gray-100 text-gray-400")
                                    )}>
                                    <Timer size={12} /><span>{showTimer ? '計時器' : '計時器(隱藏)'}</span>
                                </button>
                                <button onClick={() => setShowGuide(v => !v)}
                                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                        showGuide ? (dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600") : (dark ? "bg-gray-700 text-gray-500" : "bg-gray-100 text-gray-400")
                                    )}>
                                    <ListChecks size={12} /><span>{showGuide ? '攻略' : '攻略(隱藏)'}</span>
                                </button>
                            </div>

                            {/* 路線圖 & 速查表圖片 (Electron Only) */}
                            {isElectron && (
                                <div className="flex items-center gap-2">
                                    {/* 路線圖 */}
                                    <div className="flex-1 flex items-center gap-1">
                                        <button onClick={async () => {
                                            const paths = await window.electronAPI.selectImages();
                                            if (paths && paths.length > 0) {
                                                setActImages(prev => {
                                                    const existing = prev[currentAct] || [];
                                                    return { ...prev, [currentAct]: [...existing, ...paths] };
                                                });
                                                toast(`已為 ${currentAct} 新增圖片`);
                                            }
                                        }}
                                            className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                                dark ? "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20" : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                                            )} title={`為「${currentAct}」設定專屬路線圖`}>
                                            <Map size={12} /><span className="truncate max-w-[80px]">{currentAct.split('：')[0]}</span>
                                            <span>({actImages[currentAct]?.length || 0})</span>
                                        </button>
                                        {actImages[currentAct]?.length > 0 && (
                                            <button onClick={() => {
                                                setActImages(prev => {
                                                    const next = { ...prev };
                                                    delete next[currentAct];
                                                    return next;
                                                });
                                                toast(`已清除 ${currentAct} 的路線圖`);
                                            }}
                                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0" title="清除本章路線圖">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    {/* 速查表 */}
                                    <div className="flex-1 flex items-center gap-1">
                                        <button onClick={async () => {
                                            const paths = await window.electronAPI.selectImages();
                                            if (paths && paths.length > 0) { setCheatsheets(prev => [...prev, ...paths]); toast(`已新增 ${paths.length} 張圖片`); }
                                        }}
                                            className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                                dark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-[#5f6368] hover:bg-gray-200"
                                            )}>
                                            <ImageIcon size={12} /><span>速查表 ({cheatsheets.length})</span>
                                        </button>
                                        {cheatsheets.length > 0 && (
                                            <button onClick={() => { setCheatsheets([]); toast('已清除所有圖片'); }}
                                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0" title="清除全部">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 快捷鍵提示 */}
                            <div className={cn("text-[9px] px-2.5 py-1.5 rounded-lg leading-relaxed", dark ? "bg-[#1e1f22] text-gray-500" : "bg-gray-50 text-[#9aa0a6]")}>
                                {isElectron ? `⌨️ ${hotkeys.regex} Regex · ${hotkeys.cheatsheet} 速查表 · ${hotkeys.toggle} 隱藏/顯示` : '💡 Electron 版支援視窗置頂與快捷鍵'}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== 計時器 ===== */}
            {showTimer && (
                <div className={cn("px-3 py-2 flex items-center justify-center gap-3 mb-px shadow-sm shrink-0", cardBg)}>
                    <div className={cn("text-2xl font-mono font-bold px-4 py-1 rounded-xl tracking-wider select-none", dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-[#1a73e8]")}>
                        {fmt(elapsedMs)}
                    </div>
                    <button onClick={() => setIsRunning(!isRunning)}
                        className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium text-xs transition-all active:scale-95 shadow-sm",
                            isRunning ? "bg-[#f28b82] text-white hover:bg-[#ee675c]" : "bg-[#1a73e8] text-white hover:bg-[#1765cc]"
                        )}>
                        {isRunning ? <Pause size={14} /> : <Play size={14} />}
                        <span>{isRunning ? '暫停' : '計時'}</span>
                    </button>
                    <button onClick={() => { setElapsedMs(0); setIsRunning(false); startTimeRef.current = Date.now(); toast('計時器已歸零'); }}
                        className={cn("p-1.5 rounded-full transition-all active:scale-90", dark ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-gray-100 text-[#5f6368] hover:bg-gray-200")} title="重置計時">
                        <RotateCcw size={14} />
                    </button>
                </div>
            )}

            {/* ===== 章節導航 + 任務列表 ===== */}
            {showGuide && (<>
                <div className={cn("px-2 py-1 flex items-center border-b shrink-0", cardBg, border)}>
                    <button onClick={prevAct} className={cn("p-1 rounded-full transition-colors active:scale-90", dark ? "hover:bg-gray-700" : "hover:bg-gray-100")}>
                        <ChevronLeft size={18} className={textSecondary} />
                    </button>
                    <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                        <div className="flex items-center gap-1">
                            <h2 className={cn("text-xs font-bold px-2.5 py-0.5 rounded-md truncate", dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-[#1a73e8]")}>
                                {currentAct}
                            </h2>
                            <button onClick={() => {
                                if (actImages[currentAct] && actImages[currentAct].length > 0) {
                                    setShowActMap(true);
                                } else if (isElectron) {
                                    window.electronAPI.selectImages().then(paths => {
                                        if (paths && paths.length > 0) {
                                            setActImages(prev => {
                                                const existing = prev[currentAct] || [];
                                                return { ...prev, [currentAct]: [...existing, ...paths] };
                                            });
                                            toast(`已為 ${currentAct} 新增路線圖`);
                                        }
                                    });
                                } else {
                                    toast('請在應用程式中新增圖片');
                                }
                            }} className={cn("p-1.5 rounded transition-colors active:scale-90",
                                actImages[currentAct] && actImages[currentAct].length > 0
                                    ? (dark ? "bg-blue-500/20 text-[#1a73e8] hover:bg-blue-500/30" : "bg-blue-50 text-[#1a73e8] hover:bg-blue-100")
                                    : (dark ? "text-gray-500 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100")
                            )} title={actImages[currentAct] && actImages[currentAct].length > 0 ? "查看路線圖" : "新增路線圖"}>
                                <Map size={14} />
                            </button>
                        </div>
                        <span className={cn("text-[9px] font-medium whitespace-nowrap shrink-0", textSecondary)}>
                            {currentCompleted}/{currentTasks.length} · {safeActIdx + 1}/{acts.length}章
                        </span>
                    </div>
                    <button onClick={nextAct} className={cn("p-1 rounded-full transition-colors active:scale-90", dark ? "hover:bg-gray-700" : "hover:bg-gray-100")}>
                        <ChevronRight size={18} className={textSecondary} />
                    </button>
                </div>

                {/* 進度條 */}
                <div className={cn("h-[2px] shrink-0", dark ? "bg-gray-700" : "bg-gray-100")}>
                    <motion.div className="h-full bg-gradient-to-r from-[#1a73e8] to-[#34a853] rounded-r-full" initial={false} animate={{ width: `${currentPercent}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
                </div>

                {/* 任務列表 */}
                <main className={cn("flex-1 overflow-y-auto px-2.5 py-2 space-y-1 custom-scrollbar", bg)}>
                    <AnimatePresence mode="wait">
                        <motion.div key={currentAct} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="space-y-1">
                            {currentTasks.map((task, index) => {
                                const isChecked = !!checkedTasks[`${currentAct}_${task}`];
                                return (
                                    <motion.div key={`${currentAct}_${index}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                                        whileTap={{ scale: 0.98 }} onClick={() => toggleTask(task)}
                                        className={cn("flex items-start gap-2 px-2.5 py-2 rounded-lg border cursor-pointer group transition-all",
                                            isChecked
                                                ? dark ? "bg-green-500/10 border-green-500/20" : "bg-green-50/80 border-green-100"
                                                : dark ? cn(cardBg, "border-transparent hover:border-blue-500/30") : "bg-white border-transparent hover:border-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                                        )}>
                                        <div className={cn("mt-0.5 w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center transition-all shrink-0",
                                            isChecked ? "bg-[#34a853] border-[#34a853] text-white" : dark ? "bg-transparent border-gray-600 group-hover:border-blue-400" : "bg-white border-gray-300 group-hover:border-[#1a73e8]"
                                        )}>
                                            {isChecked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={10} strokeWidth={4} /></motion.div>}
                                        </div>
                                        <span style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily, fontWeight: fontWeight }} className={cn("leading-relaxed select-none transition-all",
                                            isChecked ? dark ? "text-gray-600 line-through" : "text-gray-400 line-through" : ""
                                        )}>
                                            {task}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </>)}

            {/* ===== 右下角縮放把手 ===== */}
            {isElectron && (
                <div className={cn("absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-0.5 pointer-events-none transition-colors", textSecondary)}
                    style={{ WebkitAppRegion: 'no-drag' }}>
                    <GripVertical size={12} className="rotate-[-45deg] opacity-50" />
                </div>
            )}

            {/* ===== 攻略編輯器 ===== */}
            <AnimatePresence>
                {showEditor && (
                    <GuideEditor guideData={guideData} onSave={handleGuideSave} onClose={() => setShowEditor(false)} onReset={handleGuideReset} dark={dark} />
                )}
            </AnimatePresence>

            {/* ===== 速查表視窗 ===== */}
            <AnimatePresence>
                {showCheatsheet && (
                    <CheatsheetViewer images={cheatsheets} onClose={() => setShowCheatsheet(false)} hotkeyLabel={hotkeys.cheatsheet} />
                )}
            </AnimatePresence>

            {/* ===== 路線圖視窗 ===== */}
            <AnimatePresence>
                {showActMap && (
                    <CheatsheetViewer images={actImages[currentAct] || []} onClose={() => setShowActMap(false)} hotkeyLabel="100%" />
                )}
            </AnimatePresence>

            {/* ===== Regex 視窗 ===== */}
            <AnimatePresence>
                {showRegex && (
                    <RegexModal regexes={regexes} setRegexes={setRegexes} onClose={() => setShowRegex(false)} dark={dark} toast={toast} />
                )}
            </AnimatePresence>

            {/* ===== 快捷鍵設定 Modal ===== */}
            <AnimatePresence>
                {showHotkeySettings && (
                    <HotkeySettingsModal hotkeys={hotkeys} onSave={async (newHk) => {
                        if (isElectron) { const result = await window.electronAPI.setHotkeys(newHk); setHotkeys(result); }
                        setShowHotkeySettings(false);
                        toast('快捷鍵已更新');
                    }} onClose={() => setShowHotkeySettings(false)} dark={dark} />
                )}
            </AnimatePresence>

            <Toast message={toastMsg} visible={toastVisible} />
        </div>
    );
};

export default App;
