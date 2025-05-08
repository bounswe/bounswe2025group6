# Deployment HOWTO

## Requirements

- Docker

## Instructions

0. Create a director (e.g `mkdir server`) and change your current directory to that (`cd server`).

1. Run `git clone https://github.com/bounswe/bounswe2025group6`.

2. Go to the `practice-app` folder (`cd practice-app`).

3. Build the docker images with `docker compose build`. (If you get a permission related error, run it with elevated privileges. For example on GNU/Linux that would be `sudo docker compose build`)

4. Run the image with `sudo docker compose up -d` (-d is to make it run on the background).

## How to gracefully close

1. In the same `practice-app` directory, run `sudo docker compose down`.
