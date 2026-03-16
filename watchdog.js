const http = require('http');
const fs = require('fs');
const path = require('path');

const MONITOR_URL = 'http://localhost:3001/health';
const REPORT_PATH = path.join(__dirname, 'link_failure_report.json');
const POLLING_INTERVAL = 1000; // 1 second for high priority

console.log(`[WATCHDOG] Monitoring ${MONITOR_URL} with high priority...`);

function generateFailureReport(error) {
    const report = {
        timestamp: new Date().toISOString(),
        errorCode: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        networkStack: {
            interface: 'localhost',
            port: 3001,
            status: 'DISCONNECTED',
            stackTrace: error.stack
        },
        systemResources: {
            memory: process.memoryUsage(),
            uptime: process.uptime()
        }
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.error(`[WATCHDOG] CRITICAL: Link failure detected. Report generated at ${REPORT_PATH}`);
}

let isStable = false;

function poll() {
    http.get(MONITOR_URL, (res) => {
        if (res.statusCode === 200) {
            if (!isStable) {
                console.log('[WATCHDOG] Connection STABLE.');
                isStable = true;
            }
        } else {
            generateFailureReport({ code: `HTTP_${res.statusCode}`, message: 'Unexpected status code' });
            isStable = false;
        }
    }).on('error', (err) => {
        generateFailureReport(err);
        isStable = false;
    });

    setTimeout(poll, POLLING_INTERVAL);
}

poll();
