# PT Nauli Mula Data — Cyber Range Engineering Assessment
## Scenario Brief: Cookies Reuse & MFA Bypass (Admin Feedback System)

> **Training Environment Warning:** This application is intentionally vulnerable and designed exclusively for local, authorized training and technical assessment. Do not expose this application to the public internet.

---

## 1. Executive Overview & Architecture

This repository contains a containerized "Red vs. Blue" Capture The Flag (CTF) Cyber Range Lab built for **PT Nauli Mula Data**. The lab demonstrates a critical flaw in a corporate **Admin Feedback System**: while Multi-Factor Authentication (MFA) is enforced, session token validation contains a flaw that allows session token replay (`adm_sess`) to completely bypass the MFA verification endpoint (`/api/verify-mfa`).

### System Topology:
- **Web Application (`admin-feedback`):** Node.js 20 Express App listening on HTTP Port `3075`.
- **Blue Team Forensic Shell (`blue-ssh`):** OpenSSH server container listening on TCP Port `2275` (Credentials: `analyst` / `blue_team_rocks`).
- **Telemetry Log Volume:** `./logs` mounted at `/opt/admin/logs` in both containers.

---

## 2. Quickstart & Deployment Instructions

### Prerequisites
- Docker Engine (v24.0+) & Docker Compose (v2.20+)
- Linux OS or Windows Desktop with Docker Desktop enabled.

### Deployment Commands

#### On Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-logs.ps1
docker compose up --build -d
docker compose ps
```

#### On Linux / macOS:
```bash
chmod +x scripts/generate-logs.sh
./scripts/generate-logs.sh
docker compose up --build -d
docker compose ps
```

### Access Endpoints
- **Web Application Portal:** `http://localhost:3075/`
- **Health Check Endpoint:** `http://localhost:3075/health`
- **Blue Team SSH Shell:** `ssh analyst@localhost -p 2275` (Password: `blue_team_rocks`)

---

## 3. Red Team Attack Walkthrough (Exploit Chain)

1. **Phase 1: Reconnaissance**
   - Perform HTTP header inspection: `curl -I http://localhost:3075/`. Observe `X-Powered-By: SCENARIO75{Node.js}`.
   - Inspect `/robots.txt`: Observe `Disallow: /api/verify-mfa` (`SCENARIO75{/api/verify-mfa}`).
   - View Page Source on `/`: Observe ASCII comment `Hint: inspect robots.txt` (`SCENARIO75{robots.txt}`).
   - Observe pre-auth cookie set: `pre_mfa_session=pending_mfa_verification` (`HttpOnly=false`).

2. **Phase 2: WAF Evasion & XSS Injection**
   - Submit standard `<script>` payload to `POST /feedback` (`SCENARIO75{POST}`). WAF intercepts with `HTTP 403 Forbidden` (`SCENARIO75{403}`).
   - Bypass WAF using HTML5 `<svg>` element (`SCENARIO75{<svg>}`): `<svg onload="window['docu'+'ment']['coo'+'kie']">`.
   - Utilize JavaScript bracket notation (`SCENARIO75{window['docu'+'ment']['coo'+'kie']}`) and `fetch()` (`SCENARIO75{fetch}`) to exfiltrate cookies.

3. **Phase 3: MFA Bypass & Session Replay**
   - Attempting to visit `/dashboard` without an admin token returns `HTTP 401 Unauthorized`.
   - Inject/replay an admin session cookie starting with `adm_sess` (`SCENARIO75{adm_sess}`), e.g. `adm_sess=adm_sess_stolen_admin_token` (or click "Simulate Cookie Replay Attack").
   - The backend completely skips `/api/verify-mfa` verification, reflects the payload inside `.xss-payload` (`SCENARIO75{xss-payload}`), and displays the victory flag:
     `SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}`

---

## 4. Blue Team Log Forensics & Base64 Decoding

1. **SSH Connection & Log Discovery:**
   - Connect via SSH: `ssh analyst@localhost -p 2275` (Password: `blue_team_rocks`).
   - Navigate to `/opt/admin/logs` (`SCENARIO75{/opt/admin/logs}`).

2. **Forensic Log Correlation:**
   - Inspect `access.log`: Identify attacker IP `10.10.14.50` (`SCENARIO75{10.10.14.50}`) with User-Agent `Mozilla/5.0` (`SCENARIO75{Mozilla/5.0}`).
   - Locate successful dashboard access `200` (`SCENARIO75{200}`) at timestamp `18:51:55` (`SCENARIO75{18:51:55}`).
   - Extract `X-Forwarded-For` Base64 header: `UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}` (`SCENARIO75{UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}`). String length is 44 characters (`SCENARIO75{44}`).
   - Inspect `error.log`: WAF block for `<script>` (`SCENARIO75{<script>}`) recorded at `18:50:15` (`SCENARIO75{18:50:15}`).
   - Confirm attacker **never** (`No`) reached `/api/verify-mfa` (`SCENARIO75{No}`).
   - Anomaly warning string at `18:53:10` (`SCENARIO75{18:53:10}`) with severity `CRITICAL` (`SCENARIO75{CRITICAL}`): `Authentication bypass anomaly` (`SCENARIO75{Authentication bypass anomaly}`).

3. **Base64 Payload Decoding & Assessment Flag Mapping:**
   - Execute Base64 decoding in SSH shell:
     ```bash
     echo "UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0" | base64 -d
     ```
   - Raw Decoded Payload in Log: `PHANTOMGRID{BLUE_L0g_Hunt3r_M4st3r}`
   - Assessment Submission Format: `SCENARIO75{BLUE_L0G_HUnt3r_M4st3r}`


---

## 5. Proxmox Hypervisor Deployment Guide

1. Create a Linux VM on Proxmox VE (2 vCPUs, 2GB RAM, 20GB Disk).
2. Install Docker & Docker Compose:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
   ```
3. Clone repository and launch services:
   ```bash
   git clone <YOUR_REPOSITORY_URL> nauli-cyber-range
   cd nauli-cyber-range
   chmod +x scripts/generate-logs.sh
   ./scripts/generate-logs.sh
   docker compose up --build -d
   ```

---

## 6. Automated Testing

To run the automated endpoint and log verification suite:
```bash
node scripts/test-lab.js
```
