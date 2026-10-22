const fs = require('fs');

const adminPath = '/Users/apple/Desktop/zorra_royals/src/app/admin/page.js';
let adminCode = fs.readFileSync(adminPath, 'utf8');
const chatCode = fs.readFileSync('/Users/apple/Desktop/zorra_royals/scratch/zorra_chat_tab.txt', 'utf8');

const startMark = '{/* TAB 9: LIVE CHAT SUPPORT */}';
const endMark = '{/* TAB 10: KYC VERIFICATION */}';

const startIdx = adminCode.indexOf(startMark);
const endIdx = adminCode.indexOf(endMark);

if (startIdx !== -1 && endIdx !== -1) {
  const before = adminCode.substring(0, startIdx);
  const after = adminCode.substring(endIdx);
  const updated = before + '{/* TAB 9: LIVE CHAT SUPPORT (WhatsApp-Style Responsive Workspace) */}\n          ' + chatCode + '\n\n          ' + after;
  fs.writeFileSync(adminPath, updated);
  console.log('Successfully replaced chat tab in admin portal!');
} else {
  console.error('Could not find markers:', { startIdx, endIdx });
}
