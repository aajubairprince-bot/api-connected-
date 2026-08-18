const fs = require('fs');

let html = fs.readFileSync('f:\\downloads\\Shokhi-AI-main\\Shokhi-AI-main\\www\\index_git_original.html', 'utf8');

// 1. Add Supabase script to head
html = html.replace('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">', 
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <script src="/supabase.min.js"></script>');

// 2. Add Google button CSS
const googleCss = `
        /* Google OAuth Button */
        .btn-google {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            padding: 13px 20px;
            background: #ffffff;
            color: #1f2937;
            border: 1.5px solid #e5e7eb;
            border-radius: var(--radius-full);
            font-size: 14.5px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
            transition: var(--transition);
        }
        .btn-google:hover {
            border-color: #d1d5db;
            background: #f9fafb;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
        }
        .google-icon-svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }
        .auth-alert {
            display: none;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 12.5px;
            margin-bottom: 14px;
            text-align: left;
        }
`;
html = html.replace('.auth-input:focus {', googleCss + '\n        .auth-input:focus {');

// 3. Update #page-login to use Google Login & Guest Mode
const newLoginHtml = `    <!-- 2. LOGIN SCREEN -->
    <div id="page-login">
        <div class="auth-card">
            <div class="app-logo" style="width: 76px; height: 76px; margin-bottom: 14px;">
                <i class="fa-solid fa-heart-pulse" style="font-size: 34px;"></i>
            </div>
            <h2 id="loginTitle" style="font-size: 24px; font-weight: 700; color: var(--primary-deep); margin-bottom: 6px;">স্বাগতম সখী AI-তে</h2>
            <p id="loginSub" style="font-size: 13px; color: var(--text-muted); margin-bottom: 22px;">আপনার নিরাপদ ও ব্যক্তিগত মাতৃত্ব সেবায় প্রবেশ করুন</p>
            
            <div class="auth-alert" id="authAlert"></div>

            <!-- Google Sign-In Button -->
            <button type="button" class="btn-google" id="googleAuthBtn" onclick="handleGoogleSignIn()">
                <svg class="google-icon-svg" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span id="googleBtnText" style="font-weight: 600;">গুগল দিয়ে প্রবেশ করুন (Continue with Google)</span>
            </button>

            <div style="margin-top: 18px;">
                <button type="button" onclick="continueAsGuest()" style="background:transparent; border:none; color:var(--primary); font-size:13px; font-weight:600; cursor:pointer; text-decoration:underline;" id="guestLoginTxt">
                    ✨ লগইন ছাড়াই সরাসরি অ্যাপে প্রবেশ করুন (Guest Mode)
                </button>
            </div>

            <div style="margin-top: 22px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.06); font-size: 11.5px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="fa-solid fa-lock" style="color: #10b981;"></i>
                <span id="authSecNotice">ব্যক্তিগত ও এনক্রিপ্টেড গুগল সিকিউর অথেন্টিকেশন</span>
            </div>

            <div style="margin-top: 14px; display: flex; justify-content: center; gap: 16px;">
                <a href="/" style="font-size: 11.5px; color: var(--text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                    <i class="fa-solid fa-house" style="color: var(--primary);"></i> হোমপেজ
                </a>
            </div>
        </div>
    </div>`;

const loginStart = html.indexOf('<!-- 2. LOGIN SCREEN -->');
const loginEnd = html.indexOf('<!-- 3. MAIN DASHBOARD -->');
if (loginStart !== -1 && loginEnd !== -1) {
  html = html.substring(0, loginStart) + newLoginHtml + '\n\n    ' + html.substring(loginEnd);
}

// 4. Update calculatePregnancy
const newCalcPregnancy = `        function calculatePregnancy() {
            const lmpInput = document.getElementById('lmpDate');
            const calcResult = document.getElementById('calcResult');
            if (!lmpInput || !lmpInput.value || !calcResult) return;

            const lmp = new Date(lmpInput.value);
            if (isNaN(lmp.getTime())) {
                calcResult.innerHTML = '<span style="color:#ef4444; font-weight:600;">⚠️ সঠিক তারিখ নির্বাচন করুন</span>';
                return;
            }

            const today = new Date();
            const edd = new Date(lmp.getTime() + (280 * 24 * 60 * 60 * 1000));
            const eddFormatted = edd.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'bn-BD', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
            });
            const lmpFormatted = lmp.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'bn-BD', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            if (lmp > today) {
                const daysUntilLmp = Math.ceil((lmp - today) / (1000 * 60 * 60 * 24));
                calcResult.innerHTML = \`
                    <div style="background:#fdf2f8; padding:10px; border-radius:8px; border-left:3px solid var(--primary); font-size:12px; line-height:1.5;">
                        <div style="color:var(--primary-deep); font-weight:700;">📅 পরিকল্পিত প্রসবের তারিখ হিসাব:</div>
                        <div><strong>সম্ভাব্য প্রসবের তারিখ:</strong> <span style="color:var(--primary); font-weight:700;">\${eddFormatted}</span></div>
                        <div style="color:var(--text-muted);"><strong>LMP তারিখ:</strong> \${lmpFormatted} (\${daysUntilLmp} দিন পর)</div>
                        <div style="color:#059669; font-weight:600; margin-top:2px;">✨ পূর্ণ গর্ভকাল ৪০ সপ্তাহ (২৮০ দিন) অনুযায়ী হিসাবকৃত।</div>
                    </div>
                \`;
                return;
            }

            const diffDays = Math.ceil((today - lmp) / (1000 * 60 * 60 * 24));
            const weeks = Math.floor(diffDays / 7);
            const days = diffDays % 7;
            const trimester = weeks <= 12 ? (currentLang === 'en' ? '1st Trimester' : '১ম ট্রাইমেস্টার') : weeks <= 26 ? (currentLang === 'en' ? '2nd Trimester' : '২য় ট্রাইমেস্টার') : (currentLang === 'en' ? '3rd Trimester' : '৩য় ট্রাইমেস্টার');

            calcResult.innerHTML = \`
                <div style="background: #fdf2f8; padding: 10px; border-radius: 8px; border-left: 3px solid var(--primary); font-size:12px;">
                    <div><strong>\${currentLang==='en'?'Expected Due Date':'সম্ভাব্য প্রসবের তারিখ'}:</strong> \${eddFormatted}</div>
                    <div><strong>\${currentLang==='en'?'Current Stage':'বর্তমান অগ্রগতি'}:</strong> \${weeks} \${currentLang==='en'?'weeks':'সপ্তাহ'}, \${days} \${currentLang==='en'?'days':'দিন'}</div>
                    <div style="color: var(--primary); font-weight: 700; margin-top: 2px;">\${trimester}</div>
                </div>
            \`;
        }`;

const calcStart = html.indexOf('function calculatePregnancy() {');
const calcEnd = html.indexOf('function logVitals() {');
if (calcStart !== -1 && calcEnd !== -1) {
  html = html.substring(0, calcStart) + newCalcPregnancy + '\n\n        ' + html.substring(calcEnd);
}

// 5. Add auth state variables and Google OAuth functions
const authJs = `
        let authToken = localStorage.getItem('shokhi_auth_token') || null;
        let currentUser = JSON.parse(localStorage.getItem('shokhi_user') || 'null');
        let supaClient = null;

        function getApiHeaders() {
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = \`Bearer \${authToken}\`;
            return headers;
        }

        function showAuthAlert(msg, isError = true) {
            const el = document.getElementById('authAlert');
            if (!el) return;
            el.style.display = 'block';
            el.style.background = isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)';
            el.style.color = isError ? '#b91c1c' : '#047857';
            el.style.border = \`1px solid \${isError ? '#fca5a5' : '#6ee7b7'}\`;
            el.innerHTML = \`<i class="fa-solid \${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> \${msg}\`;
        }

        async function initSupabaseAuth() {
            try {
                const res = await fetch('/api/config');
                const config = await res.json();
                if (config.supabase_configured && config.supabase_url && config.supabase_anon_key && window.supabase?.createClient) {
                    supaClient = window.supabase.createClient(config.supabase_url, config.supabase_anon_key, {
                        auth: {
                            persistSession: true,
                            storageKey: 'shokhi_supabase_auth',
                            detectSessionInUrl: true,
                            autoRefreshToken: true
                        }
                    });

                    supaClient.auth.onAuthStateChange(async (event, session) => {
                        if (session && session.user) {
                            try {
                                showAuthAlert(currentLang === 'en' ? 'Verifying Google session...' : 'গুগল একাউন্ট যাচাই করা হচ্ছে...', false);
                                const syncRes = await fetch('/api/auth/google', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        email: session.user.email,
                                        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
                                        avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
                                        google_id: session.user.id
                                    })
                                });
                                const syncData = await syncRes.json();
                                if (syncData.token) {
                                    authToken = syncData.token;
                                    currentUser = syncData.user || { name: session.user.email.split('@')[0], email: session.user.email, pregnancy_week: 24 };
                                    localStorage.setItem('shokhi_auth_token', authToken);
                                    localStorage.setItem('shokhi_user', JSON.stringify(currentUser));
                                    
                                    if (window.location.hash || window.location.search) {
                                        window.history.replaceState(null, '', window.location.pathname);
                                    }
                                    goToPage('page-main');
                                }
                            } catch (err) {
                                console.warn("Google sync error:", err);
                                showAuthAlert(err.message, true);
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn('Supabase auth init:', e);
            }
        }

        async function handleGoogleSignIn() {
            const btn = document.getElementById('googleAuthBtn');
            const btnText = document.getElementById('googleBtnText');
            if (btnText) btnText.textContent = (currentLang === 'en' ? 'Redirecting to Google...' : 'গুগলে রিডাইরেক্ট হচ্ছে...');
            if (btn) btn.style.opacity = '0.7';

            try {
                if (!supaClient) await initSupabaseAuth();
                if (supaClient?.auth) {
                    const redirectUrl = \`\${window.location.origin}/app\`;
                    const { error } = await supaClient.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: redirectUrl }
                    });
                    if (error) throw error;
                } else {
                    showAuthAlert(currentLang === 'en' ? 'Connecting to Google Authentication...' : 'গুগল অথেন্টিকেশন প্রস্তুত হচ্ছে, আরেকবার চাপ দিন।', false);
                }
            } catch (err) {
                console.error("Google OAuth error:", err);
                showAuthAlert((currentLang === 'en' ? 'Google login error: ' : 'গুগল লগইন ত্রুটি: ') + err.message, true);
            } finally {
                if (btnText) btnText.textContent = currentLang === 'en' ? 'Continue with Google' : 'গুগল দিয়ে প্রবেশ করুন (Continue with Google)';
                if (btn) btn.style.opacity = '1';
            }
        }

        function continueAsGuest() {
            if (!currentUser) {
                currentUser = { name: 'নুসরাত জাহান', pregnancy_week: 24, email: 'guest@shokhi.ai' };
            }
            goToPage('page-main');
        }

        function doLogout() {
            authToken = null;
            currentUser = null;
            localStorage.removeItem('shokhi_auth_token');
            localStorage.removeItem('shokhi_user');
            if (supaClient?.auth) {
                try { supaClient.auth.signOut(); } catch(_) {}
            }
            goToPage('page-welcome');
        }
`;

html = html.replace('function goToPage(pageId) {', authJs + '\n        function goToPage(pageId) {');

// 6. Add DOMContentLoaded at end
const startupScript = `
        window.addEventListener('DOMContentLoaded', async () => {
            setAppLanguage(currentLang);
            initSupabaseAuth().catch(e => console.warn('Supabase auth init:', e));

            const urlParams = new URLSearchParams(window.location.search);
            const requestedMode = urlParams.get('mode');
            const hasAuthHash = window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('refresh_token='));
            const hasAuthCode = urlParams.has('code');

            if (hasAuthHash || hasAuthCode) {
                goToPage('page-login');
                showAuthAlert(currentLang === 'en' ? 'Verifying Google authentication...' : 'গুগল একাউন্ট যাচাই করা হচ্ছে...', false);
            } else if (authToken) {
                try {
                    const res = await fetch('/api/auth/me', { headers: { 'Authorization': \`Bearer \${authToken}\` } });
                    if (res.ok) {
                        const data = await res.json();
                        currentUser = data.user;
                        localStorage.setItem('shokhi_user', JSON.stringify(currentUser));
                        goToPage('page-main');
                    } else {
                        goToPage('page-welcome');
                    }
                } catch (e) {
                    goToPage('page-main');
                }
            } else if (requestedMode === 'login' || requestedMode === 'register') {
                goToPage('page-login');
            } else {
                goToPage('page-welcome');
            }
        });
`;
html = html.replace('</script>', startupScript + '\n    </script>');

// 7. Update fetch headers
html = html.replace("headers: { 'Content-Type': 'application/json' },", "headers: getApiHeaders(),");
html = html.replace("fetch('/api/get_all_sessions')", "fetch('/api/get_all_sessions', { headers: getApiHeaders() })");
html = html.replace("fetch(`/api/get_chat_messages/${sessionId}`)", "fetch(`/api/get_chat_messages/${sessionId}`, { headers: getApiHeaders() })");
html = html.replace("fetch(`/api/delete_chat_session/${chatIdToDelete}`, { method: 'DELETE' })", "fetch(`/api/delete_chat_session/${chatIdToDelete}`, { method: 'DELETE', headers: getApiHeaders() })");

fs.writeFileSync('f:\\downloads\\Shokhi-AI-main\\Shokhi-AI-main\\www\\index.html', html, 'utf8');
console.log('Successfully generated index.html identical to last night! Total lines:', html.split('\n').length);
