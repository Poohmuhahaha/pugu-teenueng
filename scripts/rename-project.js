const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

const ignoreDirs = new Set(['node_modules', '.git', '.svelte-kit', 'build', 'dist', '.deno']);

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ignoreDirs.has(file)) continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else {
            // Only process text files
            if (!file.match(/\.(ts|js|json|md|html|svelte|css|prisma|env|yaml|yml|sh|mdx)$/i)) continue;
            
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace exact cases
            content = content.replace(/QuestPage/g, 'QuestPage');
            content = content.replace(/questpage/g, 'questpage');
            content = content.replace(/@questpage\//g, '@questpage/');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

console.log('Starting mass rename of QuestPage -> QuestPage...');
processDirectory(rootDir);
console.log('Done!');
