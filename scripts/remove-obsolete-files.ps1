# ZIP extraction does not delete files removed in a newer release.
# Run from any directory; only these three obsolete files are removed.
$projectRoot = Split-Path -Parent $PSScriptRoot
$obsoleteFiles = @(
    'netlify/lib/augmentParser.ts',
    'tests/augment-parsing.test.ts',
    'scripts/capture-match.ts'
)
foreach ($relativePath in $obsoleteFiles) {
    $obsoletePath = Join-Path $projectRoot $relativePath
    if (Test-Path -LiteralPath $obsoletePath -PathType Leaf) {
        Remove-Item -LiteralPath $obsoletePath -ErrorAction Stop
        Write-Host "Removed obsolete file: $relativePath"
    }
}
