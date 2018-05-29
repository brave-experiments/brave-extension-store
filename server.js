'use strict';

const Hapi=require('hapi');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

const extensions = [
    {
        name: '1Password',
        extensionId: 'aomjjhallfgjeglblehebfpbcfeobpgk'
    },
    {
        name: 'LastPass',
        extensionId: 'hdokiejnpimakedhajhdlcegeplioahd'
    }
]

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
                return h.file('./src/store.html');
            }
        });

        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();
