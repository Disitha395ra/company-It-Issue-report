import io
path = r'.\apps-script\Code.gs'
with io.open(path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'âœ…': '✅',
    'ðŸ› ï¸ ': '🛠️',
    'ðŸ“‹': '📋',
    'â ³': '⏳',
    'â Œ': '❌',
    'ðŸ” ': '🔍',
    'â„¹ï¸ ': 'ℹ️',
    'â†’': '→',
    'ðŸ””': '🔔',
    'ðŸ“Š': '📊',
    'ðŸŽ¯': '🎯',
    'â€”': '—'
}

for k, v in replacements.items():
    content = content.replace(k, v)

with io.open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
