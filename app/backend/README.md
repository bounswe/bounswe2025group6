# Backend Setup README

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


## 1. Local Setup (Not Recommended) (Work in Progress)
- **Move to the backend directory**:
    ```bash
    cd app/backend
    ```

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

> 🛑 .env file: A .env file already exists in the repo (under backend/). In a real project, sensitive credentials should not be committed, but it's here for simplicity.

## 2. Docker Setup (Recommended)
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

- **Stop the Docker container**:
    To stop the container, press `Ctrl + C` (Windows), `Command + C` (Mac) in the terminal where the container is running. This will stop the application and free up the resources used by the container.

> 🛑 .env file: A .env file already exists in the repo (under backend/). In a real project, sensitive credentials should not be committed, but it's here for simplicity.

## 3. Django Migrations

Django **does not automatically apply changes** you make to `models.py`. You must create and apply migrations to update the database schema properly.

### How to Use Migrations

1. **Make model changes** in your app’s `models.py`.

2. **Generate migration files**:
   ```bash
   python manage.py make migrations
   ```

3. **Apply migrations to the database:**
   ```bash
   python manage.py migrate
   ```

- **NOTE:** Only these two commands are needed to apply changes to the database. We assume you will never need the other commands in the best case scenario. The rest are optional and used for specific scenarios. Use them with caution and ask for help if you're unsure.

4. **Check migration status**:
   ```bash
    python manage.py show migrations
    ```

5. **Rollback migrations** (if needed):
    ```bash
    python manage.py migrate fithub <migration_name>
    ```
    Replace `<migration_name>` with the migration file name (e.g., `0001_initial`).

6. **Delete migration files** (if needed):

    ```bash
    rm fithub/migrations/0001_initial.py
    ```
    Replace `0001_initial.py` with the migration file you want to delete.

7. **Reset migrations** (if needed):
    ```bash
    python manage.py migrate fithub zero
    ```
    This command rolls back all migrations for the specified app.

- **NOTE:** We strongly suggest not to use any of the above commands (except 2 and 3) unless you are sure of what you are doing. If you need to delete or reset migrations, please ask for help from the backend team.

💡 Always run makemigrations and migrate after editing models, and make sure your migrations/ folder is not ignored by .gitignore.


## Further Questions
If you have any questions or need further assistance, please reach out to the backend team. We are here to help you with any issues you may encounter during the setup process.
- **Backend Team**: @celilozknn, @cemsarpkaya, @OzgurSavascioglu
