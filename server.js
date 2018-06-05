'use strict';

const Hapi=require('hapi');
const fs = require('fs')

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

let extensions = []

// API: define routes
server.route({
    method:'GET',
    path:'/brave-extension-store',
    handler:function(request, h) {
        const response = fs.readFileSync('./src/extensionManifest.json')
        extensions = JSON.parse(response)
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

server.route({
    method:'GET',
    path:'/brave-extension-store-update',
    handler:function(request, h) {
        try{
            var update = require('./src/updateExtension')
            return update.updateExt()
        } catch (e) {
            console.log('Error during `brave-extension-store-update`: ', e)
        }
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
        // DEBUG: console.log('start1')
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
}

start()
