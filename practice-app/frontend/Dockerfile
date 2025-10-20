# Base this image on the premade package which only includes Node.js version 18.

FROM node:18

# Copy all the files in current directory to the /fithub directory in the container.

COPY . /frontend

# Set the working directory (like "cd") to "/frontend".

WORKDIR /frontend

# Allow the container to accept requests coming to the port 5173.

EXPOSE 443

# Run the preperations.

RUN npm i

# Run the server. "0.0.0.0" is to make the server be able to listen from anywhere, not just from within the container.

CMD [ "npm", "run", "dev" ]

#, "--host=0.0.0.0" ]
