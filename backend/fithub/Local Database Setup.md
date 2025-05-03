# Setting Up and Connecting the Local Database for FitHub

This guide outlines the steps to set up the local database for the FitHub project and connect it to the backend.

----------

## 1. Create the Local Database

Ensure MySQL is installed and running on your machine. Then, log in to MySQL and create the database:

    CREATE DATABASE fithub;

💡 Use your MySQL client of choice or run the command via terminal with `mysql -u root -p`.

## 2. Configure Environment Variables

Navigate to the project’s backend directory:

    cd backend/fithub

Open or create the `.env` file in this directory and configure the following variables:
DB_NAME=fithub
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD   # Replace with your actual MySQL root password
DB_HOST=localhost
DB_PORT=3306

EMAIL_HOST_USER=fithub.notifications@gmail.com
EMAIL_HOST_PASSWORD=**** **** **** ****   # Replace with actual password or app password

## 3. Apply Database Migrations

Ensure you're in the project root or `backend/fithub` where `manage.py` is located, and then run:

    python3 manage.py makemigrations api
    python3 manage.py migrate
This will apply the migrations and initialize the local database.

----------

## ✅ Final Check

-   Ensure MySQL server is running.
    
-   Confirm the `.env` file is properly set.
    
-   Run the development server and verify database connectivity.
