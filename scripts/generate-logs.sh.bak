#!/usr/bin/env bash
set -euo pipefail
mkdir -p logs
cat > logs/access.log <<'EOF'
2026-10-09T18:50:00+07:00 192.168.1.100 "GET / HTTP/1.1" 200 "Mozilla/5.0" "X-Forwarded-For:-" baseline=legitimate
2026-10-09T18:50:15+07:00 10.10.14.50 "POST /feedback HTTP/1.1" 403 "Mozilla/5.0" "X-Forwarded-For:-" waf_block=script
2026-10-09T18:50:45+07:00 10.10.14.50 "POST /feedback HTTP/1.1" 200 "Mozilla/5.0" "X-Forwarded-For:-" payload=svg_training
2026-10-09T18:51:10+07:00 10.10.14.50 "GET /robots.txt HTTP/1.1" 200 "Mozilla/5.0" "X-Forwarded-For:-" recon=true
2026-10-09T18:51:55+07:00 10.10.14.50 "GET /dashboard HTTP/1.1" 200 "Mozilla/5.0" "X-Forwarded-For:U0NFTkFSSU83NXtCTFVFX0wwR19IVW50M3JfTTRzdDNyfQ==" session_replay=true
2026-10-09T18:52:20+07:00 192.168.1.100 "GET /health HTTP/1.1" 200 "Mozilla/5.0" "X-Forwarded-For:-" baseline=legitimate
EOF
cat > logs/error.log <<'EOF'
2026-10-09T18:50:15+07:00 [WAF] blocked <script> tag from 10.10.14.50 status=403
2026-10-09T18:53:10+07:00 [CRITICAL] Authentication bypass anomaly: cookie reuse observed; /api/verify-mfa was not reached.
2026-10-09T18:53:11+07:00 [CRITICAL] Cookie reuse event from 10.10.14.50; investigate session replay and XSS evidence.
EOF
echo "Generated training logs in ./logs"
