const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TSX files in src/pages
const files = glob.sync('src/pages/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Update header to be centered with wrapper
  const headerRegex = /<header className="h-14 border-b flex items-center justify-between px-4">/g;
  if (headerRegex.test(content)) {
    content = content.replace(
      /<header className="h-14 border-b flex items-center justify-between px-4">\s*<div className="flex items-center gap-4">/g,
      `<header className="h-14 border-b flex items-center justify-center px-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-4">`
    );
    
    // Add closing div before </header>
    content = content.replace(
      /(<div className="flex items-center gap-2">[\s\S]*?<\/div>)\s*<\/header>/g,
      `$1
            </div>
          </header>`
    );
    modified = true;
  }

  // Update main to be centered
  content = content.replace(
    /<main className="flex-1 px-4 py-6 overflow-auto">/g,
    '<main className="flex-1 px-4 py-6 overflow-auto flex justify-center">'
  );

  // Update content wrapper
  content = content.replace(
    /<div className="space-y-6 max-w-\[calc\(100%-3rem\)\]">/g,
    '<div className="space-y-6 w-full max-w-7xl">'
  );

  if (modified || content !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
  }
});

console.log('Layout update complete!');
