# Final cleanup - replace all remaining Supabase database calls

$files = Get-ChildItem -Path "pages","components" -Include "*.tsx","*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Remove the supabase channel subscription code entirely
    $content = $content -replace 'const channel = supabase[^;]+\.subscribe\(\);', '// Real-time subscription removed'
    
    # Replace common table queries
    $content = $content -replace 'await supabase\.from\("profiles"\)\.select\([^)]+\)', 'await api.request("/api/profiles", { method: "GET" })'
    $content = $content -replace 'await supabase\.from\("project_files"\)\.insert\(', 'await api.request("/api/files", { method: "POST", body: JSON.stringify('
    $content = $content -replace 'await supabase\.from\("call_sheets"\)\.insert\(', 'await api.request("/api/call-sheets", { method: "POST", body: JSON.stringify('
    $content = $content -replace 'await supabase\.from\("shot_list_items"\)\.insert\(', 'await api.request("/api/shot-lists/items", { method: "POST", body: JSON.stringify('
    
    # Replace auth.resend
    $content = $content -replace 'await supabase\.auth\.resend\(', 'await api.request("/api/auth/resend-confirmation", { method: "POST", body: JSON.stringify('
    
    # Replace auth.signInWithPassword (for ClientSettings)
    $content = $content -replace 'await supabase\.auth\.signInWithPassword\(', 'await api.login('
    $content = $content -replace 'await supabase\.auth\.updateUser\(', 'await api.changePassword('
    
    # Only save if content changed
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nCleanup complete!"
Write-Host "Note: Some complex queries may still need manual review"
