# Run the updater in watch mode on Windows as a detached process.
# Usage: Right-click -> Run with PowerShell, or run from an elevated prompt.
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = 'node'
$script = Join-Path $repo 'scripts\update_manga_metadata.js'

Start-Process -FilePath $node -ArgumentList "$script --watch" -WindowStyle Hidden -WorkingDirectory $repo
Write-Output "Started watcher for $script"
