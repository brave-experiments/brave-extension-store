'use strict'

const React = require('react')
const { Grid, Column, TitleHeading, PushButton } = require('brave-ui')
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

    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === XMLHttpRequest.DONE) {
        if (xmlhttp.status === 200) {
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
    var xmlhttp = new XMLHttpRequest()
    const self = this

    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === XMLHttpRequest.DONE) {
        if (xmlhttp.status === 200) {
          document.getElementById('messages').innerHTML = xmlhttp.response
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
    const theme = {
      pageGrid: {
        backgroundColor: '#FBF5F3',
        justifyContent: 'center',
        gridGap: '15px',
        padding: '15px'
      },
      extensionsWrapper: {
        flexDirection: 'column',
        justifyContent: 'center'
      },
      extensions: {
        maxWidth: '1200px',
        justifyContent: 'center',
        gridGap: '15px'
      }
    }

    return <Grid theme={theme.pageGrid}>
      <Column>
      <TitleHeading
    text='Brave Extension Store'
    label='beta'
      />
      </Column>
      <Column theme={theme.extensionsWrapper}>
      <Grid theme={theme.extensions}>
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
    </Grid>
      </Column>
      <Column>
      <footer>
      <PushButton color='secondary' onClick={this.fetchExtensions}>
      Refresh
    </PushButton>

      <PushButton color='primary' onClick={this.checkForUpdates}>
      Check for updates
    </PushButton>

      <div id='messages' />
      </footer>
      </Column>
      </Grid>
  }
}


module.exports = ExtensionStoreList
