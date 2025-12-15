# Instructions for building


## Requirements

- Docker


## Instructions

0. Create a directory (e.g `mkdir build`) and change your current directory to that (`cd build`). Make sure Docker daemon (`dockerd`) is running (on Windows, you can start docker desktop, on GNU/Linux systems that use systemd, you can start with `systemctl start docker`).

1. Run `git clone https://github.com/bounswe/bounswe2025group6`.

2. Go to the `mobile` folder (`cd mobile`).

3. Build the application package with `docker build --build-arg API_URL=<api url here> --output=. .`. **API_URL** is the base URL of the backend server, e.g `https://fithubmp.xyz:8000`. (If you get a permission related error, run it with elevated privileges. For example on GNU/Linux that would be `sudo docker build --output=. .`). This will produce `app-release.apk` in the same directory. You can install this package directly on an Android phone or run it with an emulator.

## Configuring for development/production

You should have a backend server set and up first. Read [here](https://github.com/bounswe/bounswe2025group6/blob/main/practice-app/README.md) for the instructions.

- For **development**: If you plan on running the produced application package on an emulator, you can either connect to the Internet and specify a public URL (e.g, `https://fithubmp.xyz:8000`) or use the alias for local loopback address (e.g, `http://10.0.2.2:8000`, assuming HTTP server) for the `API_URL` variable at step 3 above.

  - Generally you will want local backend running through HTTP, so `http://10.0.2.2:8000` will be suitable.

- For **production**: If you have deployed and run the backend server on a public address (either an IP or a domain name), specify that URL for the `API_URL` variable at step 3 above.

  - Generally you will have deployed the server on a public domain, so something like `https://fithupbmp.xyz:8000` will be suitable.


**Note:** Building might take a while and might eat all your memory (both volatile and non volatile). Make sure you have enough space and time.







