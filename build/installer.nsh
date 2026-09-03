; Custom uninstaller behavior for electron-builder's NSIS target.
; ${APP_FILENAME} matches Electron's own userData folder name (derived from
; productName, "Bundle") — confirmed against the real on-disk path this app
; actually uses (%APPDATA%\Bundle\templates\...).
!macro customUnInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "Also delete your saved templates and settings?$\r$\n$\r$\nThis cannot be undone." IDNO skip_delete_app_data
    RMDir /r "$APPDATA\${APP_FILENAME}"
  skip_delete_app_data:
!macroend
