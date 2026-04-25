const fs = require('fs');
const execSync = require('child_process').execSync;
try {
  if (!fs.existsSync('temp_docx')) fs.mkdirSync('temp_docx');
  execSync('tar -xf "dokumentasi_api_anime_sanka_vollerei.docx" -C temp_docx');
  const xml = fs.readFileSync('temp_docx/word/document.xml', 'utf8');
  let text = xml.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ');
  console.log(text.substring(0, 3000));
  fs.writeFileSync('extracted_doc.txt', text);
} catch(e) {
  console.log(e.message);
}
