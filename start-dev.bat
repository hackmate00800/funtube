@echo off
echo Starting FunTube Development Environment...
echo.

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check for MongoDB
echo Checking MongoDB...
where mongo >nul 2>nul || where mongod >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Warning: MongoDB not found in PATH. Make sure MongoDB is running.
)

:: Install root dependencies
echo Installing root dependencies...
call npm install

:: Install server dependencies
echo Installing server dependencies...
cd server
call npm install
cd ..

:: Install client dependencies
echo Installing client dependencies...
cd client
call npm install
cd ..

:: Create .env if not exists
if not exist .env (
    echo Creating .env from example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env file with your configuration values before starting.
)

:: Create upload directories
echo Creating upload directories...
if not exist "uploads\videos" mkdir uploads\videos
if not exist "uploads\thumbnails" mkdir uploads\thumbnails
if not exist "uploads\temp" mkdir uploads\temp

echo.
echo Starting FunTube...
echo.
echo The application will open at http://localhost:3000
echo Backend API runs at http://localhost:5000
echo.
npm run dev
