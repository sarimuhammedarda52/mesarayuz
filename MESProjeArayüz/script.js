document.addEventListener('DOMContentLoaded', () => {
    const statusPanel = document.getElementById('status-panel');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const kpiTotalProduction = document.getElementById('kpi-total-production');
    const kpiTotalDefect = document.getElementById('kpi-total-defect');
    const kpiOee = document.getElementById('kpi-oee');
    const eventLog = document.getElementById('event-log');
    let totalProduction = 0;
    let totalDefect = 0;
    function connectWebSocket() {
        const socket = new WebSocket('ws://127.0.0.1:8000/ws');
        socket.onopen = () => {
            console.log('Sunucuya (IIoT Prototipi) başarıyla bağlanıldı.');
            addLogEntry('success', 'Sunucuya (IIoT Prototipi) başarıyla bağlanıldı.');
            updateStatus('ÜRETİM AKTİF', 'Sistem normal olarak çalışıyor. Veri bekleniyor.');
        };
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Sunucudan paket alındı:', data);
            if (data.type === 'error_event') {
                const payload = data.payload;
                updateStatus(payload.status_title, payload.status_message);
                addLogEntry('error', payload.log_message);
                totalDefect++;
                updateKpiData();
            } else if (data.type === 'info_event') {
                const payload = data.payload;
                updateStatus(payload.status_title, payload.status_message);
                addLogEntry('info', payload.log_message);
                totalProduction++;
                updateKpiData();
            }
        };
        socket.onclose = () => {
            console.warn('Sunucuyla bağlantı kesildi. 3 saniye içinde tekrar denenecek.');
            addLogEntry('error', 'Sunucu bağlantısı koptu. Tekrar bağlanılıyor...');
            setTimeout(connectWebSocket, 3000);
        };
        socket.onerror = (error) => {
            console.error('WebSocket Hatası:', error);
            addLogEntry('error', 'Haberleşme kanalı hatası.');
        };
    }
    function updateStatus(title, message) {
        statusTitle.textContent = title;
        statusMessage.textContent = message;
        if (title.includes('HATA')) {
            statusPanel.className = 'card status-error';
        } else {
            statusPanel.className = 'card status-ok';
        }
    }
    function addLogEntry(type, message) {
        const li = document.createElement('li');
        li.className = `log-${type}`;
        const time = new Date().toLocaleTimeString('tr-TR');
        li.textContent = `[${time}] - ${message}`;
        eventLog.prepend(li);
    }
    function updateKpiData() {
        kpiTotalProduction.textContent = totalProduction;
        kpiTotalDefect.textContent = totalDefect;
        let oee = 0;
        if (totalProduction > 0) {
            const goodParts = totalProduction - totalDefect;
            oee = (goodParts / totalProduction) * 100;
        }
        kpiOee.textContent = `${oee.toFixed(1)}%`;
    }
    connectWebSocket();
});