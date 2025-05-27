@echo off
echo 🧹 Limpando cache completo do projeto...
echo.

echo 1. Parando processos Node.js e Python...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Limpando cache Python (__pycache__)...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"

echo 3. Limpando arquivos .pyc...
del /s /q *.pyc 2>nul

echo 4. Limpando cache Node.js...
npm cache clean --force

echo 5. Limpando node_modules...
if exist node_modules (
    echo Removendo node_modules...
    rd /s /q node_modules
)

echo 6. Limpando dist e build...
if exist dist rd /s /q dist
if exist build rd /s /q build

echo 7. Limpando cache Vite...
if exist .vite rd /s /q .vite

echo 8. Reinstalando dependências...
npm install

echo.
echo ✅ Cache limpo com sucesso!
echo 🚀 Agora execute: npm run dev
echo.
pause
