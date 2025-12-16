
# Base this image on the premade package which only includes python version 3.11.1.

FROM python:3.11.1

# Disable output buffering so that the logs of the server can be read from Docker in real time.

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copy all the files in current directory to the /fithub directory in the container.
COPY . /fithub

# Set the working directory (like "cd") to "/fithub".

WORKDIR /fithub

# Allow the container to accept requests coming to the port 8000.

EXPOSE 8000

# Install the requirements.

RUN pip install -r requirements.txt

# Run the server. "0.0.0.0" is to make the server be able to listen from anywhere, not just from within the container.

#CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000" ]
