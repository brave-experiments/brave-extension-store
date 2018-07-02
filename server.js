'use strict'

const Hapi = require('hapi')
const fs = require('fs')

var certOptions = {
  key: fs.readFileSync('./server-example.key'),
  cert: fs.readFileSync('./server-example.crt')
}

// Create a server with a host and port
const server = Hapi.server({
  host: 'example.com',
  port: 443,
  tls: certOptions
})

// Creating remote proxies for chrome.google.com to example.com
var remotes = {
  url: "https://chrome.google.com",
  path: 'webstore/category/extensions'
}

let extensions = []


server.route({
  method: '*',
  path: '/' + remotes.path + '/{params*}',
  handler: {
    proxy: {
      mapUri: function(request, callback) {
        var url = remotes.url + "/" + request.url.href.replace('/' + remotes.path + '/', '')
        callback(null, url)
      },
      pathThrough: true,
      xforward: true
    }
  }
})

// API: define routes
server.route({
  method: 'GET',
  path: '/brave-extension-store',
  handler: function (request, h) {
    const response = fs.readFileSync('./src/extensionManifest.json')
    extensions = JSON.parse(response)
    return {
      extensions: extensions
    }
  }
})

server.route({
  method: 'GET',
  path: '/brave-extension-store/{extensionId}',
  handler: function (request, h) {
    return extensions.find((extension) => {
      return extension.extensionId === request.params.extensionId
    })
  }
})

server.route({
  method: 'GET',
  path: '/brave-extension-store-update',
  handler: function (request, h) {
    try {
      var update = require('./src/updateExtension')
      return update.updateExt()
    } catch (e) {
      console.log('Error during `brave-extension-store-update`: ', e)
    }
  }
})

// Start the server
async function start () {
  try {
    await server.register(require('inert'))
    await server.register(require('h2o2'))
    // Static content
    server.route({
      method: 'GET',
      path: '/store',
      handler: (request, h) => {
        return h.file('./src/storeList.html')
      }
    })

    //
    server.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: 'src'
        }
      }
    })
    // DEBUG: console.log('start1')
    await server.start()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
  console.log('Server running at:', server.info.uri)
}

start()
