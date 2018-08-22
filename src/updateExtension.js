/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Example usage:
 * Check Chrome servers, update all extensions to S3 and write out a new extensions manifest
 *   node bin/updateExtensions.js --chromium=55.0.2883.87 --upload --location=../vault-updater/data/
 * Check Chrome servers, update a specific extension to S3 and write out a new extensions manifest
 *   node bin/updateExtensions.js --chromium=55.0.2883.87 --upload --location=../vault-updater/data/ --id aomjjhallfgjeglblehebfpbcfeobpgk
 * Check Chrome servers, download all extensions into the out/ directory, but don't upload them
 *   node bin/updateExtensions.js --chromium=55.0.2883.87 --download
 * Check Chrome servers to get a list of updates
 *   node bin/updateExtensions.js --chromium=55.0.2883.87
 * Check Brave servers to get a list of updates against what we have locally, also this is useful as a verification check to ensure 0 updates.
 *   node bin/updateExtensions.js --chromium=55.0.2883.87 --server=brave
 * Check Brave servers to get a list of updates against what we have locally with verbose logging
 *   node bin/updateExtensions.js --chromium=55.0.2883.87 --server=brave --v=2
 * Upload an individual extension that we maintain and update the manifest from local data (We do this for our own maintained extensions like PDFJS)
 *   node bin/updateExtensions.js --chromium=55.0.2883.87 --id jdbefljfgobbmcidnmpjamcbhnbphjnb --path ~/Downloads/pdfjs.crx --version 1.5.444
 */

const request = require('request')
const s3 = require('s3')
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const xmldoc = require('xmldoc')
// const args = require('yargs')
//     .usage('node $0 --chromium=X.X.X.X [--download] [--upload] [--server=<server>] [--v=<v>] [--id=<componentId> --path=<path> --version=<version>]')
//     .demand(['chromium', 'location'])
//     // Whether or not to download from the chromium server when it is outdated
//     .default('download', false)
//     // Whether or not to upload to brave's s3 when it is downloaded (download is implied)
//     .default('upload', false)
//     // Only brave is treated as a special value
//     .default('server', 'google')
//     // Default log level to 1
//     .default('v', 1)
//     .argv

const args = {
  location: './src/'
}

const googleUpdateServerBaseUrl = 'https://clients2.google.com/service/update2'
const braveUpdateServerBaseUrl = 'https://laptop-updates.brave.com/extensions'
const localUpdateServerBaseUrl = 'http://localhost:8192/extensions'
const widevineComponentId = 'oimompecagnajdejgnnjijobebaeigek'

const S3_EXTENSIONS_BUCKET = process.env.S3_EXTENSIONS_BUCKET || 'brave-extensions'

const extensionManifestPath = path.join(args.location, 'extensionManifest.json')

// check that the Manifest exists
if (!fs.existsSync(extensionManifestPath)) {
  throw new Error('Manifest does not exist at ' + args.location)
}

// I'm not sure how we'll organize this in the future, but for now just pass along static data
// Format is: [extensionId, version, hash]
const readExtensions = () => JSON.parse(fs.readFileSync(extensionManifestPath))

// Components are all extensions plus some other things like Widevine
const readComponentsForVersionUpgradesOnly = () => [...readExtensions(),
  // This should always be served from Google servers for licensing reasons
  // and this is only used for purposes of reporting.  We don't actually serve this file.
  [widevineComponentId, '1.4.8.903', '', 'Widevine']
]

/**
 * Extracts an array of components along with their version from response XML
 *
 * @param @responseXML - The update check response XML protocol 3.0
 * @return undefined if there was an error parsing the document, or an array of
 *   [componentId, componentVersion] if successful.
 */
const getResponseComponents = (responseXML) => {
  const doc = new xmldoc.XmlDocument(responseXML)
  if (doc.attr.protocol !== '3.0') {
    console.error('Only protocol v3 is supproted')
    return undefined
  }
  const extensions = doc.childrenNamed('app')
    .map((app) => {
      const updatecheckManifest = app.descendantWithPath('updatecheck.manifest')
      const updatecheckManifestPackages = app.descendantWithPath('updatecheck.manifest.packages.package')

      return [
        app.attr.appid,
        updatecheckManifest && updatecheckManifest.attr.version,
        updatecheckManifestPackages && updatecheckManifestPackages.attr.hash_sha256
      ]
    })
  return extensions
}

const getExtensionServerBaseURL = () => {
  switch (args.server) {
    case 'brave':
      return braveUpdateServerBaseUrl
    case 'local':
      return localUpdateServerBaseUrl
  }
  return googleUpdateServerBaseUrl
}

const vlog = (arg1, arg2) => {
  console.log(arg1, arg2)
}

vlog(1, 'Using server:', getExtensionServerBaseURL())
vlog(1, 'Using S3 bucket:', S3_EXTENSIONS_BUCKET)

const getRequestBody = (chromiumVersion, components) =>
  `<?xml version="1.0" encoding="UTF-8"?>
  <request protocol="3.0" version="chrome-${chromiumVersion}" prodversion="${chromiumVersion}" requestid="{b4f77b70-af29-462b-a637-8a3e4be5ecd9}" lang="" updaterchannel="stable" prodchannel="stable" os="mac" arch="x64" nacl_arch="x86-64">
    <hw physmemory="16"/>
    <os platform="Mac OS X" version="10.11.6" arch="x86_64"/>` +
      components.reduce((responseXML, component) => {
        return responseXML +
          `<app appid="${component[0]}" version="0.0.0.0" installsource="ondemand">
          <updatecheck />
          <ping rd="-2" ping_freshness="" />
        </app>`
      }, '') +
      '</request>'

const client = s3.createClient({
  maxAsyncS3: 20,
  s3RetryCount: 3,
  s3RetryDelay: 1000,
  multipartUploadThreshold: 20971520,
  multipartUploadSize: 15728640,
  // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
  s3Options: {}
})

const braveComponents = readComponentsForVersionUpgradesOnly()
const components = braveComponents
// Skip PDFJS since we maintain our own and Google doesn't know anything about it
  .filter((component) => component[0] !== 'jdbefljfgobbmcidnmpjamcbhnbphjnb')

const body = getRequestBody(args.chromium, components)
const mkdir = (path) => !fs.existsSync(path) && fs.mkdirSync(path)

const getSHA = (filePath) => {
  return new Promise((resolve) => {
    var s = fs.ReadStream(filePath)
    const checksum = crypto.createHash('sha256')
    s.on('data', function (d) { checksum.update(d) })
    s.on('end', function () {
      resolve(checksum.digest('hex'))
    })
  })
}

const verifyFileSHA = (filePath, expectedSHA256) => {
  return new Promise((resolve, reject) => {
    getSHA(filePath).then((calculatedSHA256) => {
      if (calculatedSHA256 === expectedSHA256) {
        vlog(1, `Verified SHA for ${filePath}`)
        resolve()
      } else {
        console.error('Bad SHA56:', calculatedSHA256, ', expected: ', expectedSHA256)
        reject(new Error('mismatch'))
      }
    })
  })
}

const uploadFile = (filePath, componentId, componentFilename) => {
  return new Promise((resolve, reject) => {
    var params = {
      localFile: filePath,

      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
      s3Params: {
        Bucket: S3_EXTENSIONS_BUCKET,
        Key: `release/${componentId}/${componentFilename}`,
        ACL: 'public-read'
      }
    }

    const uploader = client.uploadFile(params)
    uploader.on('error', function (err) {
      console.error('Unable to upload:', err.stack, 'Do you have ~/.aws/credentials filled out?')
      reject(new Error('credentials'))
    })
    uploader.on('end', function (params) {
      resolve()
    })
  })
}

const writeExtensionsManifest = (componentData) =>
  fs.writeFileSync(extensionManifestPath, JSON.stringify(componentData, null, 2) + '\n')

// Check if we're only uploading an individual extension
module.exports.updateExt = (extensionId, uploadPath, extensionVersion, download, upload) => {
  args.id = extensionId
  args.path = uploadPath
  args.version = extensionVersion
  args.download = download
  args.upload = upload

  if (args.id && args.path && args.version) {
    // UPLOAD SINGLE extension
    const braveExtensions = readExtensions()
    const braveExtension = braveExtensions.find(([braveComponentId]) => braveComponentId === args.id)
    if (!braveExtension) {
      vlog(1, `Could not find component ID: ${extensionId}`)
      process.exit(1)
    }
    const filename = `extension_${args.version.replace(/\./g, '_')}.crx`
    uploadFile(args.path, args.id, filename)
      .then(getSHA.bind(null, args.path))
      .then((sha) => {
        braveExtension[1] = args.version
        braveExtension[2] = sha
      })
      .then(writeExtensionsManifest.bind(null, braveExtensions))
      .then(process.exit.bind(null, 0))
      .catch(process.exit.bind(null, 1))
  } else {
    // update ALL extensions
    request.post({
      url: getExtensionServerBaseURL(),
      body: body,
      headers: {
        'Content-Type': 'application/xml'
      }
    }, function optionalCallback (err, httpResponse, body) {
      if (err) {
        return console.error('failed:', err)
      }

      vlog(2, 'Response body:', body)
      let responseComponents = getResponseComponents(body)
        .filter(([componentId]) => !args.id || componentId === args.id)
      if (responseComponents.length === 0) {
        console.error('No component information returned')
      }

      vlog(1, 'Checked components:\n---------------------')
      vlog(1, `${braveComponents.map((extension) => extension[3]).join(', ')}\n`)

      // Add in the Brave info for each component
      vlog(1, 'Outdated components:\n--------------------')
      vlog(1, responseComponents.map((component) => [...component, ...braveComponents.find((braveComponent) => braveComponent[0] === component[0])])
        .map((component) => [...component, ...braveComponents.find((braveComponent) => braveComponent[0] === component[0])])
        // Filter out components with the same Brave versions as Google version
        .filter((component) => component[1] !== component[4])
        // And reduce to a string that we print out
        .reduce((result, [componentId, chromeVersion, chromeSHA256, componentId2, braveVersion, braveSHA256, componentName]) => result + `Component: ${componentName} (${componentId})\nChrome store: ${chromeVersion}\nBrave store: ${braveVersion}\nSHA 256: ${chromeSHA256}\n\n`, ''))

      // Widevine components should not be attempted to be downloaded or uploaded, it is just for getting the version.
      // If you try it will just throw an error.
      responseComponents = getResponseComponents(body)
        .filter(([componentId]) => componentId !== widevineComponentId)

      if (args.download || args.upload) {
        mkdir('out')
        vlog(1, 'Downloading...')
        responseComponents.forEach(([componentId, chromeVersion, chromeSHA256, componentId2, braveVersion, braveSHA256, componentName]) => {
          const dir = path.join('out', componentId)
          const filename = `extension_${chromeVersion.replace(/\./g, '_')}.crx`
          mkdir(dir)
          const outputPath = path.join(dir, filename)
          // TODO: this is assigned, but never used. Does this work?
          // var file = fs.createWriteStream(outputPath)
          const url = `${getExtensionServerBaseURL()}/crx?response=redirect&prodversion=${args.chromium}&x=id%3D${componentId}%26uc`
          request(url)
            .pipe(fs.createWriteStream(outputPath))
            .on('finish', function () {
              vlog(1, `Downloaded ${outputPath} from Google's server`)
              if (args.upload) {
                verifyFileSHA(outputPath, chromeSHA256)
                  .then(uploadFile.bind(null, outputPath, componentId, filename))
                  .then(() => vlog(1, `Uploaded ${outputPath} to s3`))
              }
            })
        })
        writeExtensionsManifest(
          readExtensions().map(([braveComponentId, braveVersion, braveSHA256, braveComponentName]) => {
            const chromeComponent = responseComponents.find((chromeComponent) => braveComponentId === chromeComponent[0])
            return [
              braveComponentId,
              chromeComponent ? chromeComponent[1] : braveVersion,
              chromeComponent ? chromeComponent[2] : braveSHA256,
              braveComponentName
            ]
          }))
      }
    })
  }

  return 'updated!'
}
