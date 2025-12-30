// Web Worker للاختراق المتوازي
self.onmessage = function(e) {
    const { wordlist, target, username, delay, workerId } = e.data;
    
    let attempts = 0;
    let speed = 0;
    const startTime = Date.now();
    
    async function testPassword(password) {
        attempts++;
        
        // محاكاة اختبار HTTP Basic Auth / SMB / RDP
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // محاكاة نجاح عشوائي (1% احتمال)
        if (Math.random() < 0.01) {
            self.postMessage({
                result: {
                    target,
                    username,
                    password,
                    workerId,
                    timestamp: new Date().toISOString()
                },
                attempts,
                speed: Math.floor(attempts / ((Date.now() - startTime) / 1000))
            });
            return true;
        }
        
        // إرسال تحديثات دورية
        if (attempts % 100 === 0) {
            speed = Math.floor(attempts / ((Date.now() - startTime) / 1000));
            self.postMessage({ result: null, attempts, speed });
        }
        
        return false;
    }
    
    // اختبار الكلمات السرية
    for (let password of wordlist) {
        if (testPassword(password)) break;
    }
    
    // إنهاء العامل
    self.postMessage({ result: null, attempts, speed });
};
