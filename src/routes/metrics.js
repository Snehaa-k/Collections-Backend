const express = require('express');
const metricsCollector = require('../middleware/metrics');
const { authenticateToken, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/metrics', (req, res) => {
  res.json(metricsCollector.getMetrics());
});

router.get('/dashboard', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Collections API - System Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #f0f2f5; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .metric-card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric-item { text-align: center; padding: 15px; background: #ecf0f1; border-radius: 6px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 12px; color: #7f8c8d; margin-top: 5px; }
        .status-good { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-error { color: #e74c3c; }
        .explanation { background: #e8f4fd; padding: 15px; border-left: 4px solid #3498db; margin: 10px 0; }
        .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        canvas { max-height: 300px; }
        .refresh-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Collections API System Dashboard</h1>
        <p>Real-time monitoring of your high-performance API</p>
    </div>
    
    <div class="container">
        <div class="explanation">
            <h3>📊 What This Dashboard Shows:</h3>
            <ul>
                <li><strong>Total Requests:</strong> Number of API calls received</li>
                <li><strong>Error Rate:</strong> Percentage of failed requests (should be <5%)</li>
                <li><strong>Response Time:</strong> How fast your API responds (should be <200ms)</li>
                <li><strong>Memory Usage:</strong> RAM consumption (should be stable)</li>
                <li><strong>Uptime:</strong> How long the server has been running</li>
            </ul>
        </div>
        
        <div class="metric-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>📈 Current Performance Metrics</h3>
                <button class="refresh-btn" id="refreshBtn">🔄 Refresh</button>
            </div>
            <div class="metrics-grid" id="current-metrics">
                <div class="metric-item">
                    <div class="metric-value">Loading...</div>
                    <div class="metric-label">Please wait</div>
                </div>
            </div>
        </div>
        
        <div class="charts">
            <div class="metric-card">
                <h3>💾 Memory Usage Over Time</h3>
                <p style="font-size: 12px; color: #7f8c8d;">Shows how much RAM your API is using</p>
                <canvas id="memoryChart"></canvas>
            </div>
            <div class="metric-card">
                <h3>⚡ API Performance</h3>
                <p style="font-size: 12px; color: #7f8c8d;">Live updates every 30 seconds</p>
                <div id="performance-info"></div>
            </div>
        </div>
    </div>

    <script>
        let memoryChart = null;
        
        async function loadMetrics() {
            try {
                const response = await fetch('/metrics');
                const data = await response.json();
                
                // Status indicators
                const errorStatus = data.errorRate < 5 ? 'status-good' : data.errorRate < 15 ? 'status-warning' : 'status-error';
                const responseStatus = data.avgResponseTime < 200 ? 'status-good' : data.avgResponseTime < 500 ? 'status-warning' : 'status-error';
                
                document.getElementById('current-metrics').innerHTML = \`
                    <div class="metric-item">
                        <div class="metric-value">\${data.requests.toLocaleString()}</div>
                        <div class="metric-label">Total Requests</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value \${errorStatus}">\${data.errorRate.toFixed(1)}%</div>
                        <div class="metric-label">Error Rate</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value \${responseStatus}">\${data.avgResponseTime.toFixed(0)}ms</div>
                        <div class="metric-label">Avg Response Time</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">\${Math.floor(data.uptime / 3600)}h \${Math.floor((data.uptime % 3600) / 60)}m</div>
                        <div class="metric-label">Uptime</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">\${data.errors}</div>
                        <div class="metric-label">Total Errors</div>
                    </div>
                \`;
                
                // Performance info
                document.getElementById('performance-info').innerHTML = \`
                    <div style="padding: 15px; background: #f8f9fa; border-radius: 6px;">
                        <h4>🎯 Performance Status:</h4>
                        <p><strong>API Health:</strong> <span class="\${errorStatus}">\${data.errorRate < 5 ? '✅ Excellent' : data.errorRate < 15 ? '⚠️ Warning' : '❌ Critical'}</span></p>
                        <p><strong>Speed:</strong> <span class="\${responseStatus}">\${data.avgResponseTime < 200 ? '🚀 Fast' : data.avgResponseTime < 500 ? '⏳ Moderate' : '🐌 Slow'}</span></p>
                        <p><strong>Requests/Hour:</strong> ~\${Math.round((data.requests / (data.uptime / 3600))).toLocaleString()}</p>
                    </div>
                \`;
                
                // Memory chart
                if (data.memoryUsage && data.memoryUsage.length > 0) {
                    const memCtx = document.getElementById('memoryChart').getContext('2d');
                    
                    if (memoryChart) {
                        memoryChart.destroy();
                    }
                    
                    memoryChart = new Chart(memCtx, {
                        type: 'line',
                        data: {
                            labels: data.memoryUsage.map(m => new Date(m.timestamp).toLocaleTimeString()),
                            datasets: [{
                                label: 'Memory Used (MB)',
                                data: data.memoryUsage.map(m => (m.heapUsed / 1024 / 1024).toFixed(1)),
                                borderColor: '#3498db',
                                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Memory (MB)'
                                    }
                                }
                            }
                        }
                    });
                }
                
            } catch (error) {
                document.getElementById('current-metrics').innerHTML = '<div class="metric-item"><div class="metric-value status-error">Error</div><div class="metric-label">Failed to load data</div></div>';
            }
        }
        
        // Add event listener for refresh button
        document.getElementById('refreshBtn').addEventListener('click', loadMetrics);
        
        // Load metrics immediately and then every 30 seconds
        loadMetrics();
        setInterval(loadMetrics, 30000);
    </script>
</body>
</html>`;
  
  res.send(html);
});

// Simple login page
router.get('/login', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Collections API - Login</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f0f2f5; margin: 0; padding: 50px; }
        .login-container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #2980b9; }
        .credentials { background: #e8f4fd; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .error { color: #e74c3c; margin-top: 10px; }
        .success { color: #27ae60; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>🔐 Collections API Login</h2>
        
        <div class="credentials">
            <h4>Test Credentials:</h4>
            <p><strong>Email:</strong> admin@test.com</p>
            <p><strong>Password:</strong> admin123</p>
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label>Email:</label>
                <input type="email" id="email" value="admin@test.com" required>
            </div>
            
            <div class="form-group">
                <label>Password:</label>
                <input type="password" id="password" value="admin123" required>
            </div>
            
            <button type="submit">Login</button>
        </form>
        
        <div id="message"></div>
        
        <div style="margin-top: 30px; text-align: center;">
            <p><a href="/dashboard">📊 Go to Dashboard</a></p>
            <p><a href="/api-docs">📚 API Documentation</a></p>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.innerHTML = '<div class="success">✅ Login successful! Token: ' + data.token.substring(0, 20) + '...</div>';
                    localStorage.setItem('authToken', data.token);
                    
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                } else {
                    messageDiv.innerHTML = '<div class="error">❌ ' + data.error + '</div>';
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error">❌ Login failed: ' + error.message + '</div>';
            }
        });
    </script>
</body>
</html>`;
  
  res.send(html);
});

module.exports = router;