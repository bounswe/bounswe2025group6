# Deployment HOWTO

## Requirements

- Docker

## Instructions

0. Create a directory (e.g `mkdir server`) and change your current directory to that (`cd server`).

1. Run `git clone https://github.com/bounswe/bounswe2025group6`.

2. Create an .env file and put the necessary environment variables. (You can get the latest list from backend team)

3. Go to the `practice-app` folder (`cd practice-app`).

4. Build the docker images with `docker compose build`. (If you get a permission related error, run it with elevated privileges. For example on GNU/Linux that would be `sudo docker compose build`)

5. Run the image with `sudo docker compose up -d` (-d is to make it run on the background).

## How to gracefully close

1. In the same `practice-app` directory, run `sudo docker compose down`.
