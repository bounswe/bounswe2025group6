# Deployment HOWTO

## Current server information

- Server address: https://fithubmp.xyz/

- API address: https://fithubmp.xyz:8000

## Requirements

- Docker

## Instructions

0. Create a directory (e.g `mkdir server`) and change your current directory to that (`cd server`). Make sure Docker daemon (`dockerd`) is running (on Windows, you can start docker desktop, on GNU/Linux systems that use systemd, you can start with `systemctl start docker`).

1. Run `git clone https://github.com/bounswe/bounswe2025group6`.

2. Go to the `practice-app` folder (`cd practice-app`).

3. Create an .env file and put the necessary environment variables. (You can get the latest list from backend team)

4. Build the docker images with `docker compose build`. (If you get a permission related error, run it with elevated privileges. For example on GNU/Linux that would be `sudo docker compose build`)

5. Run the image with `sudo docker compose up -d` (-d is to make it run on the background).

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
