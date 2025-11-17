# Nura Oud Essence - E-commerce Platform

## Project Overview

This is a full-stack e-commerce application for Nura Oud Essence, featuring a React frontend and Laravel backend with MySQL database.

## Technologies Used

### Frontend
- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and state management

### Backend
- **Laravel** - PHP framework
- **MySQL** - Database
- **RESTful API** - For frontend-backend communication
- **Admin Dashboard** - Product management interface

## Getting Started

### Prerequisites
- Node.js & npm
- PHP 8.1+
- Composer
- MySQL

### Frontend Setup

1. Install dependencies:
   ```sh
   npm install
   ```

2. Start development server:
   ```sh
   npm run dev
   ```
   Server will run on http://localhost:8080

### Backend Setup

1. Navigate to backend directory:
   ```sh
   cd backend
   ```

2. Install PHP dependencies:
   ```sh
   composer install
   ```

3. Configure environment:
   ```sh
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Generate app key:
   ```sh
   php artisan key:generate
   ```

5. Import database:
   - Create MySQL database: `nura_oud_essence`
   - Import `database.sql` file (pastikan menggunakan file terbaru dengan password admin yang benar)

6. Start Laravel server:
   ```sh
   php artisan serve
   ```
   Server will run on http://localhost:8000

### Admin Access
- URL: http://localhost:8000/admin/dashboard
- Email: admin@nuraoud.com
- Password: admin123

### API Endpoints
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

## Project Structure

```
/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks
│   └── lib/               # Utilities
├── backend/               # Laravel backend
│   ├── app/               # Application code
│   ├── routes/            # API routes
│   └── resources/         # Views and assets
├── database.sql           # Database dump
└── README.md
```

## Features

- Product catalog with search and filtering
- Shopping cart functionality
- User authentication
- Admin dashboard for product management
- Responsive design
- RESTful API architecture

## Development

### Frontend
- Uses Vite for fast development
- Hot reload enabled
- TypeScript for type safety
- shadcn/ui for consistent UI components

### Backend
- Laravel framework
- Eloquent ORM
- CORS configured for frontend
- Admin middleware for protected routes

## Deployment

1. Build frontend: `npm run build`
2. Deploy backend to PHP server
3. Configure database on production
4. Update CORS settings for production domain
"# nuraoud-frontend" 
