const http = require('http');

function check(url, tests) {
  return new Promise(resolve => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('=== URL: ' + url + ' ===');
        console.log('Status: ' + res.statusCode);
        for (const [name, fn] of Object.entries(tests)) {
          console.log('  ' + name + ': ' + fn(d));
        }
        resolve();
      });
    });
  });
}

async function run() {
  await check('http://localhost:3000/', {
    'Is Landing Page': d => d.includes('Maternity Companion') && d.includes('hero-section'),
    'Has CTA to /app': d => d.includes('/app')
  });

  await check('http://localhost:3000/app', {
    'Has Onboarding Language Screen': d => d.includes('page-welcome') && d.includes('selectLangTxt'),
    'Has Auth Screen': d => d.includes('page-login') && d.includes('handleGoogleSignIn'),
    'Has Maternal Dashboard': d => d.includes('page-main') && d.includes('gestational-hero-bar'),
    'Has Context Menu for Chat Deletion': d => d.includes('context-menu') && d.includes('promptDeleteSelectedSession'),
    'Has Delete Confirmation Modal': d => d.includes('deleteConfirmModal') && d.includes('confirmDeleteSession'),
    'Has Profile Modal': d => d.includes('profileModal') && d.includes('openProfileModal'),
    'Logout is inside Profile Modal': d => d.includes('modalLogoutBtn') && d.includes('doLogout'),
    'No Admin/Docs in Maternal Sidebar': d => !d.includes('id="adminLinkTxt"') && !d.includes('id="docsLinkTxt"'),
    'Guest Login Completely Removed': d => !d.includes('continueAsGuest') && !d.includes('Guest Mode')
  });
}
run();
