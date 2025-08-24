import subprocess
import sys
import os
import time

def print_with_dots(msg, delay=0.3, count=3):
    print(msg, end='', flush=True)
    for _ in range(count):
        time.sleep(delay)
        print('.', end='', flush=True)
    print()

def newline(count=1):
    for _ in range(count):
        print()

def setup_environment():
    print_with_dots("🔍 Checking pip version")
    newline(2)

    try:
        current_version = subprocess.check_output([sys.executable, "-m", "pip", "--version"]).decode()
        latest_check = subprocess.check_output([sys.executable, "-m", "pip", "install", "--upgrade", "pip", "--dry-run"]).decode()

        if "Would install" in latest_check:
            print_with_dots("⬆️  Upgrading pip to the latest version")
            newline(2)
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
            print("✅ pip upgraded successfully.")
        else:
            print("✅ pip is already up to date.")
    except Exception as e:
        print(f"⚠️  Could not check or upgrade pip: {e}")

    newline(2)
    print_with_dots("📦 Installing required packages")
    newline(2)

    if os.path.exists("requirements.txt"):
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✅ All packages installed successfully.")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install packages: {e}")
            sys.exit(1)
    else:
        print("⚠️  requirements.txt not found.")
        sys.exit(1)

    newline(2)
    print_with_dots("🚀 All set! Starting the Django server", delay=0.4)
    newline(2)

    try:
        subprocess.check_call([sys.executable, 'manage.py', 'runserver'])
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start the server: {e}")
