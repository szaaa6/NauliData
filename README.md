# PT Nauli Mula Data — Cyber Range Engineering Assessment
> **Scenario Brief:** Cookies Reuse & MFA Bypass (Admin Feedback System)  
> **Role:** Cybersecurity Engineer (Lab & Range Developer)  
> **Target Environment:** Proxmox VE / Linux Docker Compose  

---

## 📌 Executive Overview

This repository contains a self-contained, containerized **"Red vs. Blue" Capture The Flag (CTF) Cyber Range Lab** designed for **PT Nauli Mula Data**. The scenario simulates a real-world critical vulnerability in a corporate **Admin Feedback System**: while Multi-Factor Authentication (MFA) is enforced, flawed session validation logic allows an attacker to replay an administrative session token (`adm_sess`), completely bypassing the `/api/verify-mfa` verification endpoint.

### System Topology & Port Mappings

| Service Name | Container Name | Host Port | Container Port | Credentials / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `admin-feedback` | `nauli-admin-feedback` | `3075` | `3075` | Vulnerable Node.js Admin Feedback Application |
| `blue-ssh` | `nauli-blue-ssh` | `2275` | `2222` | Blue Team Forensic SSH (`analyst` / `blue_team_rocks`) |

---

## 🚀 Quickstart & Local Deployment

### Prerequisites
- Docker Engine & Docker Compose
- Node.js (v18+)

### 1. Generate Training Logs
- **On Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\generate-logs.ps1
  ```
- **On Linux / macOS:**
  ```bash
  chmod +x scripts/generate-logs.sh
  ./scripts/generate-logs.sh
  ```

### 2. Launch Docker Services
```bash
docker compose up --build -d
docker compose ps
```

### 3. Verify Local Services
- **Web Application Portal:** `http://localhost:3075/`
- **Health Check:** `http://localhost:3075/health`
- **Blue Team SSH Shell:** `ssh analyst@localhost -p 2275` *(Password: `blue_team_rocks`)*

---

## 🔴 Red Team Attack Path Walkthrough

```
[Phase 1: Recon] ➔ [Phase 2: WAF Evasion & XSS] ➔ [Phase 3: Session Replay & MFA Bypass]
```

### Phase 1: Reconnaissance
1. **Response Header Disclosure:** Inspect HTTP response headers (`curl -I http://localhost:3075/`).  
   👉 Header: `X-Powered-By: SCENARIO75{Node.js}`
2. **Hidden Directory Inspection:** Visit `/robots.txt`.  
   👉 Disallowed Path: `Disallow: /api/verify-mfa` (`SCENARIO75{/api/verify-mfa}`)  
   👉 Restricted Admin Path: `/dashboard` (`SCENARIO75{/dashboard}`)
3. **Source Code Clue:** View page source on `/`.  
   👉 Comment: `<!-- Hint: inspect robots.txt -->` (`SCENARIO75{robots.txt}`)
4. **Pre-Auth Cookie:** Inspect issued cookie `pre_mfa_session=pending_mfa_verification` (`HttpOnly=false`).  
   👉 Cookie Name: `SCENARIO75{pre_mfa_session}` | Value: `SCENARIO75{pending_mfa_verification}`

### Phase 2: Defense Evasion (WAF & XSS)
1. **Endpoint Method:** Submit feedback via `POST /feedback` (`SCENARIO75{POST}`).
2. **WAF Interception:** Submitting `<script>alert(1)</script>` triggers WAF block `HTTP 403 Forbidden` (`SCENARIO75{403}`).
3. **WAF Bypass Vector:** Submit HTML5 `<svg>` element (`SCENARIO75{<svg>}`):
   ```html
   <svg onload="window['docu'+'ment']['coo'+'kie']">
   ```
4. **JavaScript Obfuscation & Exfiltration:** Use bracket notation `window['docu'+'ment']['coo'+'kie']` (`SCENARIO75{window['docu'+'ment']['coo'+'kie']}`) with `fetch()` (`SCENARIO75{fetch}`) to exfiltrate cookies.

### Phase 3: Initial Access (MFA Bypass & Session Replay)
1. **MFA Bypass Mechanism:** Replaying an admin session cookie starting with `adm_sess` (`SCENARIO75{adm_sess}`) causes backend logic to skip `/api/verify-mfa` (`SCENARIO75{/api/verify-mfa}`).
2. **Reflected Payload:** Navigating to `/dashboard` renders stored XSS payload inside container `.xss-payload` (`SCENARIO75{xss-payload}`).
3. **Victory Flag:** Embedded within the administrative dashboard:  
   🏆 **`SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}`**

---

## 🔵 Blue Team Log Forensics Walkthrough

### Phase 1: SSH Access & Log Discovery
1. Connect via SSH: `ssh analyst@localhost -p 2275` *(Password: `blue_team_rocks`)*.
2. Navigate to raw logs: `cd /opt/admin/logs` (`SCENARIO75{/opt/admin/logs}`).

### Phase 2: Threat Hunting & Indicator Correlation
1. **Inspect `access.log`:**
   - Attacker IP: `10.10.14.50` (`SCENARIO75{10.10.14.50}`) | Subnet: `10.10.14.0/24` (`SCENARIO75{10.10.14.0/24}`)
   - User-Agent: `Mozilla/5.0` (`SCENARIO75{Mozilla/5.0}`)
   - Baseline Admin IP: `192.168.1.100` (`SCENARIO75{192.168.1.100}`)
   - Dashboard Access HTTP 200 (`SCENARIO75{200}`) at timestamp `18:51:55` (`SCENARIO75{18:51:55}`)
2. **Inspect `error.log` (`SCENARIO75{/opt/admin/logs/error.log}`):**
   - WAF Block for `<script>` (`SCENARIO75{<script>}`) recorded at timestamp `18:50:15` (`SCENARIO75{18:50:15}`)
   - Log Severity: `CRITICAL` (`SCENARIO75{CRITICAL}`) at timestamp `18:53:10` (`SCENARIO75{18:53:10}`)
   - Warning String: `Authentication bypass anomaly` (`SCENARIO75{Authentication bypass anomaly}`)
   - Log Correlation: Attacker **never** (`No`) reached `/api/verify-mfa` (`SCENARIO75{No}`)

### Phase 3: Base64 Payload Decoding
1. **Extract Header Artifact:** Header `X-Forwarded-For` contains Base64 string `UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}` (Encoding: `SCENARIO75{Base64}`, Length: `SCENARIO75{44}`).
2. **Execute Base64 Decoding in Shell:**
   ```bash
   echo "UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0" | base64 -d
   ```
   - **Raw Decoded Payload:** `PHANTOMGRID{BLUE_L0g_Hunt3r_M4st3r}`
   - **Assessment Submission Format:** 🏆 **`SCENARIO75{BLUE_L0G_HUnt3r_M4st3r}`**

---

## 🎯 Master CTF Flag Key Table (`SCENARIO75{...}`)

| Category | Assessment Question / Requirement | Exact Flag Value / Answer |
| :--- | :--- | :--- |
| **Red Team - Phase 1** | Response Header Backend Disclosure | `SCENARIO75{Node.js}` |
| **Red Team - Phase 1** | Disallowed Path in `robots.txt` | `SCENARIO75{/api/verify-mfa}` |
| **Red Team - Phase 1** | Restricted Admin Area Path | `SCENARIO75{/dashboard}` |
| **Red Team - Phase 1** | HTML Source Code ASCII Comment Clue | `SCENARIO75{robots.txt}` |
| **Red Team - Phase 1** | Pre-auth Cookie Name | `SCENARIO75{pre_mfa_session}` |
| **Red Team - Phase 1** | Pre-auth Cookie Value | `SCENARIO75{pending_mfa_verification}` |
| **Red Team - Phase 2** | Feedback Submission HTTP Method | `SCENARIO75{POST}` |
| **Red Team - Phase 2** | WAF Blocked HTTP Status Code | `SCENARIO75{403}` |
| **Red Team - Phase 2** | WAF Bypass HTML5 Tag | `SCENARIO75{<svg>}` |
| **Red Team - Phase 2** | JS Obfuscation Syntax | `SCENARIO75{window['docu'+'ment']['coo'+'kie']}` |
| **Red Team - Phase 2** | Cookie HttpOnly Flag Setting | `SCENARIO75{False}` |
| **Red Team - Phase 2** | Exfiltration Execution API | `SCENARIO75{fetch}` |
| **Red Team - Phase 3** | Skipped MFA Verification Endpoint | `SCENARIO75{/api/verify-mfa}` |
| **Red Team - Phase 3** | Admin Session Token Prefix | `SCENARIO75{adm_sess}` |
| **Red Team - Phase 3** | XSS Reflected Container CSS Class | `SCENARIO75{xss-payload}` |
| **Red Team - Phase 3** | **Final Red Team Victory Flag** | `SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}` |
| **Blue Team - Phase 1** | Raw Log Directory Location | `SCENARIO75{/opt/admin/logs}` |
| **Blue Team - Phase 1** | Attacker IP Address | `SCENARIO75{10.10.14.50}` |
| **Blue Team - Phase 1** | Attacker User-Agent String | `SCENARIO75{Mozilla/5.0}` |
| **Blue Team - Phase 1** | Dashboard Access HTTP Status Code | `SCENARIO75{200}` |
| **Blue Team - Phase 1** | Dashboard Access Timestamp | `SCENARIO75{18:51:55}` |
| **Blue Team - Phase 1** | Exfiltration Header Base64 Value | `SCENARIO75{UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}` |
| **Blue Team - Phase 2** | Baseline Legitimate Traffic IP | `SCENARIO75{192.168.1.100}` |
| **Blue Team - Phase 2** | Attacker Subnet | `SCENARIO75{10.10.14.0/24}` |
| **Blue Team - Phase 2** | WAF Block Error Log Target File | `SCENARIO75{/opt/admin/logs/error.log}` |
| **Blue Team - Phase 2** | WAF Blocked Tag | `SCENARIO75{<script>}` |
| **Blue Team - Phase 2** | First WAF Block Timestamp | `SCENARIO75{18:50:15}` |
| **Blue Team - Phase 2** | Attacker Reached MFA Endpoint? | `SCENARIO75{No}` |
| **Blue Team - Phase 3** | Header Encoding Identification | `SCENARIO75{Base64}` |
| **Blue Team - Phase 3** | Base64 Character Length | `SCENARIO75{44}` |
| **Blue Team - Phase 3** | Cookie Reuse Log Severity Level | `SCENARIO75{CRITICAL}` |
| **Blue Team - Phase 3** | Anomaly Log Timestamp | `SCENARIO75{18:53:10}` |
| **Blue Team - Phase 3** | Exact Security Warning String | `SCENARIO75{Authentication bypass anomaly}` |
| **Blue Team - Phase 3** | **Final Blue Team Victory Flag** | `SCENARIO75{BLUE_L0G_HUnt3r_M4st3r}` |

---

## 🖥️ Proxmox Hypervisor Deployment Guide

To deploy this lab on a Proxmox VE Linux Virtual Machine:

1. **Provision Linux Guest VM:**
   - Allocate 2 vCPUs, 2048 MB RAM, 20 GB Disk Space (Ubuntu 22.04 LTS / Debian 12).
2. **Install Docker Environment:**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
   sudo systemctl enable --now docker
   ```
3. **Clone & Launch Lab Environment:**
   ```bash
   git clone https://github.com/szaaa6/NauliData.git nauli-cyber-range
   cd nauli-cyber-range
   chmod +x scripts/generate-logs.sh
   ./scripts/generate-logs.sh
   docker compose up --build -d
   ```

---

## 🧪 Automated Test Suite

To run the automated endpoint and log verification suite:
```bash
node scripts/test-lab.js
```
*(All 9 / 9 automated test checks will execute and report pass/fail status).*

---

## 🔒 Security Remediation Recommendations

To fix these vulnerabilities in a production environment:
1. **Cookie Hardening:** Set `HttpOnly=true`, `Secure=true`, and `SameSite=Strict` on all authentication tokens.
2. **Robust Input Encoding:** Replace basic regex filters with contextual HTML entity encoding (e.g. DOMPurify).
3. **Strict Server-Side Session Validation:** Ensure `/dashboard` strictly mandates completed server-side MFA verification (`/api/verify-mfa`).
4. **Header Obfuscation:** Remove or sanitize `X-Powered-By` response headers.
