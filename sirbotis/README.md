# File descriptions

## Service Connector
These two files are the custom socket client and server connectors for my microservice architecture. A custom connector was created as existing libraries did not quite fit the setup I was looking for with this application. Clients connect to a server and join rooms predefined by the server. Servers emit data to these rooms, allowing multiple clients to receive the same data. Clients may also trigger functions to be processed by the server, with the results sent back across the socket.

## Triggered Events
This is an example of a service using the above client classes. It connects to a server that receives webhooks from Twitch, queries the database to see if a streamer has configured the bot to do anything for those event types, and if so it then handles the event.