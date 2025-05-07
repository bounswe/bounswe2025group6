# Backend Setup README

## Before You Start:
- This document is intended for developers who are new to the project and need to set up the backend environment.
- It provides a step-by-step guide to set up the backend environment, including local and Docker setups.
- The document assumes you have basic knowledge of Python, Django, and Docker.
- It is important to follow the instructions carefully to avoid any issues during the setup process.
- If you encounter any issues, please refer to the troubleshooting section or reach out to the backend team for assistance. @celilozknn, @cemsarpkaya, @OzgurSavascioglu

- You can find many documentations about the endpoints in our `backend/docs` folder. We try to keep them up to date. If you find any missing or outdated documentation, please let us know.
- There are also some other documents that we briefly explain some common problems and how we solve them, such as jwt-tokenazitaon, local database setup, etc. You can find them in the `backend/docs` folder as well.

# FitHub Backend Setup Guide
## 0. Prerequisites

Ensure the following are installed on your machine:

- **Git**
- **MySQL**
- **Docker**
- **Docker Compose**

Check with:
```bash
git --version

mysql --version

docker --version

docker-compose --version
```

> 💡 Note: If you are using Docker, you do not need to install Python, pip, or any Python dependencies. Docker handles everything in an isolated environment.

- **Setup Option**: After ensuring you have all the prerequisites, you can choose between two setup options: **Local Setup** or **Docker Setup**.
    - **Local Setup**: This option is for those who prefer to run the application locally without Docker. It requires installing dependencies directly on your machine.
    - **Docker Setup**: This option is for those who prefer to run the application inside a Docker container. It isolates the application and its dependencies from your local environment, making it easier to manage and deploy.


## 1. Local Setup
- **Move to the backend directory**:
    ```bash
    cd backend/fithub
    ```
- **Create Environment Variables**:
    Create a `.env` file in the `backend/fithub` directory. You can obtained necessary `.env` folder with the help of the backend team.

- **Virtual Environment**:
    It's recommended to use a virtual environment to manage dependencies. You can create one using:
    - For Windows:
    ```bash
    python -m venv .venv
    ```
    - For macOS/Linux:
    ```bash
    python3 -m venv .venv
    ```
- **Activate the virtual environment**:
    - For Windows:
        ```bash
        .venv\Scripts\activate
        ```
    - For macOS/Linux:
        ```bash
        source .venv/bin/activate
        ```
- **Install dependencies**:
    Install the required dependencies using pip. This will install all the necessary packages listed in the `requirements.txt` file.
    ```bash
    pip install -r requirements.txt
    ```

- **Running necessary migrations**:
    After installing the dependencies, you need to run the necessary migrations to set up the database schema. This step is crucial for the application to function correctly and to have the current database structure.
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```
- **Run the Django application**:
    Finally, you can run the Django application using the following command:
    ```bash
    python manage.py runserver
    ```
    This will start the development server, and you can access the application in your web browser at `http://127.0.0.1:8000/`.
    You can also see the swagger documentation at `http://127.0.0.1:8000/swagger/`.

- **Stop the Django application**:
    To stop the Django application, press `Ctrl + C` (Windows) or `Command + C` (Mac) in the terminal where the server is running. This will stop the server and free up the resources used by it.

- **Deactivate the virtual environment**:
    When you're done working with the application, you can deactivate the virtual environment by running:
    ```bash
    deactivate
    ```

- **NOTE**: If you encounter any issues during the setup process, please refer to the troubleshooting section or reach out to the backend team for assistance.

## 2. Docker Setup
- **Move to the backend directory**:
    ```bash
    cd backend/fithub
    ```

- **Build the Docker image**:
    We first need to build the Docker image. This will create a container with all the necessary dependencies and configurations for our Django application.
    ```bash
    docker-compose build
    ```
- **Run the Docker container**:
    This command will start the container and run the Django application inside it.
    ```bash
    docker-compose up
    ```
    That's all! The Django application should now be running inside the Docker container.

- **Access the Django application**:
    Open your web browser and go to `http://0.0.0.0:8000/` to access the Django application.
    You can also see the swagger documentation at `http://0.0.0.0:8000/swagger/`.

- **Stop the Docker container**:
    To stop the container, press `Ctrl + C` (Windows), `Command + C` (Mac) in the terminal where the container is running. This will stop the application and free up the resources used by the container.

## 3. Django Migrations

Django **does not automatically apply changes** you make to `models.py`. You must create and apply migrations to update the database schema properly.

### How to Use Migrations

1. **Make model changes** in your app’s `models.py`.

2. **Generate migration files**:
   ```bash
   python manage.py makemigrations
   ```

3. **Apply migrations to the database:**
   ```bash
   python manage.py migrate
   ```

- **NOTE:** There are many other commands and we will not go into details about them. You can find the full list of commands in the Django documentation. We will only use these commands for now. If you want to learn more about migrations, please check the [Django Migrations Documentation](https://docs.djangoproject.com/en/stable/topics/migrations/).


💡 Always run makemigrations and migrate after editing models, and make sure your migrations/ folder is not ignored by .gitignore.


## 4. **Common Problems**:
- **Database connection issues**: Ensure your database is running and the connection settings in `.env` are correct.

- **Migration errors**: If you encounter migration errors, try deleting the migration files and running `makemigrations` and `migrate` again. Each folder in our backend folder (except fithub) MUST HAVE a folder named `migrations` with an empty `__init__.py` file inside. If you don't have it, please create it. After that, open your db manager app and remove all of your tables. Then run `python manage.py makemigrations` and `python manage.py migrate` commands again. Problem should be solved in most cases. If not the problem is more complicated and we have some other solutions. Please reach out to the backend team. We won't have any such problems after we deploy our application to the production server.

- **Code uppdates**: It's really common that one of the member of the backend team will update main branch. Hence before starting to work on anything please try to run these commands:
```bash
git checkout main
git pull origin main
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
```
- We first get the updated code from the main branch. Then we install the new dependencies if there are any. After that we run the migrations to update our database. (Just as we suggested above using a venv is highly recommended)

## Further Questions
If you have any questions or need further assistance, please reach out to the backend team. We are here to help you with any issues you may encounter during the setup process.
- **Backend Team**: @celilozknn, @cemsarpkaya, @OzgurSavascioglu
