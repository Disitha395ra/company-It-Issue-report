$content = Get-Content .\apps-script\Code.gs -Raw
$content = $content.Replace("âœ…", "✅")
$content = $content.Replace("ðŸ› ï¸ ", "🛠️")
$content = $content.Replace("ðŸ“‹", "📋")
$content = $content.Replace("â ³", "⏳")
$content = $content.Replace("â Œ", "❌")
$content = $content.Replace("ðŸ” ", "🔍")
$content = $content.Replace("â„¹ï¸ ", "ℹ️")
$content = $content.Replace("â†’", "→")
$content = $content.Replace("ðŸ””", "🔔")
$content = $content.Replace("ðŸ“Š", "📊")
$content = $content.Replace("ðŸŽ¯", "🎯")
$content = $content.Replace("â€”", "—")
$content | Set-Content .\apps-script\Code.gs -Encoding utf8
