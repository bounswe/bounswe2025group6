# Base this image on the premade package which only includes Node.js version 18.

FROM node:18

# Copy all the files in current directory to the /fithub directory in the container.

COPY . /frontend

# Set the working directory (like "cd") to "/frontend".

WORKDIR /frontend

# Install dependencies.

RUN npm i

# Run the server.

CMD [ "npm", "run", "dev" ]
