const fs = require('fs');
const files = ['index.html', 'browse.html', 'popular.html', 'search.html', 'watch.html', 'detail.html'];
const searchStr = '<button id="back-to-top" class="back-to-top" aria-label="Kembali ke atas">↑</button>';
const replaceStr = `<button id="back-to-top" class="back-to-top" aria-label="Kembali ke atas">
    <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
  </button>`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(searchStr)) {
      content = content.replace(searchStr, replaceStr);
      fs.writeFileSync(file, content);
      console.log('Updated ' + file);
    }
  }
});
