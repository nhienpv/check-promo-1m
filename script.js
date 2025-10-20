// Danh sách các mã promotion mặc định (có một số mã trùng để test)
const defaultPromoCodes = [
    'BS7SHXWT5ZS4VB52',
    'https://chatgpt.com/?promoCode=BS7SHXWT5ZS4VB52' // URL trùng
];

// State management
class PromoChecker {
    constructor() {
        this.results = [];
        this.isRunning = false;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.abortController = null;
        
        // Telegram notification batching
        this.notificationQueue = [];
        this.notificationTimer = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadDefaultCodes();
        this.updateStats();
    }

    initializeElements() {
        // Control elements
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.concurrencySelect = document.getElementById('concurrency');
        this.delayInput = document.getElementById('delay');
        this.authTokenInput = document.getElementById('authToken');
        this.toggleTokenBtn = document.getElementById('toggleTokenBtn');
        this.getTokenBtn = document.getElementById('getTokenBtn');
        this.testTokenBtn = document.getElementById('testTokenBtn');
        
        // Progress elements
        this.liveCountEl = document.getElementById('liveCount');
        this.deadCountEl = document.getElementById('deadCount');
        this.ineligibleCountEl = document.getElementById('ineligibleCount');
        this.totalCountEl = document.getElementById('totalCount');
        this.successRateEl = document.getElementById('successRate');
        this.progressTextEl = document.getElementById('progressText');
        this.progressPercentEl = document.getElementById('progressPercent');
        this.progressFillEl = document.getElementById('progressFill');
        
        // Filter elements
        this.searchInput = document.getElementById('searchInput');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.exportBtn = document.getElementById('exportBtn');
        this.resultsCountEl = document.getElementById('resultsCount');
        
        // Input elements
        this.promoCodesInput = document.getElementById('promoCodesInput');
        this.codesCountEl = document.getElementById('codesCount');
        this.removeDuplicatesBtn = document.getElementById('removeDuplicatesBtn');
        this.clearCodesBtn = document.getElementById('clearCodesBtn');
        this.addSampleBtn = document.getElementById('addSampleBtn');
        
        // Results table
        this.resultsTableBody = document.getElementById('resultsTableBody');
    }

    bindEvents() {
        // Load token from config.js if available
        this.loadTokenFromConfig();
        
        // Control events
        this.startBtn.addEventListener('click', () => this.startChecking());
        this.stopBtn.addEventListener('click', () => this.stopChecking());
        this.toggleTokenBtn.addEventListener('click', () => this.toggleTokenVisibility());
        this.getTokenBtn.addEventListener('click', () => this.showTokenInstructions());
        this.testTokenBtn.addEventListener('click', () => this.testToken());
        
        // Filter events
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });
        this.exportBtn.addEventListener('click', () => this.exportResults());
        
        // Input events
        this.promoCodesInput.addEventListener('input', () => this.updateCodesCount());
        this.removeDuplicatesBtn.addEventListener('click', () => this.removeDuplicates());
        this.clearCodesBtn.addEventListener('click', () => this.clearCodes());
        this.addSampleBtn.addEventListener('click', () => this.addSampleCodes());
    }

    loadDefaultCodes() {
        this.promoCodesInput.value = defaultPromoCodes.join('\n');
        this.updateCodesCount();
    }

    updateCodesCount() {
        const { uniqueCodes, duplicates, totalCodes } = this.getUniquePromoCodes();
        
        let countText = `${uniqueCodes.length} mã`;
        if (duplicates.length > 0) {
            countText += ` (${duplicates.length} trùng)`;
        }
        
        this.codesCountEl.innerHTML = countText;
        
        // Update duplicate information in progress section
        this.updateDuplicateInfo(duplicates);
        
        // Show duplicate warning if any
        if (duplicates.length > 0) {
            this.showDuplicateWarning(duplicates);
        }
    }

    // Extract promo code from URL or return the code directly
    extractPromoCode(input) {
        const trimmedInput = input.trim();
        
        // Method 1: Check for /p/ pattern (with or without https://)
        const pPathMatch = trimmedInput.match(/(?:https?:\/\/)?(?:www\.)?chatgpt\.com\/p\/([A-Z0-9]{16,})/i);
        if (pPathMatch && pPathMatch[1]) {
            const code = pPathMatch[1];
            return code.substring(code.length - 16);
        }
        
        // Method 2: Check if it's a full URL (with https://)
        if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
            try {
                const url = new URL(trimmedInput);
                
                // Extract from promoCode parameter (chatgpt.com/?promoCode=XXXX)
                const promoParam = url.searchParams.get('promoCode');
                if (promoParam && promoParam.length >= 16) {
                    return promoParam.substring(promoParam.length - 16);
                }
                
                // Extract last segment from path if it looks like a code
                const path = url.pathname;
                if (path.length >= 16) {
                    const lastSegment = path.split('/').pop();
                    if (lastSegment && lastSegment.length >= 16 && /^[A-Z0-9]+$/i.test(lastSegment)) {
                        return lastSegment.substring(lastSegment.length - 16);
                    }
                }
                
                // Extract last 16 characters from the entire URL as fallback
                const cleanUrl = trimmedInput.replace(/[^A-Z0-9]/gi, '');
                if (cleanUrl.length >= 16) {
                    return cleanUrl.substring(cleanUrl.length - 16);
                }
                
            } catch (error) {
                console.warn('Invalid URL format:', trimmedInput);
            }
        }
        
        // Method 3: If it's just a plain code (16+ alphanumeric characters)
        if (/^[A-Z0-9]{16,}$/i.test(trimmedInput)) {
            return trimmedInput.substring(trimmedInput.length - 16);
        }
        
        // If not a URL or extraction failed, return the input as-is
        return trimmedInput;
    }

    getPromoCodes() {
        const codes = this.promoCodesInput.value
            .split('\n')
            .map(line => this.extractPromoCode(line))
            .filter(code => code && code.length >= 16); // Only accept codes with at least 16 characters
        
        return codes;
    }

    // Get unique promo codes and detect duplicates
    getUniquePromoCodes() {
        const allCodes = this.getPromoCodes();
        const uniqueCodes = [];
        const duplicates = [];
        const seenCodes = new Set();

        allCodes.forEach(code => {
            if (seenCodes.has(code)) {
                if (!duplicates.includes(code)) {
                    duplicates.push(code);
                }
            } else {
                seenCodes.add(code);
                uniqueCodes.push(code);
            }
        });

        return { uniqueCodes, duplicates, totalCodes: allCodes.length };
    }

    clearCodes() {
        this.promoCodesInput.value = '';
        this.updateCodesCount();
        this.showToast('Đã xóa tất cả mã promotion', 'info');
    }

    addSampleCodes() {
        const currentCodes = this.getPromoCodes();
        const newCodes = [...new Set([...currentCodes, ...defaultPromoCodes])];
        this.promoCodesInput.value = newCodes.join('\n');
        this.updateCodesCount();
        this.showToast('Đã thêm mã mẫu', 'success');
    }

    async startChecking() {
        const { uniqueCodes, duplicates, totalCodes } = this.getUniquePromoCodes();
        
        if (uniqueCodes.length === 0) {
            this.showToast('Vui lòng nhập ít nhất một mã promotion', 'error');
            return;
        }

        // Show duplicate notification if any
        if (duplicates.length > 0) {
            this.showToast(`⚠️ Phát hiện ${duplicates.length} mã trùng lặp, sẽ chỉ kiểm tra ${uniqueCodes.length} mã duy nhất`, 'info');
        }
        
        // No token validation - using server-side token from Netlify env

        this.isRunning = true;
        this.abortController = new AbortController();
        this.results = [];
        this.updateUI();
        this.clearResultsTable();
        
        // Hide duplicate info during checking
        document.getElementById('duplicatesStatCard').style.display = 'none';
        document.getElementById('duplicateDetails').style.display = 'none';

        const concurrency = parseInt(this.concurrencySelect.value);
        const delay = parseInt(this.delayInput.value);

        this.progressTextEl.textContent = `Đang kiểm tra ${uniqueCodes.length} mã với ${concurrency} luồng...`;
        this.showToast(`Start checking ${uniqueCodes.length} mã promotion`, 'info');

        try {
            await this.checkCodesWithConcurrency(uniqueCodes, concurrency, delay);
            this.showToast('Hoàn thành kiểm tra tất cả mã!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.showToast(`Lỗi: ${error.message}`, 'error');
            }
        } finally {
            this.isRunning = false;
            this.updateUI();
            this.progressTextEl.textContent = 'Hoàn thành kiểm tra';
            
            // Send any remaining notifications immediately when checking completes
            if (this.notificationTimer) {
                clearTimeout(this.notificationTimer);
                this.notificationTimer = null;
            }
            if (this.notificationQueue.length > 0) {
                this.sendBatchNotification();
            }
        }
    }

    stopChecking() {
        if (this.abortController) {
            this.abortController.abort();
            this.isRunning = false;
            this.updateUI();
            this.progressTextEl.textContent = 'Đã dừng kiểm tra';
            this.showToast('Đã dừng kiểm tra', 'info');
            
            // Send any remaining notifications immediately
            if (this.notificationTimer) {
                clearTimeout(this.notificationTimer);
                this.notificationTimer = null;
            }
            if (this.notificationQueue.length > 0) {
                this.sendBatchNotification();
            }
        }
    }

    async checkCodesWithConcurrency(codes, concurrency, delay) {
        const chunks = this.chunkArray(codes, concurrency);
        let completedCount = 0;
        const totalCount = codes.length;

        for (const chunk of chunks) {
            if (this.abortController.signal.aborted) {
                throw new Error('Checking was aborted');
            }

            // Tạo promises cho chunk hiện tại
            const promises = chunk.map(async (code, index) => {
                // Thêm delay staggered để tránh spam
                if (delay > 0 && index > 0) {
                    await this.sleep(delay * index / chunk.length);
                }
                
                return this.checkSingleCode(code, completedCount + index + 1);
            });

            // Chờ tất cả promises trong chunk hoàn thành
            const chunkResults = await Promise.allSettled(promises);
            
            // Xử lý kết quả
            chunkResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    this.addResult(result.value);
                } else {
                    this.addResult({
                        code: chunk[index],
                        status: 'DEAD',
                        details: `Error: ${result.reason.message}`,
                        timestamp: new Date().toLocaleTimeString(),
                        index: completedCount + index + 1
                    });
                }
            });

            completedCount += chunk.length;
            this.updateProgress(completedCount, totalCount);

            // Delay giữa các chunk
            if (delay > 0 && completedCount < totalCount) {
                await this.sleep(delay);
            }
        }
    }

   async checkSingleCode(code, index) {
  try {
    const tempResult = {
      code,
      status: 'CHECKING',
      details: 'Đang kiểm tra...',
      timestamp: new Date().toLocaleTimeString(),
      index
    };
    this.addResultToTable(tempResult);

    const response = await fetch(`/.netlify/functions/check?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      signal: this.abortController.signal
    });

    let result;
    if (response.ok) {
      const data = await response.json();

      if (data?.metadata && data.is_eligible === true) {
        const discount = data.metadata.discount?.percentage ?? 0;
        const duration = data.metadata.duration?.num_periods ?? 0;
        const period   = data.metadata.duration?.period ?? '';
        result = {
          code, status: 'LIVE',
          details: `${discount}% off for ${duration} ${period} - Mã Singapo/Malaysia`,
          timestamp: new Date().toLocaleTimeString(), index
        };
        // Send notification for LIVE code
        this.sendNotification(result);
      } else if (data?.ineligible_reason) {
        const reason = data.ineligible_reason;
        const map = {
          user_not_eligible: ['INELIGIBLE', '100% off for 1 month - Mã Việt Nam'],
          invalid_promo_code: ['DEAD', 'Mã không hợp lệ hoặc đã hết hạn']
        };
        const [status, details] = map[reason.code] || ['DEAD', reason.message || 'Lỗi không xác định'];
        result = { code, status, details, timestamp: new Date().toLocaleTimeString(), index };
        // Send notification for INELIGIBLE code
        if (status === 'INELIGIBLE') {
          this.sendNotification(result);
        }
      } else {
        result = { code, status: 'DEAD', details: 'Mã không hợp lệ hoặc đã hết hạn', timestamp: new Date().toLocaleTimeString(), index };
      }
    } else {
      result = { code, status: 'DEAD', details: `HTTP Error ${response.status}`, timestamp: new Date().toLocaleTimeString(), index };
    }
    return result;

  } catch (error) {
    if (error.name === 'AbortError') throw error;

    let errorDetails = 'Network Error';
    if (error.message.includes('Failed to fetch')) {
      errorDetails = 'CORS/Network Error – kiểm tra proxy hoặc kết nối';
      setTimeout(() => {
        if (this.results.filter(r => r.details.includes('CORS')).length >= 3) this.showCORSModal();
      }, 1000);
    } else if (error.message.includes('timeout')) {
      errorDetails = 'Request timeout - Thử tăng delay';
    } else {
      errorDetails = `Error: ${error.message}`;
    }
    return { code, status: 'DEAD', details: errorDetails, timestamp: new Date().toLocaleTimeString(), index };
  }
}

    // Add notification to queue and schedule batch send
    sendNotification(result) {
        // Get configuration
        const aaaa = CONFIG.aaaa;
        const aaaaa = CONFIG.aaaaa;
        
        if (!aaaa || !aaaaa) return; // Skip if not configured
        
        // Add to queue
        this.notificationQueue.push(result);
        
        // Clear existing timer if any
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }
        
        // Set new timer for 60 seconds
        this.notificationTimer = setTimeout(() => {
            this.sendBatchNotification();
        }, 60000); // 60 seconds
    }
    
    // Send all queued notifications via Netlify function
    async sendBatchNotification() {
        if (this.notificationQueue.length === 0) return;
        
        try {
            const response = await fetch('/.netlify/functions/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: this.notificationQueue })
            });
            
            if (response.ok) {
                console.log('✅ Sent Telegram notification');
            } else {
                console.warn('Telegram notification failed');
            }
        } catch (error) {
            console.warn('Telegram notification error:', error);
        } finally {
            this.notificationQueue = [];
        }
    }

    addResult(result) {
        // Tìm và cập nhật kết quả tạm thời
        const existingIndex = this.results.findIndex(r => r.code === result.code);
        if (existingIndex !== -1) {
            this.results[existingIndex] = result;
        } else {
            this.results.push(result);
        }
        
        this.updateResultInTable(result);
        this.updateStats();
    }

    addResultToTable(result) {
        const row = document.createElement('tr');
        row.id = `result-${result.code}`;
        row.innerHTML = this.createTableRowHTML(result);
        this.resultsTableBody.appendChild(row);
    }

    updateResultInTable(result) {
        const row = document.getElementById(`result-${result.code}`);
        if (row) {
            row.innerHTML = this.createTableRowHTML(result);
        } else {
            this.addResultToTable(result);
        }
        this.applyFilters();
    }

    createTableRowHTML(result) {
        // Both LIVE and INELIGIBLE show as green "LIVE" badges
        let statusClass, statusIcon, statusLabel;
        
        if (result.status === 'LIVE' || result.status === 'INELIGIBLE') {
            statusClass = 'live';
            statusIcon = 'check_circle';
            statusLabel = 'LIVE';
        } else if (result.status === 'DEAD') {
            statusClass = 'dead';
            statusIcon = 'cancel';
            statusLabel = 'DEAD';
        } else {
            statusClass = 'checking';
            statusIcon = 'hourglass_empty';
            statusLabel = result.status;
        }
        
        return `
            <td>${result.index}</td>
            <td class="code-cell">${result.code}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <span class="material-icons" style="font-size: 14px;">${statusIcon}</span>
                    ${statusLabel}
                </span>
            </td>
            <td class="details-cell" title="${result.details}">${result.details}</td>
            <td class="time-cell">${result.timestamp}</td>
            <td class="actions-cell">
                <button class="action-btn" onclick="promoChecker.copyCode('${result.code}')" title="Copy mã">
                    <span class="material-icons" style="font-size: 16px;">content_copy</span>
                </button>
                <button class="action-btn" onclick="promoChecker.retestCode('${result.code}')" title="Kiểm tra lại">
                    <span class="material-icons" style="font-size: 16px;">refresh</span>
                </button>
            </td>
        `;
    }

    clearResultsTable() {
        this.resultsTableBody.innerHTML = '';
    }

    updateStats() {
        const liveCount = this.results.filter(r => r.status === 'LIVE').length;
        const deadCount = this.results.filter(r => r.status === 'DEAD').length;
        const ineligibleCount = this.results.filter(r => r.status === 'INELIGIBLE').length;
        const totalCount = this.results.length;
        const successRate = totalCount > 0 ? ((liveCount / totalCount) * 100).toFixed(1) : 0;

        this.liveCountEl.textContent = liveCount;
        this.deadCountEl.textContent = deadCount;
        this.ineligibleCountEl.textContent = ineligibleCount;
        this.totalCountEl.textContent = totalCount;
        this.successRateEl.textContent = `${successRate}%`;
        
        this.updateFilteredResultsCount();
    }

    updateProgress(completed, total) {
        const percentage = Math.round((completed / total) * 100);
        this.progressPercentEl.textContent = `${percentage}%`;
        this.progressFillEl.style.width = `${percentage}%`;
        this.progressTextEl.textContent = `Checked ${completed}/${total} mã`;
    }

    updateUI() {
        this.startBtn.disabled = this.isRunning;
        this.stopBtn.disabled = !this.isRunning;
        this.concurrencySelect.disabled = this.isRunning;
        this.delayInput.disabled = this.isRunning;
    }

    // Utility functions
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Load token from config.js
    loadTokenFromConfig() {
        try {
            if (typeof CONFIG !== 'undefined' && CONFIG.BEARER_TOKEN) {
                // Check if token is not the default placeholder
                if (CONFIG.BEARER_TOKEN !== 'YOUR_CHATGPT_BEARER_TOKEN_HERE' && CONFIG.AUTO_LOAD_TOKEN) {
                    this.authTokenInput.value = CONFIG.BEARER_TOKEN;
                    console.log('✅ Token loaded from config.js');
                    
                    // Validate token (silent - no toast)
                    if (!this.validateToken(CONFIG.BEARER_TOKEN)) {
                        console.warn('⚠️ Token may be expired. Please update config.js');
                    }
                } else if (CONFIG.BEARER_TOKEN === 'YOUR_CHATGPT_BEARER_TOKEN_HERE') {
                    console.error('⚠️ Please update BEARER_TOKEN in config.js');
                    // Show warning only if token not set
                    this.showToast('⚠️ Token chưa được cấu hình. Vui lòng cập nhật config.js', 'error');
                }
            }
        } catch (error) {
            console.warn('Could not load token from config.js:', error);
        }
    }
    
    // Token management functions
    validateToken(token) {
        if (!token || token.length < 50) return false;
        
        // Basic JWT format check (header.payload.signature)
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        try {
            // Try to decode the payload
            const payload = JSON.parse(atob(parts[1]));
            
            // Check if token is expired
            if (payload.exp && payload.exp < Date.now() / 1000) {
                this.showToast('Token đã hết hạn. Vui lòng lấy token mới!', 'error');
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    toggleTokenVisibility() {
        const input = this.authTokenInput;
        const btn = this.toggleTokenBtn;
        const icon = btn.querySelector('.material-icons');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility_off';
            btn.title = 'Ẩn token';
        } else {
            input.type = 'password';
            icon.textContent = 'visibility';
            btn.title = 'Hiện token';
        }
    }
    
    showTokenInstructions() {
        const instructions = `
🔑 HƯỚNG DẪN LẤY AUTHORIZATION TOKEN:

1. Mở ChatGPT (https://chatgpt.com) và đăng nhập
2. Nhấn F12 để mở Developer Tools
3. Chuyển sang tab "Network"
4. Làm mới trang (F5)
5. Tìm request đầu tiên (thường là "conversations" hoặc tương tự)
6. Click vào request đó
7. Trong tab "Headers", tìm phần "Request Headers"
8. Copy toàn bộ giá trị sau "Authorization: Bearer " (bao gồm cả Bearer)

⚠️ LưU Ý:
- Token có thể hết hạn sau vài giờ/ngày
- Không chia sẻ token với người khác
- Nếu gặp lỗi 401/403, hãy lấy token mới

🔧 Khắc phục CORS Error:
- Sử dụng Chrome với flag: --disable-web-security --user-data-dir="C:/temp"
- Hoặc dùng extension CORS Unblock
- Hoặc dùng proxy/tunnel service`;

        alert(instructions);
    }

    // Test token validity with detailed debugging
    async testToken() {
        const token = this.authTokenInput.value.trim();
        if (!token) {
            this.showToast('❌ Vui lòng nhập token trước!', 'error');
            return;
        }

        this.showToast('🔄 Đang kiểm tra token...', 'info');
        
        // Debug: Show token infoF
        console.log('🔍 TOKEN DEBUG INFO:');
        console.log('- Length:', token.length);
        console.log('- First 30 chars:', token.substring(0, 30) + '...');
        console.log('- Last 30 chars:', '...' + token.substring(token.length - 30));
        console.log('- Contains dots (JWT format):', token.includes('.') ? '✅ YES' : '❌ NO');
        console.log('- Starts with "eyJ":', token.startsWith('eyJ') ? '✅ YES' : '❌ NO');
        
        try {
            // Test with a simple promotion check
            const testCode = 'FREEGPT4OMINI';
            console.log('🔍 MAKING TEST REQUEST...');
            
            const response = await fetch(`https://chatgpt.com/backend-api/promotions/metadata/${testCode}`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': 'https://chatgpt.com/',
                    'Origin': 'https://chatgpt.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔍 RESPONSE DEBUG:');
            console.log('- Status:', response.status);
            console.log('- StatusText:', response.statusText);
            console.log('- Headers:', Object.fromEntries(response.headers.entries()));
            console.log('- URL:', response.url);

            if (response.status === 404) {
                this.showToast('✅ Token hợp lệ! (404 = mã test không tồn tại, đây là bình thường)', 'success');
                console.log('✅ TOKEN VALID - 404 means test code does not exist (normal)');
            } else if (response.status === 401) {
                this.showToast('❌ Token không hợp lệ hoặc đã hết hạn! Cần lấy token mới.', 'error');
                console.log('❌ TOKEN INVALID - 401 Unauthorized');
                
                // Additional debug for 401
                const responseText = await response.text();
                console.log('- Response body:', responseText);
            } else if (response.status === 200) {
                const data = await response.json();
                this.showToast('✅ Token hợp lệ và mã test có hiệu lực!', 'success');
                console.log('✅ TOKEN VALID - Test code exists:', data);
            } else {
                this.showToast(`⚠️ Phản hồi không mong đợi: ${response.status} ${response.statusText}`, 'info');
                console.log('⚠️ UNEXPECTED RESPONSE:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ TEST TOKEN ERROR:', error);
            this.showToast(`❌ Lỗi kiểm tra token: ${error.message}`, 'error');
            
            // Check if it's a CORS error
            if (error.message.includes('fetch')) {
                console.log('💡 This might be a CORS error. Make sure you are using Chrome with --disable-web-security');
            }
        }
    }
    
    showCORSModal() {
        document.getElementById('corsModal').style.display = 'flex';
    }

    // Filter and search functions
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.applyFilters();
    }

    handleFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.applyFilters();
    }

    applyFilters() {
        const rows = this.resultsTableBody.querySelectorAll('tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const code = row.querySelector('.code-cell')?.textContent || '';
            const status = row.querySelector('.status-badge')?.textContent.trim() || '';
            const details = row.querySelector('.details-cell')?.textContent || '';
            
            let shouldShow = true;
            
            // Apply status filter
            if (this.currentFilter !== 'all') {
                const filterStatus = this.currentFilter.toUpperCase();
                shouldShow = shouldShow && status.includes(filterStatus);
            }
            
            // Apply search filter
            if (this.searchQuery) {
                shouldShow = shouldShow && (
                    code.toLowerCase().includes(this.searchQuery) ||
                    details.toLowerCase().includes(this.searchQuery)
                );
            }
            
            row.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        });
        
        this.updateFilteredResultsCount(visibleCount);
    }

    updateFilteredResultsCount(count = null) {
        if (count === null) {
            count = Array.from(this.resultsTableBody.querySelectorAll('tr'))
                .filter(row => row.style.display !== 'none').length;
        }
        this.resultsCountEl.textContent = `${count} kết quả`;
    }

    // Action functions
    copyCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            this.showToast(`Đã copy mã: ${code}`, 'success');
        }).catch(() => {
            this.showToast('Không thể copy mã', 'error');
        });
    }

    async retestCode(code) {
        if (this.isRunning) {
            this.showToast('Vui lòng chờ kiểm tra hiện tại hoàn thành', 'error');
            return;
        }

        this.showToast(`Đang kiểm tra lại mã: ${code}`, 'info');
        
        try {
            this.abortController = new AbortController();
            const result = await this.checkSingleCode(code, 0);
            this.addResult(result);
            this.showToast(`Checked code: ${code}`, 'success');
        } catch (error) {
            this.showToast(`Lỗi khi kiểm tra lại: ${error.message}`, 'error');
        }
    }

    exportResults() {
        if (this.results.length === 0) {
            this.showToast('Không có kết quả để xuất', 'error');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `promo-check-results-${new Date().getTime()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Đã xuất kết quả thành công', 'success');
        }
    }

    generateCSV() {
        const headers = ['STT', 'Mã Promotion', 'Trạng thái', 'Chi tiết', 'Thời gian'];
        const csvRows = [headers.join(',')];
        
        this.results.forEach((result, index) => {
            const row = [
                index + 1,
                `"${result.code}"`,
                `"${result.status}"`,
                `"${result.details.replace(/"/g, '""')}"`,
                `"${result.timestamp}"`
            ];
            csvRows.push(row.join(','));
        });
        
        return '\uFEFF' + csvRows.join('\n'); // Add BOM for UTF-8
    }

    // Show detailed duplicate warning
    updateDuplicateInfo(duplicates) {
        const duplicatesStatCard = document.getElementById('duplicatesStatCard');
        const duplicateDetails = document.getElementById('duplicateDetails');
        const duplicatesCount = document.getElementById('duplicatesCount');
        const duplicateList = document.getElementById('duplicateList');
        
        if (duplicates.length > 0) {
            // Show duplicate stat card
            duplicatesStatCard.style.display = 'block';
            duplicatesCount.textContent = duplicates.length;
            
            // Show duplicate details section
            duplicateDetails.style.display = 'block';
            
            // Populate duplicate list
            duplicateList.innerHTML = '';
            duplicates.forEach(code => {
                const duplicateItem = document.createElement('div');
                duplicateItem.className = 'duplicate-item';
                duplicateItem.textContent = code;
                duplicateList.appendChild(duplicateItem);
            });
        } else {
            // Hide duplicate information
            duplicatesStatCard.style.display = 'none';
            duplicateDetails.style.display = 'none';
        }
    }

    showDuplicateWarning(duplicates) {
        // Only show warning if there are many duplicates to avoid spam
        if (duplicates.length > 2) {
            const duplicateList = duplicates.slice(0, 3).join(', ');
            const moreText = duplicates.length > 3 ? ` và ${duplicates.length - 3} mã khác` : '';
            this.showToast(`🔄 Mã trùng lặp: ${duplicateList}${moreText}`, 'warning');
        }

    }

    // Remove duplicates from input
    removeDuplicates() {
        const { uniqueCodes } = this.getUniquePromoCodes();
        this.promoCodesInput.value = uniqueCodes.join('\n');
        this.updateCodesCount();
        this.showToast('Đã loại bỏ các mã trùng lặp', 'success');
    }

    // Toast notification system
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check_circle' : 
                    type === 'error' ? 'error' : 
                    type === 'warning' ? 'warning' : 'info';
        
        toast.innerHTML = `
            <span class="material-icons">${icon}</span>
            <span>${message}</span>
        `;
        
        const container = document.getElementById('toastContainer');
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 3000);
        
        // Remove on click
        toast.addEventListener('click', () => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        });
    }
}

// Language Translations
const translations = {
    vi: {
        // Headers
        'Công Cụ Kiểm Tra Mã Khuyến Mãi Đa Luồng': 'Multi-threaded Promotion Code Validator',
        
        // Control Panel
        'Số luồng đồng thời:': 'Số luồng đồng thời:',
        'Concurrent threads:': 'Số luồng đồng thời:',
        '3 luồng': '3 luồng',
        '5 luồng': '5 luồng',
        '10 luồng': '10 luồng',
        '15 luồng': '15 luồng',
        '3 threads': '3 luồng',
        '5 threads': '5 luồng',
        '10 threads': '10 luồng',
        '15 threads': '15 luồng',
        'Delay giữa các request (ms):': 'Delay giữa các request (ms):',
        'Delay between requests (ms):': 'Delay giữa các request (ms):',
        'Authorization Token:': 'Authorization Token:',
        'Nhập Bearer token (bắt buộc)...': 'Nhập Bearer token (bắt buộc)...',
        'Hiện/Ẩn token': 'Hiện/Ẩn token',
        'Hướng dẫn lấy token': 'Hướng dẫn lấy token',
        'Kiểm tra token': 'Kiểm tra token',
        'Bắt đầu kiểm tra': 'Start Checking',
        'Start Checking': 'Bắt đầu kiểm tra',
        'Dừng lại': 'Dừng lại',
        'Stop': 'Dừng lại',
        
        // Stats
        'Mã LIVE': 'Mã LIVE',
        'LIVE Codes': 'Mã LIVE',
        'Mã DEAD': 'Mã DEAD', 
        'DEAD Codes': 'Mã DEAD',
        'Mã INELIGIBLE': 'Mã INELIGIBLE',
        'INELIGIBLE': 'INELIGIBLE',
        'Tổng số': 'Tổng số',
        'Total': 'Tổng số',
        'Tỷ lệ thành công': 'Tỷ lệ thành công',
        'Success Rate': 'Tỷ lệ thành công',
        'Mã trùng lặp': 'Mã trùng lặp',
        'Duplicates': 'Mã trùng lặp',
        
        // Progress
        'Sẵn sàng kiểm tra...': 'Sẵn sàng kiểm tra...',
        'Ready to check...': 'Sẵn sàng kiểm tra...',
        
        // Filters
        'Tìm kiếm mã promotion...': 'Tìm kiếm mã promotion...',
        'Search promotion codes...': 'Tìm kiếm mã promotion...',
        'Tất cả': 'Tất cả',
        'All': 'Tất cả',
        'Đang kiểm tra': 'Đang kiểm tra',
        'Checking': 'Đang kiểm tra',
        'Xuất kết quả': 'Xuất kết quả',
        'Export Results': 'Xuất kết quả',
        
        // Results
        'Kết quả kiểm tra': 'Kết quả kiểm tra',
        'Check Results': 'Kết quả kiểm tra',
        '0 kết quả': '0 kết quả',
        '0 results': '0 kết quả',
        'STT': 'STT',
        'No.': 'STT',
        'Mã Promotion': 'Mã Promotion',
        'Promo Code': 'Mã Promotion',
        'Trạng thái': 'Trạng thái',
        'Status': 'Trạng thái',
        'Chi tiết': 'Chi tiết',
        'Details': 'Chi tiết',
        'Thời gian': 'Thời gian',
        'Time': 'Thời gian',
        'Thao tác': 'Thao tác',
        'Actions': 'Thao tác',
        'List of duplicate codes': 'Danh sách mã trùng lặp',
        // Input
        'Danh sách mã promotion': 'Danh sách mã promotion',
        'Promotion Codes List': 'Danh sách mã promotion',
        'Loại bỏ trùng': 'Loại bỏ trùng',
        'Remove Duplicates': 'Loại bỏ trùng',
        'Xóa tất cả': 'Xóa tất cả',
        'Clear All': 'Xóa tất cả',
        'Thêm mã mẫu': 'Thêm mã mẫu',
        'Add Samples': 'Thêm mã mẫu',
        
        // Messages
        '0 mã': '0 mã',
        '0 codes': '0 mã',
        
    },
    en: {
        // Headers
        'Multi-threaded Promotion Code Validator': 'Multi-threaded Promotion Code Validator',
        
        // Control Panel
        'Số luồng đồng thời:': 'Concurrent threads:',
        'Concurrent threads:': 'Concurrent threads:',
        '3 luồng': '3 threads',
        '5 luồng': '5 threads', 
        '10 luồng': '10 threads',
        '15 luồng': '15 threads',
        '3 threads': '3 threads',
        '5 threads': '5 threads',
        '10 threads': '10 threads',
        '15 threads': '15 threads',
        'Delay giữa các request (ms):': 'Delay between requests (ms):',
        'Delay between requests (ms):': 'Delay between requests (ms):',
        'Authorization Token:': 'Authorization Token:',
        'Nhập Bearer token (bắt buộc)...': 'Enter Bearer token (required)...',
        'Hiện/Ẩn token': 'Show/Hide token',
        'Hướng dẫn lấy token': 'Get token guide',
        'Kiểm tra token': 'Test token',
        'Start Checking': 'Start Checking',
        'Dừng lại': 'Stop',
        'Stop': 'Stop',
        
        // Stats
        'Mã LIVE': 'LIVE Codes',
        'LIVE Codes': 'LIVE Codes',
        'Mã DEAD': 'DEAD Codes',
        'DEAD Codes': 'DEAD Codes',
        'Mã INELIGIBLE': 'INELIGIBLE',
        'INELIGIBLE': 'INELIGIBLE',
        'Tổng số': 'Total',
        'Total': 'Total',
        'Tỷ lệ thành công': 'Success Rate',
        'Success Rate': 'Success Rate',
        'Mã trùng lặp': 'Duplicates',
        'Duplicates': 'Duplicates',
        'Hoàn thành kiểm tra': 'Checking completed',
        'Đã kiểm tra': 'Checked',
        'Đang kiểm tra': 'Checking',
        'Danh sách mã trùng lặp': 'List of duplicate codes',
        // Progress
        'Sẵn sàng kiểm tra...': 'Ready to check...',
        'Ready to check...': 'Ready to check...',
        
        // Filters
        'Tìm kiếm mã promotion...': 'Search promotion codes...',
        'Search promotion codes...': 'Search promotion codes...',
        'Tất cả': 'All',
        'All': 'All',
        'Đang kiểm tra': 'Checking',
        'Checking': 'Checking',
        'Xuất kết quả': 'Export Results',
        'Export Results': 'Export Results',
        
        // Results
        'Kết quả kiểm tra': 'Check Results',
        'Check Results': 'Check Results',
        '0 kết quả': '0 results',
        '0 results': '0 results',
        'STT': 'No.',
        'No.': 'No.',
        'Mã Promotion': 'Promo Code',
        'Promo Code': 'Promo Code',
        'Trạng thái': 'Status',
        'Status': 'Status',
        'Chi tiết': 'Details',
        'Details': 'Details',
        'Thời gian': 'Time',
        'Time': 'Time',
        'Thao tác': 'Actions',
        'Actions': 'Actions',
        
        // Input
        'Danh sách mã promotion': 'Promotion Codes List',
        'Promotion Codes List': 'Promotion Codes List',
        'Loại bỏ trùng': 'Remove Duplicates',
        'Remove Duplicates': 'Remove Duplicates',
        'Xóa tất cả': 'Clear All',
        'Clear All': 'Clear All',
        'Thêm mã mẫu': 'Add Samples',
        'Add Samples': 'Add Samples',
        
        // Messages
        '0 mã': '0 codes',
        '0 codes': '0 codes',
        
    }
};

// Language Manager Class
class LanguageManager {
    constructor() {
        this.currentLanguage = 'vi'; // Default Vietnamese
        this.init();
    }
    
    init() {
        // Get saved language or default to Vietnamese
        const savedLang = localStorage.getItem('promo-checker-lang') || 'vi';
        this.setLanguage(savedLang);
        
        // Bind language toggle button
        const langBtn = document.getElementById('langBtn');
        if (langBtn) {
            langBtn.addEventListener('click', () => this.toggleLanguage());
        }
    }
    
    toggleLanguage() {
        const newLang = this.currentLanguage === 'vi' ? 'en' : 'vi';
        this.setLanguage(newLang);
    }
    
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('promo-checker-lang', lang);
        
        // Update language indicator
        const currentLangEl = document.getElementById('currentLang');
        if (currentLangEl) {
            currentLangEl.textContent = lang.toUpperCase();
        }
        
        // Translate all text elements
        this.translatePage();
    }
    
    translatePage() {
        // Translate elements with text content
        const elementsToTranslate = [
            // Headers
            '.header-subtitle',
            
            // Labels
            'label[for="concurrency"]',
            'label[for="delay"]', 
            'label[for="authToken"]',
            
            // Options
            'option[value="3"]',
            'option[value="5"]',
            'option[value="10"]',
            'option[value="15"]',
            
            // Buttons
            '#startBtn span:last-child',
            '#stopBtn span:last-child',
            '#toggleTokenBtn',
            '#getTokenBtn',
            '#testTokenBtn',
            '#exportBtn span:last-child',
            '#removeDuplicatesBtn span:last-child',
            '#clearCodesBtn span:last-child',
            '#addSampleBtn span:last-child',
            
            // Stats labels
            '.stat-label',
            
            // Filter buttons
            '.filter-btn',
            
            // Table headers
            '.results-table th',
            
            // Section headers
            '.results-header h2',
            '.input-header h3',
            
            // Other text elements
            '#progressText',
            '#resultsCount',
            '#codesCount'
        ];
        
        elementsToTranslate.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const currentText = element.textContent.trim();
                const translatedText = this.translate(currentText);
                if (translatedText !== currentText) {
                    element.textContent = translatedText;
                }
            });
        });
        
        // Translate placeholders
        this.translatePlaceholders();
        
        // Translate ad popup
        this.translateAdPopup();
    }
    
    translatePlaceholders() {
        // Search input placeholder
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const currentPlaceholder = searchInput.placeholder;
            const translatedPlaceholder = this.translate(currentPlaceholder);
            if (translatedPlaceholder !== currentPlaceholder) {
                searchInput.placeholder = translatedPlaceholder;
            }
        }
        
        // Token input placeholder
        const authTokenInput = document.getElementById('authToken');
        if (authTokenInput) {
            const currentPlaceholder = authTokenInput.placeholder;
            const translatedPlaceholder = this.translate(currentPlaceholder);
            if (translatedPlaceholder !== currentPlaceholder) {
                authTokenInput.placeholder = translatedPlaceholder;
            }
        }
    }
    
    translateAdPopup() {
        // Ad popup elements
        const adElements = [
            '.ad-header h3',
            '.ad-item h4',
            '.ad-item p',
            '.ad-btn',
            '.ad-cta small'
        ];
        
        adElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const currentText = element.textContent.trim();
                const translatedText = this.translate(currentText);
                if (translatedText !== currentText) {
                    element.textContent = translatedText;
                }
            });
        });
    }
    
    translate(text) {
        return translations[this.currentLanguage][text] || text;
    }
}

// Initialize the application
let promoChecker;
let languageManager;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize language manager first
    languageManager = new LanguageManager();
    
    // Then initialize promo checker
    promoChecker = new PromoChecker();
});

