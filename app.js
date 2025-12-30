class RealPentestCracker {
    constructor() {
        this.wordlist = [];
        this.stats = { attempts: 0, success: 0, speed: 0 };
        this.isRunning = false;
        this.init();
    }

    init() {
        document.getElementById('wordlist').onchange = (e) => this.loadWordlist(e.target.files[0]);
        document.getElementById('start').onclick = () => this.start();
        document.getElementById('stop').onclick = () => this.stop();
    }

    async loadWordlist(file) {
        const text = await file.text();
        this.wordlist = text.split('\n').filter(Boolean);
        document.getElementById('total').textContent = this.wordlist.length.toLocaleString();
    }

    async start() {
        const config = {
            target: document.getElementById('target').value,
            username: document.getElementById('username').value,
            protocol: document.getElementById('protocol').value,
            workers: parseInt(document.getElementById('workers').value)
        };

        this.isRunning = true;
        document.getElementById('start').disabled = true;
        document.getElementById('stop').disabled = false;

        // Backend Proxy Attack (بإذن رسمي)
        for (let i = 0; i < config.workers && this.isRunning; i++) {
            this.attackWorker(config, i);
        }
    }

    async attackWorker(config, workerId) {
        let batch = 0;
        while (this.isRunning && batch < 10000) { // 10K per worker
            const passwords = this.wordlist.slice(batch * 100, (batch + 1) * 100);
            
            try {
                const response = await fetch('/api/attack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target: config.target,
                        username: config.username,
                        passwords: passwords,
                        protocol: config.protocol,
                        workerId
                    })
                });

                const result = await response.json();
                this.updateStats(result);
                
                if (result.success) {
