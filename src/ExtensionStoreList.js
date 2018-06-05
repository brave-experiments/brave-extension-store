'use strict';

const React = require('react')
const { PushButton } = require('brave-ui')

class ExtensionStoreList extends React.Component {
  constructor (props) {
    super()
    this.state = {
      extensions: []
    }
    this.fetchExtensions = this.fetchExtensions.bind(this)
  }

  fetchExtensions () {
    var xmlhttp = new XMLHttpRequest()
    const self = this

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
              const response = JSON.parse(xmlhttp.response)
              const extensions = []

              response.extensions.forEach((extension) => {
                // console.log('TEST: extension', extension)
                extensions.push(extension)
              })

              self.setState({extensions})
           } else {
              console.log('Request returned ' + xmlhttp.status)
           }
        }
    }

    xmlhttp.open('GET', '/brave-extension-store', true)
    xmlhttp.send()
  }

  checkForUpdates () {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
              document.getElementById("messages").innerHTML = xmlhttp.response

              // TODO: this.setState()
              // ex: this.setState('extensions', xmlhtml)

           } else {
              console.log('Request returned ' + xmlhttp.status)
           }
        }
    }

    xmlhttp.open('GET', '/brave-extension-store-update', true)
    xmlhttp.send()
  }

  render () {
    return <div>
      <h1>Extensions</h1>
      <div id="extensions">
        {
          this.state.extensions.map((extension) => {
            return <div>{extension[0]}</div>
          })
        }
      </div>

      <PushButton theme='primary' label='Update Extensions' onClick={this.fetchExtensions}>
        fetch extensions
      </PushButton>

      <PushButton theme='primary' label='Update Extensions' onClick={this.checkForUpdates}>
        check for update
      </PushButton>

      <div id="messages"></div>
    </div>
  }
}

module.exports = ExtensionStoreList
