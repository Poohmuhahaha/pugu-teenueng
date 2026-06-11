const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const ignoreDirs = new Set(['node_modules', '.git', '.svelte-kit', 'build', 'dist', '.deno']);

const replacements = [
    [/Admin/g, 'Admin'],
    [/Landing Page/g, 'Landing Page'],
    [/Portal/g, 'Portal'],
    [/QuestPage AI Lead Generation Dashboard/g, 'QuestPage AI Lead Generation Dashboard'],
    [/QuestPage/g, 'QuestPage'],
    [/Dashboard/g, 'Dashboard'],
    [/Workspace/g, 'Workspace'],
    [/Feature/g, 'Feature'],
    [/Integration/g, 'Integration'],
    [/Documentation/g, 'Documentation'],
    [/Launch Campaign/g, 'Launch Campaign'],
    [/Analyze Competitors/g, 'Analyze Competitors'],
    [/Revenue Tracker/g, 'Revenue Tracker']
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ignoreDirs.has(file)) continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else {
            if (!file.match(/\.(ts|js|json|md|html|svelte|css|prisma|env|yaml|yml|sh|mdx)$/i)) continue;
            
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            for (const [regex, replacement] of replacements) {
                content = content.replace(regex, replacement);
            }
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned RPG content: ${fullPath}`);
            }
        }
    }
}

console.log('Starting RPG cleanup...');
processDirectory(rootDir);
console.log('RPG cleanup done!');
