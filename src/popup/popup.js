import { applyTranslations, t } from '../i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    const qrText = document.getElementById('qr-text');
    const generateBtn = document.getElementById('generate-btn');
    const currentUrlBtn = document.getElementById('current-url-btn');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const qrCodeDiv = document.getElementById('qr-code');
    const qrColor = document.getElementById('qr-color');
    const bgColor = document.getElementById('bg-color');
    const qrSize = document.getElementById('qr-size');
    const themeToggle = document.getElementById('theme-toggle');

    generateBtn.addEventListener('click', generateQRCode);
    currentUrlBtn.addEventListener('click', getCurrentTabUrl);
    downloadBtn.addEventListener('click', downloadQRCode);
    shareBtn.addEventListener('click', shareQRCode);
    qrColor.addEventListener('change', generateQRCode);
    bgColor.addEventListener('change', generateQRCode);
    qrSize.addEventListener('change', generateQRCode);
    themeToggle.addEventListener('click', () => {
        toggleTheme();
    });

    applyTranslations();
    initTheme();

    function generateQRCode() {
        const text = qrText.value.trim();
        
        if (!text) {
            alert(t('errorEmptyText'));
            return;
        }

        // Clear previous QR code
        qrCodeDiv.innerHTML = '';
        
        // Generate new QR code with custom styles
        new QRCode(qrCodeDiv, {
            text: text,
            width: parseInt(qrSize.value),
            height: parseInt(qrSize.value),
            colorDark: qrColor.value,
            colorLight: bgColor.value,
            correctLevel: QRCode.CorrectLevel.H,
            quietZone: 15,
            quietZoneColor: bgColor.value
        });

        downloadBtn.classList.remove('hidden');
        shareBtn.classList.remove('hidden');

        // Save to history
        saveToHistory(text);
    }

    async function shareQRCode() {
        const img = qrCodeDiv.querySelector('img');
        if (img && navigator.share) {
            try {
                const blob = await (await fetch(img.src)).blob();
                const file = new File([blob], 'qrcode.png', { type: 'image/png' });
                await navigator.share({
                    title: t('shareTitle'),
                    text: t('shareText'),
                    files: [file]
                });
            } catch (error) {
                // 공유 취소(AbortError)는 무시
                if (error.name !== 'AbortError') {
                    console.error('Sharing failed:', error);
                    alert(t('shareFailed'));
                }
            }
        } else {
            alert(t('shareUnsupported'));
        }
    }

    function saveToHistory(text) {
        chrome.storage.local.get(['qrHistory'], function(result) {
            let history = result.qrHistory || [];
            history.push({
                text: text,
                timestamp: new Date().toISOString(),
                qrColor: qrColor.value,
                bgColor: bgColor.value,
                size: qrSize.value
            });
            if (history.length > 10) {
                history = history.slice(-10);
            }
            chrome.storage.local.set({ qrHistory: history });
            updateHistoryUI(history);
        });
    }

    function updateHistoryUI(history) {
        // 기존 히스토리 섹션 제거
        const existingHistory = document.querySelector('.history-section');
        if (existingHistory) {
            existingHistory.remove();
        }

        // 새 히스토리 섹션 생성
        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-section';
        historyContainer.innerHTML = `
            <h3>${t('historyTitle')}</h3>
            <div class="history-list">
                ${history.reverse().map(item => `
                    <div class="history-item" data-text="${item.text}" 
                         data-qr-color="${item.qrColor}" 
                         data-bg-color="${item.bgColor}"
                         data-size="${item.size}">
                        <span class="history-text">${item.text}</span>
                        <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // container의 마지막에 히스토리 섹션 추가
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(historyContainer);
        }

        // 히스토리 아이템 클릭 이벤트
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                qrText.value = item.dataset.text;
                qrColor.value = item.dataset.qrColor;
                bgColor.value = item.dataset.bgColor;
                qrSize.value = item.dataset.size;
                generateQRCode();
            });
        });
    }

    function getCurrentTabUrl() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            qrText.value = currentTab.url;
            generateQRCode();
        });
    }

    function downloadQRCode() {
        const img = qrCodeDiv.querySelector('img');
        if (img) {
            const link = document.createElement('a');
            link.download = 'qrify-code.png';
            link.href = img.src;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function initTheme() {
        chrome.storage.local.get(['theme'], function(result) {
            const theme = result.theme || 'light';
            document.documentElement.setAttribute('data-theme', theme);
            updateThemeToggleButton(theme);
        });
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({ theme: newTheme });
        updateThemeToggleButton(newTheme);
    }

    function updateThemeToggleButton(theme) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = t(theme === 'dark' ? 'themeToLight' : 'themeToDark');
    }

    // 초기 히스토리 로드
    chrome.storage.local.get(['qrHistory'], function(result) {
        if (result.qrHistory) {
            updateHistoryUI(result.qrHistory);
        }
    });
});