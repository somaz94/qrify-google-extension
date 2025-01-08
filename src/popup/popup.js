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

    initTheme();

    function generateQRCode() {
        const text = qrText.value.trim();
        
        if (!text) {
            alert('텍스트를 입력해주세요!');
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
                    title: 'QR Code',
                    text: 'QRify로 생성된 QR 코드',
                    files: [file]
                });
            } catch (error) {
                console.error('공유 실패:', error);
                alert('공유하기를 실패했습니다.');
            }
        } else {
            alert('이 브라우저는 공유 기능을 지원하지 않습니다.');
        }
    }

    function saveToHistory(text) {
        chrome.storage.local.get(['qrHistory'], function(result) {
            let history = result.qrHistory || [];
            history.push({
                text: text,
                timestamp: new Date().toISOString()
            });
            if (history.length > 10) {
                history = history.slice(-10);
            }
            chrome.storage.local.set({ qrHistory: history });
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
        themeToggle.title = theme === 'dark' ? '라이트모드로 전환' : '다크모드로 전환';
    }

    function updateColorPreview(input) {
        const preview = input.parentElement.querySelector('.color-preview');
        preview.textContent = input.value.toUpperCase();
    }

    function updateSizeValue(input) {
        const sizeValue = input.parentElement.querySelector('.size-value');
        sizeValue.textContent = `${input.value} x ${input.value}`;
    }

    qrColor.addEventListener('input', (e) => {
        updateColorPreview(e.target);
        generateQRCode();
    });

    bgColor.addEventListener('input', (e) => {
        updateColorPreview(e.target);
        generateQRCode();
    });

    qrSize.addEventListener('input', (e) => {
        updateSizeValue(e.target);
        generateQRCode();
    });

    updateColorPreview(qrColor);
    updateColorPreview(bgColor);
    updateSizeValue(qrSize);
});