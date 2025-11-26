# Replace Supabase data calls with Railway API equivalents

$files = Get-ChildItem -Path "pages","components" -Include "*.tsx","*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Replace supabase.from() patterns - these need manual review but let's comment them out
    # We'll replace common ones with API calls
    
    # Replace supabase.from("bookings") or custom_booking_requests
    $content = $content -replace 'await supabase\.from\("custom_booking_requests"\)\.select\([^)]+\)', 'await api.getBookings()'
    $content = $content -replace 'await supabase\.from\("bookings"\)\.select\([^)]+\)', 'await api.getBookings()'
    
    # Replace supabase.from("projects")
    $content = $content -replace 'await supabase\.from\("projects"\)\.select\([^)]+\)', 'await api.getProjects()'
    
    # Replace supabase.from("client_accounts")
    $content = $content -replace 'await supabase\.from\("client_accounts"\)\.select\([^)]+\)', 'await api.getClients()'
    
    # Replace supabase.from("payments")
    $content = $content -replace 'await supabase\.from\("payments"\)\.select\([^)]+\)', 'await api.getPayments()'
    
    # Replace supabase.from("client_messages")
    $content = $content -replace 'await supabase\.from\("client_messages"\)', 'await api.getMessages()'
    
    # Replace supabase.from("meetings")
    $content = $content -replace 'await supabase\.from\("meetings"\)\.select\([^)]+\)', 'await api.getMeetings()'
    
    # Replace supabase.from("opportunities")
    $content = $content -replace 'await supabase\.from\("opportunities"\)', '// TODO: await api.getOpportunities()'
    
    # Replace supabase.functions.invoke
    $content = $content -replace 'await supabase\.functions\.invoke\(', '// TODO: Replace with Railway API endpoint - supabase.functions.invoke('
    
    # Replace supabase.storage
    $content = $content -replace 'await supabase\.storage', '// TODO: Replace with R2 storage - supabase.storage'
    
    # Only save if content changed
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Data call replacement complete!"
Write-Host "Note: Files marked with TODO need manual API endpoint creation"
