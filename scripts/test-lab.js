const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = process.env.LAB_HOST || '127.0.0.1';
const PORT = parseInt(process.env.LAB_PORT || '3075', 10);
const logResults = [];

function logTest(name, passed, details = '') {
  const result = { name, passed, details };
  logResults.push(result);
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name} ${details ? '- ' + details : ''}`);
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('  AUTOMATED TESTING SUITE — NAULI CYBER RANGE LAB ');
  console.log('==================================================\n');

  let serverAvailable = false;

  // Test 1: Health Check & Connection Validation
  try {
    const health = await request({ hostname: HOST, port: PORT, path: '/health', method: 'GET' });
    const isOk = health.statusCode === 200 && health.body.includes('"ok":true');
    logTest('Health Check (/health)', isOk, `Status Code: ${health.statusCode}`);
    if (isOk) serverAvailable = true;
  } catch (err) {
    logTest('Health Check (/health)', false, `Connection Refused: ${err.message}. Ensure app server is running on port ${PORT}.`);
  }

  if (serverAvailable) {
    try {
      // Test 2: Response Header Technology Disclosure
      const home = await request({ hostname: HOST, port: PORT, path: '/', method: 'GET' });
      const xPoweredBy = home.headers['x-powered-by'];
      logTest('Response Header (X-Powered-By)', xPoweredBy === 'SCENARIO75{Node.js}', `Header: ${xPoweredBy}`);

      // Test 3: Pre-MFA Cookie Initialization & Security Settings
      const setCookie = home.headers['set-cookie'] ? home.headers['set-cookie'][0] : '';
      const hasPreMfaCookie = setCookie.includes('pre_mfa_session=pending_mfa_verification');
      const isHttpOnlyFalse = !setCookie.includes('HttpOnly');
      logTest('Pre-MFA Cookie Initialization', hasPreMfaCookie && isHttpOnlyFalse, `Set-Cookie: ${setCookie}`);

      // Test 4: Robots.txt Disallowed Path
      const robots = await request({ hostname: HOST, port: PORT, path: '/robots.txt', method: 'GET' });
      logTest('Robots.txt Disallowed Path', robots.body.includes('Disallow: /api/verify-mfa'), `Contains Disallow: /api/verify-mfa`);

      // Test 5: WAF Block on <script> Payload (HTTP 403)
      const scriptPayload = 'feedback=' + encodeURIComponent('<script>alert("xss")</script>');
      const wafBlock = await request({
        hostname: HOST, port: PORT, path: '/feedback', method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(scriptPayload) }
      }, scriptPayload);
      logTest('WAF Block on <script> Tag', wafBlock.statusCode === 403, `Status Code: ${wafBlock.statusCode}`);

      // Test 6: WAF Bypass using HTML5 <svg> Tag (HTTP 200)
      const svgPayload = 'feedback=' + encodeURIComponent('<svg onload="window[\'docu\'+\'ment\'][\'coo\'+\'kie\']">');
      const wafBypass = await request({
        hostname: HOST, port: PORT, path: '/feedback', method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(svgPayload) }
      }, svgPayload);
      logTest('WAF Bypass using <svg> Tag', wafBypass.statusCode === 200 && wafBypass.body.includes('Feedback Received'), `Status Code: ${wafBypass.statusCode}`);

      // Test 7: Unauthorized Dashboard Access (HTTP 401)
      const dashUnauthorized = await request({
        hostname: HOST, port: PORT, path: '/dashboard', method: 'GET',
        headers: { 'Cookie': 'pre_mfa_session=pending_mfa_verification' }
      });
      logTest('Dashboard Unauthorized Access Control (HTTP 401)', dashUnauthorized.statusCode === 401, `Status Code: ${dashUnauthorized.statusCode}`);

      // Test 8: Authorized Dashboard Session Replay Access & Red Flag Verification
      const dashAuthorized = await request({
        hostname: HOST, port: PORT, path: '/dashboard', method: 'GET',
        headers: { 'Cookie': 'pre_mfa_session=pending_mfa_verification; adm_sess=adm_sess_stolen_admin_token' }
      });
      const hasRedFlag = dashAuthorized.body.includes('SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}');
      const hasXssContainer = dashAuthorized.body.includes('xss-payload');
      logTest('Dashboard Session Replay Access & Victory Flag', dashAuthorized.statusCode === 200 && hasRedFlag && hasXssContainer, `Status Code: ${dashAuthorized.statusCode}, Flag Present: ${hasRedFlag}`);

    } catch (err) {
      logTest('HTTP Application Integration Tests', false, `Execution error: ${err.message}`);
    }
  } else {
    console.log('⚠️ Skipping HTTP application tests because the server is not running.\n');
  }

  // File & Log Telemetry Tests (Independent of running HTTP server)
  const logsDir = path.join(__dirname, '..', 'logs');
  const accessLogPath = path.join(logsDir, 'access.log');
  const errorLogPath = path.join(logsDir, 'error.log');

  const accessLogExists = fs.existsSync(accessLogPath);
  const errorLogExists = fs.existsSync(errorLogPath);
  logTest('Log Files Existence Check', accessLogExists && errorLogExists, `access.log: ${accessLogExists}, error.log: ${errorLogExists}`);

  if (accessLogExists && errorLogExists) {
    const accessContent = fs.readFileSync(accessLogPath, 'utf8');
    const errorContent = fs.readFileSync(errorLogPath, 'utf8');

    // Test 10: Telemetry IPs & Baseline Traffic Check
    const hasAttackerIP = accessContent.includes('10.10.14.50');
    const hasBaselineIP = accessContent.includes('192.168.1.100');
    logTest('Telemetry IP Addresses Verification', hasAttackerIP && hasBaselineIP, `Attacker 10.10.14.50: ${hasAttackerIP}, Baseline 192.168.1.100: ${hasBaselineIP}`);

    // Test 11: Exact Dashboard Log Event Timestamp & Status Code
    const hasDashboardTimestamp = accessContent.includes('18:51:55') && accessContent.includes('GET /dashboard HTTP/1.1" 200');
    logTest('Dashboard Forensic Log Event (18:51:55)', hasDashboardTimestamp, `Timestamp 18:51:55 HTTP 200 Present: ${hasDashboardTimestamp}`);

    // Test 12: Absence of Attacker Request to /api/verify-mfa
    const attackerMfaRequests = accessContent.split('\n').filter(line => line.includes('10.10.14.50') && line.includes('/api/verify-mfa'));
    logTest('Absence of Attacker Requests to /api/verify-mfa', attackerMfaRequests.length === 0, `Matching MFA Request Count: ${attackerMfaRequests.length}`);

    // Test 13: Error Log WAF Block & Critical Anomaly Markers
    const hasWafErrorTime = errorContent.includes('18:50:15') && errorContent.includes('[WAF] blocked <script>');
    const hasCriticalAnomaly = errorContent.includes('18:53:10') && errorContent.includes('[CRITICAL]') && errorContent.includes('Authentication bypass anomaly');
    logTest('Error Log Critical Anomaly & WAF Telemetry', hasWafErrorTime && hasCriticalAnomaly, `WAF Block 18:50:15: ${hasWafErrorTime}, Anomaly 18:53:10: ${hasCriticalAnomaly}`);

    // Test 14: PDF Page 4 Raw Base64 Forensic String Integrity
    const rawPdfBase64 = 'UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}';
    const hasPdfRawBase64 = accessContent.includes(rawPdfBase64);
    logTest('PDF Page 4 Raw Base64 Header String Integrity', hasPdfRawBase64, `Payload Present in access.log: ${hasPdfRawBase64}`);

    // Test 15: Base64 Payload Decoding & Specification Discrepancy Analysis
    let decodingValid = false;
    let decodedValue = '';
    try {
      // Strip trailing formatting artifact '}' for standard Base64 decoding
      const cleanBase64 = rawPdfBase64.replace(/\}$/, '');
      decodedValue = Buffer.from(cleanBase64, 'base64').toString('utf8');
      decodingValid = decodedValue === 'PHANTOMGRID{BLUE_L0g_Hunt3r_M4st3r}';
    } catch (e) {
      decodingValid = false;
    }
    logTest('Base64 Decoding & Discrepancy Verification', decodingValid, `Decoded PDF Page 4 Value: "${decodedValue}" (Expected Submission Flag on Page 5: "SCENARIO75{BLUE_L0G_HUnt3r_M4st3r}")`);
  }

  console.log('\n==================================================');
  const totalPassed = logResults.filter(r => r.passed).length;
  const totalFailed = logResults.filter(r => !r.passed).length;
  console.log(`  SUMMARY: ${totalPassed} / ${logResults.length} TESTS PASSED | ${totalFailed} FAILED`);
  console.log('==================================================\n');

  if (totalFailed > 0) {
    console.error(`❌ Automated test suite completed with ${totalFailed} failure(s). Returning exit code 1.\n`);
    process.exit(1);
  } else {
    console.log(`✅ All ${totalPassed} automated tests passed successfully. Returning exit code 0.\n`);
    process.exit(0);
  }
}

runTests();
