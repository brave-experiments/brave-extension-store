'use strict'

const Hapi = require('hapi')
const fs = require('fs')

// Create a server with a host and port
const server = Hapi.server({
  host: process.env.LISTEN_ADDRESS || 'localhost',
  port: process.env.PORT || 8080
})

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

async function start () {
  try {
    await server.register([require('inert'), require('h2o2')])
    // Static content
    server.route({
      method: 'GET',
      path: '/webstore',
      handler: (request, h) => {
        return h.file('./src/storeList.html')
      }
    })
    server.route({
      method: 'GET',
      path: '/webstore/',
      handler: (request, h) => {
        return h.file('./src/storeList.html')
      }
    })

    // Proxy requests for extension installs to Chrome Web Store
    const remotes = {
      url: 'https://chrome.google.com',
      path: 'webstore/detail'
    }

    server.route({
      method: '*',
      path: '/webstore/inlineinstall/detail/{params*}',
      handler: {
        proxy: {
          mapUri: function (request, callback) {
            const extensionId = request.url.href.replace('/webstore/inlineinstall/detail/', '')
            const url = remotes.url + '/webstore/inlineinstall/detail/' + extensionId
            console.log('Proxying ' + request.url.href + ' to ' + url)
            return {
              uri: url
            }
          },
          passThrough: true,
          redirects: 3
        }
      }
    })

    server.route({
      method: '*',
      path: '/' + remotes.path + '/{params*}',
      handler: {
        proxy: {
          mapUri: function (request, callback) {
            const extensionId = request.url.href.replace('/' + remotes.path + '/', '')
            const url = remotes.url + '/' + remotes.path + '/' + extensionId
            console.log('Proxying ' + request.url.href + ' to ' + url)
            return {
              uri: url
            }
          },
          redirects: 3
        }
      }
    })

    // used for static content (ex: images, JavaScript, etc)
    server.route({
      method: 'GET',
      path: '/webstore/{param*}',
      handler: {
        directory: {
          path: 'src'
        }
      }
    })
    // images packed with webpack
    server.route({
      method: 'GET',
      path: '/public/{param*}',
      handler: {
        directory: {
          path: 'src/public'
        }
      }
    })

    await server.start()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
  console.log('Server running at:', server.info.uri)
}

start()
