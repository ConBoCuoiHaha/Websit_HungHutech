const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const COMMON_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Node',
  'React',
  'Vue',
  'MongoDB',
  'SQL',
  'Python',
  'Java',
  'AWS',
  'Docker',
  'Kubernetes',
  'UI',
  'UX',
  'Agile',
  'Scrum',
  'Leadership',
  'Communication',
];

async function extractTextFromFile(filePath, mimetype) {
  const ext = path.extname(filePath).toLowerCase();
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    const data = await pdfParse(fs.readFileSync(filePath));
    return data.text || '';
  }
  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    const result = await mammoth.extractRawText({path: filePath});
    return result.value || '';
  }
  // fallback txt
  return fs.readFileSync(filePath, 'utf8');
}

function normalizeLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function guessFullName(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);
  if (!lines.length) return '';
  const candidate = lines.find(
    (line) => /^[A-ZĐÂĂÊÔƠƯ][\w\s\-\.'ĐÂĂÊÔƠƯđâăêôơư]+$/.test(line),
  );
  if (candidate && candidate.split(' ').length <= 6) {
    return candidate;
  }
  return lines[0].split(' ').length <= 6 ? lines[0] : '';
}

function extractEmail(text) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : '';
}

function extractPhone(text) {
  const match = text.match(/(\+?\d{2,3})?[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3,4}/);
  return match ? normalizeLine(match[0]) : '';
}

function extractSkills(text) {
  const found = new Set();
  COMMON_SKILLS.forEach((skill) => {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(text)) {
      found.add(skill);
    }
  });
  return Array.from(found);
}

function extractEducation(text) {
  const lines = text.split(/\r?\n/).map(normalizeLine);
  return lines.filter((line) =>
    /(University|College|Đại học|Cao đẳng|Bachelor|Master)/i.test(line),
  );
}

function extractExperience(text) {
  const lines = text.split(/\r?\n/).map(normalizeLine);
  return lines.filter((line) =>
    /(Company|Công ty|Project|Dự án|Experience|Kinh nghiệm)/i.test(line),
  );
}

function summarize(text) {
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  return lines.slice(0, 5).join(' ');
}

async function parseResume(filePath, mimetype) {
  const text = await extractTextFromFile(filePath, mimetype);
  const ho_ten = guessFullName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const ky_nang = extractSkills(text);
  const hoc_van = extractEducation(text);
  const kinh_nghiem = extractExperience(text);
  const tom_tat = summarize(text);
  const score = ky_nang.length * 10;
  return {
    text,
    parsed: {
      ho_ten,
      email,
      dien_thoai: phone,
      ky_nang,
      hoc_van,
      kinh_nghiem,
      tom_tat,
    },
    score,
  };
}

module.exports = {
  parseResume,
};
