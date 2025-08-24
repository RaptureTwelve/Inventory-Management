# Maguva - Boutique Management System

A comprehensive Django-based boutique management system for inventory, sales, and customer management.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ 
- PostgreSQL 12+
- Git

## 📦 Installation

### 1. Install Python

**Option A: Microsoft Store (Recommended for Windows)**
- Open Microsoft Store
- Search for "Python"
- Install Python 3.11 or later

**Option B: Official Website**
- Visit [python.org](https://python.org)
- Download and install the latest version

**Verify Installation:**
```bash
python --version
```

### 2. Install PostgreSQL

- Download from [postgresql.org](https://postgresql.org)
- Install with default settings
- Remember your superuser password

### 3. Setup Database

**Option A: Using pgAdmin (Recommended for Beginners)**

1. **Open pgAdmin 4** (installed with PostgreSQL)
2. **Connect to PostgreSQL Server:**
   - Right-click on "PostgreSQL" server
   - Enter your master password when prompted
3. **Create Database User:**
   - Right-click on "Login/Group Roles" → Create → Login/Group Role
   - General Tab: Name = `your_username`
   - Definition Tab: Password = `your_password`
   - Privileges Tab: Check "Can login?" and "Create databases?"
   - Click "Save"
4. **Create Database:**
   - Right-click on "Databases" → Create → Database
   - General Tab: Database = `maguva_db`
   - Owner: Select `your_username` (created above)
   - Click "Save"

**Option B: Using Command Line (psql)**

```sql
-- Open PostgreSQL command line (psql)
-- Windows: Search "SQL Shell (psql)" in start menu
-- Enter server details (press Enter for defaults)

CREATE USER your_username WITH PASSWORD 'your_password';
CREATE DATABASE maguva_db OWNER your_username;
GRANT ALL PRIVILEGES ON DATABASE maguva_db TO your_username;

-- Type \q to exit
```

**Option C: Using PostgreSQL Commands**

```bash
# Open command prompt/terminal as administrator

# Create user
createuser -U postgres -P your_username
# Enter password when prompted

# Create database
createdb -U postgres -O your_username maguva_db
```

### 4. Clone Repository

```bash
git clone https://github.com/your-username/maguva.git
cd maguva
```

### 5. Create Virtual Environment

```bash
# Create virtual environment
python -m venv goat

# Activate environment
# Windows:
goat\Scripts\activate

# Linux/Mac:
source goat/bin/activate
```

### 6. Configure Database

Edit `Manguva/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'maguva_db',        
        'USER': 'your_username',         # Change this
        'PASSWORD': 'your_password',     # Change this
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 7. Install Dependencies & Setup

```bash
# Install required packages
pip install -r requirements.txt

# Initial setup (only run once)
python manage.py setup

# Create database tables
python manage.py makemigrations
python manage.py migrate
```

### 8. Create Users

```bash
# Create admin user
python manage.py createsuperuser

# Create staff user
python manage.py create_staff_user
```

### 9. Run Development Server

```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000` in your browser.

## 🔄 Daily Development Workflow

### Starting Development

```bash
# 1. Navigate to project directory
cd path/to/maguva

# 2. Activate virtual environment
# Windows:
goat\Scripts\activate
# Linux/Mac:
source goat/bin/activate

# 3. Start development server
python manage.py runserver
```

### Making Database Changes

```bash
# After modifying models
python manage.py makemigrations
python manage.py migrate
```

## 🌐 API Endpoints

### Dashboard APIs
- `GET /api/dashboard/overview/` - Main dashboard metrics
- `GET /api/dashboard/recent-orders/` - Recent orders list
- `GET /api/dashboard/sales-chart/` - Sales chart data
- `GET /api/dashboard/product-performance/` - Top products
- `GET /api/dashboard/low-stock/` - Low stock alerts
- `GET /api/dashboard/payment-stats/` - Payment method statistics
- `GET /api/dashboard/monthly-trend/` - Monthly revenue trends

## 📁 Project Structure

```
maguva/
├── Manguva/                 # Main Django project
│   ├── settings.py         # Project settings
│   ├── urls.py            # URL configuration
│   └── wsgi.py            # WSGI configuration
├── apps/                   # Django applications
│   ├── authentication/    # User management
│   ├── inventory/         # Product & inventory
│   ├── sales/            # Orders & billing
│   └── dashboard/        # Dashboard APIs
├── static/               # Static files (CSS, JS, images)
├── templates/           # HTML templates
├── requirements.txt     # Python dependencies
└── manage.py           # Django management script
```

## 🛠️ Technology Stack

- **Backend:** Django 4.2+, Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** Django Auth, JWT
- **API:** RESTful APIs
- **Frontend:** React.js, Ant Design

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=maguva_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## 📋 Features

- 👥 **User Management** - Admin and staff user roles
- 📦 **Inventory Management** - Products, vendors, stock tracking
- 🛒 **Sales Management** - Orders, billing, payment tracking
- 📊 **Dashboard** - Real-time analytics and reporting
- 🔍 **Search & Filter** - Advanced product and order filtering
- 📱 **Responsive Design** - Works on desktop and mobile

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check if PostgreSQL is running
# Windows: Check Services
# Linux: sudo systemctl status postgresql
```

**2. Virtual Environment Issues**
```bash
# Deactivate and recreate environment
deactivate
rm -rf goat
python -m venv goat
```

**3. Migration Errors**
```bash
# Reset migrations (⚠️ Will lose data)
python manage.py migrate --fake-initial
```

**4. Permission Denied Errors**
```bash
# Run as administrator (Windows) or use sudo (Linux)
```

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the [documentation](link-to-docs)
- Contact: your-email@example.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Happy Coding!** 🚀