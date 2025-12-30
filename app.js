class PasswordCracker {
    constructor() {
        this.wordlist = [];
        this.totalPasswords = 0;
        this.currentIndex = 0;
        this.attempts = 0;
        this.startTime = 0;
        this.workers = [];
        this.isRunning = false;
        this.results = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStatus('جاهز للتحميل');
    }

    bindEvents() {
        document.getElementById('wordlist').addEventListener('change', (e) => this.loadCSVWordlist(e.target.files[0]));
        document.getElementById('start-btn').addEventListener('click', () => this.startCracking());
        document.getElementById('stop-btn').addEventListener('click', () => this.stopCracking());
        document.getElementById('export-btn').addEventListener('click', () => this.exportResults());
    }

    async loadCSVWordlist(file) {
        if (!file) return;
        
        this.updateStatus(`📥 تحميل ${Math.round(file.size/1e6)}MB...`);
        document.getElementById('file-info').textContent = `📁 ${file.name} (${Math.round(file.size/1e6)}MB)`;

        try {
            const text = await file.text();
            this.wordlist = text.split('\n').map(line => line.trim()).filter(Boolean);
            this.totalPasswords = this.wordlist.length;
            
            document.getElementById('total-pwds').textContent = this.formatNumber(this.totalPasswords);
            this.updateStatus(`✅ ${this.formatNumber(this.totalPasswords)} كلمة مرور محملة`);
        } catch (error) {
            this.updateStatus('❌ خطأ في تحميل الملف');
            console.error(error);
        }
    }

    startCracking() {
        if (this.wordlist.length === 0) {
            alert('⚠️ قم بتحميل قائمة كلمات المرور أولاً');
            return;
        }

        this.target = document.getElementById('target').value;
        this.username = document.getElementById('username').value;
        this.workerCount = parseInt(document.getElementById('workers').value);
        this.delay = parseInt(document.getElementById('delay').value);

        this.isRunning = true;
        this.attempts = 0;
        this.startTime = Date.now();
        this.currentIndex = 0;
        this.results = [];

        document.getElementById('start-btn').disabled = true;
        document.getElementById('stop-btn').disabled = false;
        document.getElementById('export-btn').disabled = true;

        this.createWorkers();
        this.updateStatus('🚀 بدء الاختراق...');
    }

    stopCracking() {
        this.isRunning = false;
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
        this.updateStatus('⏹️ توقف');
    }

    createWorkers() {
        this.workers = [];
        for (let i = 0; i < this.workerCount; i++) {
            const worker = new Worker('worker.js');
            worker.onmessage = (e) => this.handleWorkerMessage(e);
            worker.onerror = (e) => console.error('Worker error:', e);
            this.workers.push(worker);
        }
        
        this.assignWork();
    }

    assignWork() {
        if (!this.isRunning || this.currentIndex >= this.totalPasswords) {
            this.finishCracking();
            return;
        }

        const chunkSize = Math.ceil((this.totalPasswords - this.currentIndex) / this.workers.length);
        
        this.workers.forEach((worker, index) => {
            const start = this.currentIndex + (index * chunkSize);
            const end = Math.min(start + chunkSize, this.totalPasswords);
            
            worker.postMessage({
                wordlist: this.wordlist.slice(start, end),
                target: this.target,
                username: this.username,
                delay: this.delay,
                workerId: index
            });
        });
    }

    handleWorkerMessage(e) {
        const { result, attempts, speed } = e.data;
        
        if (result) {
            this.results.push(result);
            this.addResult(result);
            this.updateStatus(`✅ كلمة المرور مكتشفة: ${result.password}`);
        }
        
        this.attempts += attempts;
        document.getElementById('attempts').textContent = this.formatNumber(this.attempts);
        document.getElementById('speed').textContent = `${this.formatNumber(speed)} H/s`;
        
        if (!this.isRunning) return;
        
        this.currentIndex += 1000; // تقدم افتراضي
        if (this.currentIndex >= this.totalPasswords) {
            this.finishCracking();
        }
    }

    finishCracking() {
        this.isRunning = false;
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
        document.getElementById('export-btn').disabled = this.results.length === 0;
        
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.updateStatus(`✅ انتهى | الوقت: ${elapsed.toFixed(1)}s | النتائج: ${this.results.length}`);
    }

    addResult(result) {
        const resultsList = document.getElementById('results-list');
        const resultEl = document.createElement('div');
        resultEl.className = 'result-item';
        resultEl.innerHTML = `
            <strong>${result.target}</strong><br>
            Username: ${result.username}<br>
            Password: <code>${result.password}</code><br>
            Time: ${new Date().toLocaleTimeString('ar')}
        `;
        resultsList.insertBefore(resultEl, resultsList.firstChild);
    }

    exportResults() {
        if (this.results.length === 0) return;
        
        const data = this.results.map(r => 
            `${r.target},${r.username},${r.password},${new Date().toISOString()}`
        ).join('\n');
        
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cracker-results-${Date.now()}.csv`;
        a.click();
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
        document.getElementById('status').parentElement.classList.add('active');
        setTimeout(() => {
            document.getElementById('status').parentElement.classList.remove('active');
        }, 2000);
    }

    formatNumber(num) {
        if (num >= 1e6) return (num/1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num/1e3).toFixed(1) + 'K';
        return num.toString();
    }
}

// بدء التطبيق
new PasswordCracker();
