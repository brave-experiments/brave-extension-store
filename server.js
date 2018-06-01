'use strict';

const Hapi=require('hapi');
const fs = require('fs')

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

let extensions = []

fs.readFile('./src/extensionManifest.json', (err, data) => {
  if (err) throw err;

  extensions = JSON.parse(data)

  console.log(data);
});

// API: define routes
server.route({
    method:'GET',
    path:'/brave-extension-store',
    handler:function(request, h) {
        return {
            extensions: extensions
        }
    }
});

server.route({
    method: 'GET',
    path: '/brave-extension-store/{extensionId}',
    handler: function (request, h) {
        return extensions.find((extension) => {
            return extension.extensionId === request.params.extensionId
        })
    }
});

// Start the server
async function start() {
    try {
        await server.register(require('inert'));

        // Static content
        server.route({
            method: 'GET',
            path: '/store',
            handler: (request, h) => {
                return h.file('./src/storeList.html');
            }
        });

        //
        server.route({
            method: 'GET',
            path: '/{param*}',
            handler: {
                directory: {
                    path: 'src'
                }
            }
        });
        console.log('start1')
        await server.start();
        console.log('start2')
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
}

start()
