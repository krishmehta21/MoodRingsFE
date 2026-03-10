const fs = require('fs');
const path = require('path');

const tsxFiles = [];

function findTsxFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findTsxFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      tsxFiles.push(fullPath);
    }
  }
}

findTsxFiles(path.join(__dirname, 'app'));
findTsxFiles(path.join(__dirname, 'components'));

const replacements = [
  // Gradients
  { old: "\\['#C4764A', '#B8603A', '#9A4E2E'\\]", new: "['#853953', '#712048', '#612D53']" },
  { old: "\\['#C4764A', '#B8603A'\\]", new: "['#853953', '#612D53']" },
  
  // Specific cases
  { old: "'#3D2010'", new: "'#4A4A4A'" },
  
  // Base colors
  { old: '#C4764A', new: '#853953' },
  { old: '#D4865A', new: '#9E4663' },
  { old: '#B8603A', new: '#612D53' },
  { old: '#9A4E2E', new: '#4A1F3F' },
  { old: '#C4A35A', new: '#612D53' },
  { old: '#0D0805', new: '#1E1E1E' },
  { old: '#150C08', new: '#242424' },
  { old: '#1A0F0A', new: '#2C2C2C' },
  { old: '#1C1007', new: '#363636' },
  { old: '#170D06', new: '#282828' },
  { old: '#2A1508', new: '#3D3D3D' },
  { old: '#2D1810', new: '#323232' },
  { old: '#3D2418', new: '#3A3A3A' },
  { old: '#FAF3ED', new: '#F3F4F4' },
  { old: '#F0E8E0', new: '#F3F4F4' },
  { old: 'rgba\\(196,118,74,', new: 'rgba(133,57,83,' },
  { old: 'rgba\\(196,163,90,', new: 'rgba(133,57,83,' },
  { old: 'rgba\\(13,8,5,', new: 'rgba(30,30,30,' }
];

for (const file of tsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const rep of replacements) {
    const regex = new RegExp(rep.old, 'gi');
    if (regex.test(content)) {
      content = content.replace(regex, rep.new);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
}
