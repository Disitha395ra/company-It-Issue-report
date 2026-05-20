const fs = require('fs');
const path = './apps-script/Code.gs';

let content = fs.readFileSync(path, 'utf8');

const replacements = {
    "âœ…": "✅",
    "ðŸ› ï¸ ": "🛠️",
    "ðŸ“‹": "📋",
    "â ³": "⏳",
    "â Œ": "❌",
    "ðŸ” ": "🔍",
    "â„¹ï¸ ": "ℹ️",
    "â†’": "→",
    "ðŸ””": "🔔",
    "ðŸ“Š": "📊",
    "ðŸŽ¯": "🎯",
    "â€”": "—"
};

for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Encoding fixed.');
