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
  url: 'https://chrome.google.com',
  path: 'webstore/detail'
}

let extensions = []

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
    await server.register([require('inert'), require('h2o2')])
    // Static content
    server.route({
      method: 'GET',
      path: '/store',
      handler: (request, h) => {
        return h.file('./src/storeList.html')
      }
    })

    // TODO: add this back, after fixing the proxy code
    // it may need to move down below the next route, since specifying `/*` might be too general
    // server.route({
    //   method: 'GET',
    //   path: '/{param*}',
    //   handler: {
    //     directory: {
    //       path: 'src'
    //     }
    //   }
    // })

    server.route({
      method: '*',
      path: '/' + remotes.path + '/{params*}',
      handler: {
        proxy: {
          mapUri: function (request, callback) {
            const extensionId = request.url.href.replace('/' + remotes.path + '/', '')
            const url = remotes.url + '/' + remotes.path + '/' + extensionId
            console.log('BSC]] returning ', url)
            return url
          },
          passThrough: true,
          xforward: true
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
