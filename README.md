# Ghost Game

This was a solution to a programming challenge for an interview, practically the first thing I'd ever done in node.js

The solution is divided into two parts: server and client. They are found in
server/ and client/ respectively.

## Server

The server requires Hapi.js to work, which can be installed using

```
  npm install hapi
```

To start the server, use

```
  node server.js
```

It will start the server on port 8000, localhost.
The host and port can be changed at the top of server.js

Running unit tests requires nodeunit. Install it with

```
sudo npm install nodeunit -g
```

To run the unit tests, enter

```
nodeunit test-ghost-server.js
```

or use Jasmine. Install it with

```
sudo npm install jasmine-node -g
```

then run it with

```
jasmine-node .
```

Note: Jasmine specs are incomplete. They do provide better isolation, however,
by using spies.

## Client

Open index.html in Chrome and everything should be working.

The access point URL is configurable at the top of js/ghost.js
