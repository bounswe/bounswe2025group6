# Deployment HOWTO

## Current server information

- Server address: https://fithubmp.xyz/

- API address: https://fithubmp.xyz:8000

## Requirements

- Docker daemon
- Git
- MySQL client

## Instructions

0. Create a directory (e.g `mkdir server`) and change your current directory to that (`cd server`). Make sure Docker daemon (`dockerd`) is running (on Windows, you can start docker desktop, on GNU/Linux systems that use systemd, you can start with `systemctl start docker`).

1. Run `git clone https://github.com/bounswe/bounswe2025group6`.

2. Go to the `bounswe2025group6/practice-app` folder (`cd bounswe2025group6/practice-app`).

3. Create an .env file and put the necessary environment variables. (You can also use the example `.env` file named `.env.example`. Rename it and remove the part before the extension. (e.g `move .env.example .env` on Windows and `mv .env.example .env` on GNU/Linux))

4. Copy the `.env` file to backend and frontend subfolders. (`cp .env frontend/.env` and `cp .env backend/fithub/.env`)

    - If you are intending to run a HTTPS server, also copy the certificate and key files to the same subfolders. (`backend/fithub/fullchain.pem`, `backend/fithub/privkey.pem` and `frontend/fullchain.pem`, `frontend/privkey.pem`)

    - Then, make sure to set `HTTPS_CERT` and `HTTPS_KEY` variables in the `.env` files.

    - For **production**, you can set the `COMPOSE_PROFILES` to `https_prod`, which will set the Nginx server up with SSL encryption on port 443, and the API URL will be `https://<domain>/api`. Or you can specify `http_prod` to start a HTTP server at port 8080.

    - For **development**, you can use the `https` or `http` for `COMPOSE_PROFILES`, which will start HTTPS and HTTP development servers, respectively.

4. Build the docker images with `docker compose build`. (If you get a permission related error, run it with elevated privileges. For example on GNU/Linux that would be `sudo docker compose build`)

5. Run the image with `sudo docker compose up -d` (-d is to make it run on the background).

## Populating the database

1. While the server is running, on the same directory (`bounswe2025group6/practice-app`, from another terminal), enter the command: `mysql -h 127.0.0.1 -u <db user> -p < backend/populate_db_sqls/all_ingredients.sql`. You will be prompted asking for the password you selected in the `.env` file.

2. For the users, enter: `mysql -h 127.0.0.1 -u <db user> -p < backend/populate_db_sqls/users.sql

## Pre created user information

For a generic user, you can log in with `fithubuser@fithub.com` as email and `Fithubpass1` as the password.

For an admin, you can log in with `fithubadmin@fithub.com` as email and `Fithubadmin1` as the password.

## How to test later changes with docker

After each change, you should close the server with `docker compose down`, and re-build the images. (follow 4-5 from above instructions) If you are low on disk space, you can inspect images with `docker image ls` or containers with `docker container ls`, and remove the ones you don't use with `docker container rm <container-id>` or `docker image rm <image-id>`. You can also run `docker container prune` or `docker image prune`, to get rid of outdated images/containers.

## How to gracefully close

1. In the same `practice-app` directory, run `sudo docker compose down`.

## Frequently encountered problems

- "table already in use"/"field x doesn't exist in table y": These are mostly related to migration issues, which are caused by either incomplete migrations (that results in a faulty table generation) or something that is done wrong in a previous version.

*Temporary solution*: 

1. Remove all folders with names "migrations" and "__pycache__" (This step is mostly due to previous deployment errors so it can be optional)

2. Reset the database, you can either empty the database or you can remove the volume (run the command `docker volume rm practice-app_db_data`) associated with the mysql container, which is currently named "practice-app_db_data". Volume name is derived from the docker compose file and the folder name you are running the container in. If you are still unsure you can inspect all volumes with `docker volume ls` command. *WARNING: THIS WILL REMOVE ALL DATA ASSOCIATED WITH THE MYSQL CONTAINER.* Other non-dockerized MySQL databases are unaffected.

3. Follow the above instructions again (you can continue from step 4.)

