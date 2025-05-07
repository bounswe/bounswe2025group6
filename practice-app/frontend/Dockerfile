
# Base this image on the premade package which only includes python version 3.11.1.

FROM node:18

# Disable output buffering so that the logs of the server can be read from Docker in real time.

# Copy all the files in current directory to the /fithub directory in the container.
COPY . /frontend

# Set the working directory (like "cd") to "/fithub".

WORKDIR /frontend

# Allow the container to accept requests coming to the port 8000.

EXPOSE 5173

# Run the preperations.

RUN npm i
#RUN python manage.py makemigrations api
#RUN python manage.py migrate

# Run the server. "0.0.0.0" is to make the server be able to listen from anywhere, not just from within the container.

CMD [ "npm", "run", "dev", "--", "--host=0.0.0.0" ]