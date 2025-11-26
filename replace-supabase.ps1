# Replace common Supabase patterns with Railway API equivalents

$files = Get-ChildItem -Path "pages","components","hooks" -Include "*.tsx","*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Replace supabase.auth.getUser()
    $content = $content -replace 'const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);', 'const { data: user, error: authError } = await api.getCurrentUser();'
    
    # Replace supabase.auth.getSession()
    $content = $content -replace 'const \{ data: \{ session \}(, error: \w+)? \} = await supabase\.auth\.getSession\(\);', 'const { data: user, error } = await api.getCurrentUser();'
    
    # Replace supabase.removeChannel
    $content = $content -replace 'supabase\.removeChannel\(channel\);', '// Real-time removed - can add WebSocket later'
    
    # Replace supabase.channel
    $content = $content -replace 'const channel = supabase\.channel\([^)]+\)[^;]+;', '// Real-time subscription removed'
    $content = $content -replace 'const \{ data: \{ subscription \} \} = supabase\.channel\([^;]+;', '// Real-time subscription removed'
    
    # Only save if content changed
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Replacement complete!"
