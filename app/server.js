const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3075;
const LOG_DIR = process.env.LOG_DIR || '/opt/admin/logs';

try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (e) {}

const accessLog = path.join(LOG_DIR, 'access.log');
const errorLog = path.join(LOG_DIR, 'error.log');

app.disable('x-powered-by');
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// Shared UI CSS Theme (Modern Cyber Dark Glassmorphism)
const STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
    
    :root {
      --bg-dark: #0a0e17;
      --bg-card: rgba(18, 26, 43, 0.75);
      --border-card: rgba(45, 62, 95, 0.5);
      --accent-cyan: #00f0ff;
      --accent-purple: #7000ff;
      --accent-red: #ff2a5f;
      --text-main: #f0f4fc;
      --text-muted: #8c9ba5;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at 50% 0%, #151d30 0%, #0a0e17 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(10, 14, 23, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-card);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.25rem;
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: 900;
      -webkit-text-fill-color: #000;
    }
    nav a {
      color: var(--text-muted);
      text-decoration: none;
      margin-left: 1.5rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: var(--accent-cyan); }
    
    .container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      flex: 1;
    }
    .hero {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .hero h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .hero p {
      color: var(--text-muted);
      font-size: 1.1rem;
    }
    
    .card {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-card);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      margin-bottom: 2rem;
    }
    .card-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--accent-cyan);
    }
    
    form label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    textarea, input[type="text"] {
      width: 100%;
      background: rgba(10, 14, 23, 0.6);
      border: 1px solid var(--border-card);
      border-radius: 8px;
      padding: 0.8rem 1rem;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea:focus, input[type="text"]:focus {
      border-color: var(--accent-cyan);
    }
    .btn {
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
      color: #000;
      font-weight: 700;
      border: none;
      padding: 0.8rem 1.8rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: transform 0.2s, opacity 0.2s;
    }
    .btn:hover { transform: translateY(-2px); opacity: 0.9; }
    
    .status-badge {
      display: inline-block;
      padding: 0.35rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-success { background: rgba(0, 240, 255, 0.15); color: var(--accent-cyan); border: 1px solid var(--accent-cyan); }
    .badge-error { background: rgba(255, 42, 95, 0.15); color: var(--accent-red); border: 1px solid var(--accent-red); }

    .xss-payload {
      background: rgba(0, 0, 0, 0.4);
      border: 1px dashed var(--accent-purple);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      font-family: 'JetBrains Mono', monospace;
    }

    .flag-box {
      background: linear-gradient(135deg, rgba(112, 0, 255, 0.2), rgba(0, 240, 255, 0.2));
      border: 1px solid var(--accent-cyan);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
      margin-top: 1.5rem;
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
    }
    
    footer {
      border-top: 1px solid var(--border-card);
      padding: 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: auto;
    }
  </style>
`;

function logAccess(req, status, extra = '') {
  try {
    const ip = req.headers['x-lab-client-ip'] || req.ip || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Mozilla/5.0';
    const xff = req.headers['x-forwarded-for'] || '-';
    const line = `${new Date().toISOString()} ${ip} "${req.method} ${req.originalUrl} HTTP/1.1" ${status} "${ua}" "X-Forwarded-For:${xff}" ${extra}\n`;
    fs.appendFileSync(accessLog, line);
  } catch (err) {
    // Ignore log write errors in isolated test runners
  }
}

function logError(message) {
  try {
    fs.appendFileSync(errorLog, `${new Date().toISOString()} ${message}\n`);
  } catch (err) {
    // Ignore log write errors in isolated test runners
  }
}

// Global response header hook
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'SCENARIO75{Node.js}');
  res.on('finish', () => logAccess(req, res.statusCode));
  next();
});

// Homepage: Admin Feedback System Portal
app.get('/', (req, res) => {
  if (!req.cookies.pre_mfa_session) {
    res.cookie('pre_mfa_session', 'pending_mfa_verification', {
      httpOnly: false, sameSite: 'lax', secure: false, path: '/'
    });
  }
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PT Nauli Mula Data — Admin Feedback System</title>
  ${STYLES}
</head>
<body>
<!--
  ____  ____  ____ 
 / ___||  _ \\|  _ \\     Hint: inspect robots.txt
 \\___ \\| |_) | |_) |
 |___/ |____/|____/
-->
  <header>
    <div class="brand">
      <div class="brand-icon">N</div>
      <span>PT Nauli Mula Data</span>
    </div>
    <nav>
      <a href="/" class="active">Feedback System</a>
      <a href="/dashboard">Admin Dashboard</a>
    </nav>
  </header>

  <div class="container">
    <div class="hero">
      <h1>Admin Feedback Portal</h1>
      <p>Internal Cyber Range Training Environment & Security Audit System</p>
    </div>

    <div class="card">
      <div class="card-title">
        <span>⚡ Submit Administrator Feedback</span>
      </div>
      <form method="POST" action="/feedback">
        <label for="feedback">Enter system feedback, security observations, or bug reports:</label>
        <textarea id="feedback" name="feedback" rows="5" placeholder="e.g. System security audit completed..."></textarea>
        <button type="submit" class="btn">Submit Feedback</button>
      </form>
    </div>

    <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">Restricted Administrative Portal</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Requires authenticated pre-MFA or administrative session token.</p>
      </div>
      <a href="/dashboard" class="btn" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--border-card);">Access Dashboard</a>
    </div>
  </div>

  <footer>
    <p>PT Nauli Mula Data &copy; 2026 — Internal Security Training Cyber Range</p>
  </footer>
</body>
</html>`);
});

// robots.txt route
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /api/verify-mfa\n');
});

// Feedback Endpoint (POST only)
app.post('/feedback', (req, res) => {
  const feedback = String(req.body.feedback || '');
  
  // WAF logic: Block standard <script> tag
  if (/<script\b/i.test(feedback)) {
    logError(`[WAF] blocked <script> tag from ${req.headers['x-lab-client-ip'] || req.ip} status=403`);
    return res.status(403).type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>403 Forbidden — WAF Intercepted</title>
  ${STYLES}
</head>
<body>
  <header>
    <div class="brand"><div class="brand-icon">N</div><span>PT Nauli Mula Data</span></div>
  </header>
  <div class="container">
    <div class="card" style="border-color: var(--accent-red); text-align: center; padding: 3rem;">
      <span class="status-badge badge-error" style="margin-bottom: 1rem;">HTTP 403 Forbidden</span>
      <h2 style="font-size: 1.8rem; margin-bottom: 1rem; color: var(--accent-red);">WAF Security Block</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Malicious script execution detected: <code>&lt;script&gt;</code> tags are prohibited by training WAF rules.</p>
      <a href="/" class="btn" style="background: var(--accent-red); color: #fff;">Return to Safety</a>
    </div>
  </div>
</body>
</html>`);
  }

  // Store in memory for unsafe reflected XSS rendering in dashboard
  app.locals.lastFeedback = feedback;
  
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Feedback Received</title>
  ${STYLES}
</head>
<body>
  <header>
    <div class="brand"><div class="brand-icon">N</div><span>PT Nauli Mula Data</span></div>
  </header>
  <div class="container">
    <div class="card">
      <span class="status-badge badge-success" style="margin-bottom: 1rem;">Submission Successful</span>
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Feedback Received</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">Your feedback has been registered in the system memory:</p>
      <div class="feedback" style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-card); margin-bottom: 1.5rem;">
        ${feedback}
      </div>
      <a href="/" class="btn">Back to Form</a>
    </div>
  </div>
</body>
</html>`);
});

// API MFA Verification (Should be skipped in session replay attack)
app.get('/api/verify-mfa', (req, res) => {
  res.status(401).json({ verified: false, message: 'MFA verification required' });
});

// Dashboard Route (Restricted Admin Area - CTF Flag Protected)
app.get('/dashboard', (req, res) => {
  const adminCookie = req.cookies.adm_sess || '';

  // CTF Challenge Logic:
  // Accessing /dashboard with only pre_mfa_session or no cookies returns 401.
  // Access requires a valid admin session cookie starting with prefix 'adm_sess' (SCENARIO75{adm_sess}).
  // This simulates the MFA Bypass via Cookie Reuse: replaying the stolen admin session bypasses /api/verify-mfa.
  if (adminCookie.startsWith('adm_sess')) {
    logError(`CRITICAL Cookie reuse event from ${req.headers['x-lab-client-ip'] || req.ip}; Authentication bypass anomaly; /api/verify-mfa not reached`);
    
    const payload = String(app.locals.lastFeedback || '<p style="color:var(--text-muted)">No XSS payload stored yet. Submit payload via /feedback first.</p>');
    
    return res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Admin Dashboard — PT Nauli Mula Data</title>
  ${STYLES}
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">N</div>
      <span>PT Nauli Mula Data</span>
    </div>
    <nav>
      <a href="/">Feedback System</a>
      <a href="/dashboard" class="active">Admin Dashboard</a>
    </nav>
  </header>

  <div class="container">
    <div class="hero">
      <span class="status-badge badge-success" style="margin-bottom: 0.5rem;">Admin Session Verified (MFA Bypassed via Cookie Reuse)</span>
      <h1>Administrative Dashboard</h1>
      <p>Internal Security Audit & Log Forensics Control Center</p>
    </div>

    <div class="card">
      <div class="card-title">
        <span>🔍 Reflected Security Observation (XSS Container)</span>
      </div>
      <p style="color: var(--text-muted); margin-bottom: 0.75rem;">Content rendered from stored feedback buffer inside target container <code>.xss-payload</code>:</p>
      <div class="xss-payload">
        ${payload}
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <span>🏆 Red Team Final Victory Flag</span>
      </div>
      <p style="color: var(--text-muted);">Cookie reuse exploit chain completed. /api/verify-mfa was successfully bypassed.</p>
      <div class="flag-box">
        SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}
      </div>
    </div>
  </div>

  <footer>
    <p>PT Nauli Mula Data &copy; 2026 — Internal Security Training Cyber Range</p>
  </footer>
</body>
</html>`);
  }

  // If no adm_sess cookie is present (e.g. user only has pre_mfa_session), deny access with 401
  res.status(401).type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>401 Unauthorized — MFA Required</title>
  ${STYLES}
</head>
<body>
  <header><div class="brand"><div class="brand-icon">N</div><span>PT Nauli Mula Data</span></div></header>
  <div class="container">
    <div class="card" style="text-align: center; padding: 3rem; border-color: var(--accent-red);">
      <span class="status-badge badge-error" style="margin-bottom: 1rem;">HTTP 401 Unauthorized</span>
      <h2 style="font-size: 1.8rem; margin-bottom: 1rem; color: var(--accent-red);">Access Denied: MFA Verification Required</h2>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Your session (<code>pre_mfa_session=pending_mfa_verification</code>) has not completed Multi-Factor Authentication.</p>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Required endpoint: <code>/api/verify-mfa</code> or valid admin session (<code>adm_sess_*</code>).</p>
      <div style="display:flex; justify-content:center; gap: 1rem;">
        <a href="/" class="btn">Return to Home</a>
        <form method="POST" action="/lab/replay" style="display:inline;">
          <button type="submit" class="btn" style="background: linear-gradient(135deg, var(--accent-purple), var(--accent-red)); color:#fff;">Simulate Cookie Replay Attack</button>
        </form>
      </div>
    </div>
  </div>
</body>
</html>`);
});

// Replay helper endpoint (Simulates Red Team replaying stolen adm_sess cookie)
app.post('/lab/replay', (req, res) => {
  const trainingCookie = req.cookies.pre_mfa_session;
  if (trainingCookie !== 'pending_mfa_verification') return res.status(403).send('Missing pre_mfa_session cookie');
  res.cookie('adm_sess', 'adm_sess_stolen_admin_token_75', { httpOnly: true, sameSite: 'lax', path: '/' });
  logError(`CRITICAL Cookie reuse event; Authentication bypass anomaly; simulated replay helper used`);
  res.redirect('/dashboard');
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, service: 'nauli-cyber-range' }));

app.listen(PORT, '0.0.0.0', () => console.log(`Training lab listening on ${PORT}`));
