Ghost
=====

The solution is divided into two parts: server and client. They are found in
server/ and client/ respectively.

Server
------

The server requires Hapi.js to work, which can be installed using

  npm install hapi

To start the server, use

  node server.js

It will start the server on port 8000, localhost.
The host and port can be changed at the top of server.js

Client
------

Open index.html in Chrome and everything should be working.

The access point URL is configurable at the top of js/ghost.js

Implementation notes
--------------------

The server was initially based on a naive array implementation, which was
later replaced with a trie-based implementation. v0.2 puts more emphasis on
structure and separation of concerns. v0.3 improves testability.
