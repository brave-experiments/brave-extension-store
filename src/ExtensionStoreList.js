'use strict'

const React = require('react')
const { TitleHeading, PushButton } = require('brave-ui')
const ExtensionStoreItem = require('./ExtensionStoreItem')
const spinnerImage = require('./i/ajax-loader.gif')

class ExtensionStoreList extends React.Component {
  constructor (props) {
    super()
    this.state = {
      loading: false,
      extensions: []
    }
    this.fetchExtensions = this.fetchExtensions.bind(this)
  }

  componentDidMount () {
    this.fetchExtensions()
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

          self.setState({extensions, loading: false})
        } else {
          console.log('Request returned ' + xmlhttp.status)
          self.setState({loading: false})
        }
      }
    }

    this.setState({loading: true})
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
          self.setState({loading: false})
        } else {
          console.log('Request returned ' + xmlhttp.status)
          self.setState({loading: false})
        }
      }
    }

    this.setState({loading: true})
    xmlhttp.open('GET', '/brave-extension-store-update', true)
    xmlhttp.send()
  }

  render () {
    const rootStyle = {
      backgroundColor: '#f1f1f1',
      width: '1200px',
      marginTop: '10px',
      display: 'inline-block',
      textAlign: 'left',
      borderLeft: '1px solid black',
      borderRight: '1px solid black',
      padding: '5px'
    }
    const bottomStyle = {
      marginTop: '10px'
    }

    return <div style={rootStyle}>
      <TitleHeading
        text='Brave Extension Store'
        label='beta'
        />

      <div id="extensions">
      {
        this.state.loading
          ? <div><img src={spinnerImage} /> Loading...</div>
          : this.state.extensions.map((extension) => {
              return <ExtensionStoreItem
                id={extension[0]}
                version={extension[1]}
                sha={extension[2]}
                name={extension[3]}
                />
            })
      }
      </div>

      <div style={bottomStyle}>
        <PushButton theme='primary' label='Update Extensions' onClick={this.fetchExtensions}>
          Refresh
        </PushButton>

        <PushButton theme='primary' label='Update Extensions' onClick={this.checkForUpdates}>
          Check for updates
        </PushButton>

        <div id="messages"></div>
      </div>
    </div>
  }
}

module.exports = ExtensionStoreList
