let charChart, timeChart, factorsChart;
let isPasswordVisible = false;

// Initialize when page loads
window.onload = function() {
    initCharts();
    checkServerStatus();
};

// Check if Java backend is running
async function checkServerStatus() {
    const statusBadge = document.getElementById('serverStatus');
    if (!statusBadge) return;
    
    try {
        const response = await fetch('http://localhost:8080/analyze?password=test', { method: 'GET', mode: 'cors' });
        if (response.ok) {
            statusBadge.innerHTML = '<span class="status-dot" style="background: #48bb78;"></span> Backend Connected ✅ (Auto-saving to CSV)';
        } else {
            statusBadge.innerHTML = '<span class="status-dot" style="background: #ed8936;"></span> Backend Not Available';
        }
    } catch (error) {
        statusBadge.innerHTML = '<span class="status-dot" style="background: #f56565;"></span> Backend Offline - Start Java server for CSV saving';
    }
}

// Initialize all charts
function initCharts() {
    const charCtx = document.getElementById('charDistributionChart').getContext('2d');
    charChart = new Chart(charCtx, {
        type: 'doughnut',
        data: {
            labels: ['Uppercase', 'Lowercase', 'Numbers', 'Special'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#f56565', '#48bb78', '#4299e1', '#ed8936'],
                borderWidth: 3,
                borderColor: 'white',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 12 } } },
                tooltip: { callbacks: { label: function(context) { return `${context.label}: ${context.raw} characters`; } } }
            }
        }
    });

    const timeCtx = document.getElementById('crackTimeChart').getContext('2d');
    timeChart = new Chart(timeCtx, {
        type: 'bar',
        data: {
            labels: ['Brute Force', 'Dictionary', 'Hybrid'],
            datasets: [{
                label: 'Time to Crack (seconds)',
                data: [0, 0, 0],
                backgroundColor: ['#667eea', '#48bb78', '#ed8936'],
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: { callbacks: { label: function(context) { return `Time: ${formatTime(context.raw)}`; } } }
            },
            scales: {
                y: { type: 'logarithmic', title: { display: true, text: 'Time (seconds - log scale)', font: { size: 11 } } }
            }
        }
    });

    const factorsCtx = document.getElementById('complexityFactorsChart').getContext('2d');
    factorsChart = new Chart(factorsCtx, {
        type: 'radar',
        data: {
            labels: ['Length', 'Character Variety', 'Entropy', 'Complexity', 'Overall'],
            datasets: [{
                label: 'Score (0-100)',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: '#667eea',
                borderWidth: 2,
                pointBackgroundColor: '#667eea',
                pointBorderColor: 'white',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
            plugins: { tooltip: { callbacks: { label: function(context) { return `${context.label}: ${context.raw}%`; } } } }
        }
    });
}

// Main analysis function
let analysisTimeout;
async function analyzePassword() {
    const password = document.getElementById('passwordInput').value;
    
    if (password.length === 0) {
        resetDisplay();
        return;
    }
    
    clearTimeout(analysisTimeout);
    analysisTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:8080/analyze?password=${encodeURIComponent(password)}`);
            const data = await response.json();
            updateUI(data, password);
        } catch (error) {
            console.error('Backend not running:', error);
            const fallbackData = clientSideAnalysis(password);
            updateUI(fallbackData, password);
        }
    }, 500);
}

// Client-side analysis (fallback)
function clientSideAnalysis(password) {
    let upper = (password.match(/[A-Z]/g) || []).length;
    let lower = (password.match(/[a-z]/g) || []).length;
    let digits = (password.match(/[0-9]/g) || []).length;
    let special = password.length - (upper + lower + digits);
    
    let charSet = 0;
    if (upper > 0) charSet += 26;
    if (lower > 0) charSet += 26;
    if (digits > 0) charSet += 10;
    if (special > 0) charSet += 33;
    if (charSet === 0) charSet = 26;
    
    let combinations = Math.pow(charSet, password.length);
    let crackSeconds = combinations / 1000000000;
    
    let complexityScore = Math.min(100, Math.floor(
        (password.length / 20) * 25 + (charSet / 95) * 25 + (Math.log10(combinations) / 20) * 50
    ));
    
    return { upper, lower, digits, special, length: password.length, crackSeconds, complexityScore, charSet };
}

// Update entire UI
function updateUI(data, password) {
    document.getElementById('uppercaseCount').innerText = data.upper;
    document.getElementById('lowercaseCount').innerText = data.lower;
    document.getElementById('numberCount').innerText = data.digits;
    document.getElementById('specialCount').innerText = data.special;
    document.getElementById('totalLength').innerText = data.length;
    
    charChart.data.datasets[0].data = [data.upper, data.lower, data.digits, data.special];
    charChart.update();
    
    let bruteForceTime = data.crackSeconds;
    timeChart.data.datasets[0].data = [bruteForceTime, bruteForceTime * 0.1, bruteForceTime * 0.3];
    timeChart.update();
    
    let complexity = data.complexityScore || calculateComplexity(data);
    document.getElementById('complexityScore').innerText = complexity;
    
    let lengthScore = Math.min(100, (data.length / 32) * 100);
    let varietyScore = ((data.upper > 0 ? 1 : 0) + (data.lower > 0 ? 1 : 0) + (data.digits > 0 ? 1 : 0) + (data.special > 0 ? 1 : 0)) * 25;
    let entropy = Math.min(100, (Math.log2(Math.pow(data.charSet || 95, data.length)) / 100) * 100);
    
    factorsChart.data.datasets[0].data = [lengthScore, varietyScore, entropy, complexity, complexity];
    factorsChart.update();
    
    let meterBar = document.getElementById('strengthBar');
    meterBar.style.width = `${complexity}%`;
    
    if (complexity < 40) {
        meterBar.style.background = '#f56565';
        document.getElementById('strengthLabel').innerHTML = '🔴 VERY WEAK - Easily crackable';
        document.getElementById('strengthDesc').innerHTML = 'This password can be cracked in seconds. Consider making it longer and more complex.';
    } else if (complexity < 70) {
        meterBar.style.background = '#ed8936';
        document.getElementById('strengthLabel').innerHTML = '🟡 MODERATE - Could be stronger';
        document.getElementById('strengthDesc').innerHTML = 'Decent password, but add more variety to make it secure.';
    } else {
        meterBar.style.background = '#48bb78';
        document.getElementById('strengthLabel').innerHTML = '🟢 STRONG - Excellent password';
        document.getElementById('strengthDesc').innerHTML = 'This password provides excellent security against brute force attacks.';
    }
    
    let crackTimeText = formatTime(data.crackSeconds);
    document.getElementById('crackTimeDisplay').innerHTML = `<div class="time-value">${crackTimeText}</div><div class="time-label">Estimated crack time (brute force at 1B guesses/sec)</div>`;
    
    updateRecommendations(data);
}

function calculateComplexity(data) {
    let score = Math.min(25, (data.length / 20) * 25);
    score += ((data.upper > 0 ? 1 : 0) + (data.lower > 0 ? 1 : 0) + (data.digits > 0 ? 1 : 0) + (data.special > 0 ? 1 : 0)) * 6.25;
    if (data.upper > 0 && data.lower > 0) score += 10;
    if (data.digits > 0) score += 10;
    if (data.special > 0) score += 15;
    return Math.min(100, Math.floor(score));
}

function formatTime(seconds) {
    if (seconds < 1) return '< 1 second';
    if (seconds < 60) return `${Math.floor(seconds)} seconds`;
    if (seconds < 3600) return `${(seconds/60).toFixed(1)} minutes`;
    if (seconds < 86400) return `${(seconds/3600).toFixed(1)} hours`;
    if (seconds < 31536000) return `${(seconds/86400).toFixed(1)} days`;
    if (seconds < 315360000) return `${(seconds/31536000).toFixed(2)} years`;
    return `${(seconds/31536000).toFixed(1)} centuries`;
}

function updateRecommendations(data) {
    const recs = document.getElementById('recommendations');
    let recommendations = [];
    
    if (data.length < 12) recommendations.push('❌ Increase length to at least 12 characters');
    if (data.upper === 0) recommendations.push('📈 Add uppercase letters (A-Z)');
    if (data.lower === 0) recommendations.push('📉 Add lowercase letters (a-z)');
    if (data.digits === 0) recommendations.push('🔢 Include numbers (0-9)');
    if (data.special === 0) recommendations.push('✨ Add special characters (!@#$%^&*)');
    if (data.length >= 12 && data.upper > 0 && data.lower > 0 && data.digits > 0 && data.special > 0) {
        recommendations.push('✅ Excellent! This password is very strong');
    }
    if (recommendations.length === 0) recommendations.push('🎉 Perfect password! Keep it secure and unique');
    
    recs.innerHTML = '<ul>' + recommendations.map(r => `<li>${r}</li>`).join('') + '</ul>';
}

function resetDisplay() {
    document.getElementById('strengthBar').style.width = '0%';
    document.getElementById('strengthLabel').innerHTML = 'Enter a password';
    document.getElementById('strengthDesc').innerHTML = '';
    document.getElementById('complexityScore').innerText = '0';
    charChart.data.datasets[0].data = [0, 0, 0, 0];
    charChart.update();
}

function togglePasswordVisibility() {
    const input = document.getElementById('passwordInput');
    const eyeButton = document.querySelector('.toggle-visibility');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeButton.textContent = '🙈';
        isPasswordVisible = true;
    } else {
        input.type = 'password';
        eyeButton.textContent = '👁️';
        isPasswordVisible = false;
    }
}

function setExample(password) {
    document.getElementById('passwordInput').value = password;
    analyzePassword();
}