# Instructions for building


## Requirements

- Docker


## Instructions

0. Create a directory (e.g `mkdir build`) and change your current directory to that (`cd build`). Make sure Docker daemon (`dockerd`) is running (on Windows, you can start docker desktop, on GNU/Linux systems that use systemd, you can start with `systemctl start docker`).

1. Run `git clone https://github.com/bounswe/bounswe2025group6`.

2. Go to the `mobile` folder (`cd mobile`).

3. Build the application package with `docker build --output=. .`. (If you get a permission related error, run it with elevated privileges. For example on GNU/Linux that would be `sudo docker build --output=. .`). This will produce `app-release.apk` in the same directory. You can install this package directly on an Android phone or run it with an emulator.


**Note:** Building might take a while and might eat all your memory (both volatile and non volatile). Make sure you have enough space and time.







