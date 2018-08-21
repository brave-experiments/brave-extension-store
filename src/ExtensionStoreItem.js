/* global chrome */

'use strict'

const React = require('react')
const { Column, PushButton, TextLabel } = require('brave-ui')

class ExtensionStoreItem extends React.Component {
  constructor (props) {
    super()
    this.state = {
      extensions: []
    }

    this.install = this.install.bind(this)
  }

  uninstall () {
    console.log('uninstall for ' + this.props.name + ' clicked')
    if (!chrome.app.isInstalled) {
      console.log('Already Uninstalled!')
    } else {
      console.log(this.props.name + 'is uninstalled.')
    }
  }

  install () {
    console.log('install for ' + this.props.name + ' clicked')
    chrome.webstore.install(
      'https://extension-store-testing.herokuapp.com/webstore/detail/' + this.props.id,
      function () {
        console.log('Installed.')
      }, function (errorText) {
        console.log('ERROR!\n' + errorText)
      }
    )
  }

  render () {
    const theme = {
      extensionBox: {
        backgroundColor: '#fff',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '15px'
      },
      extensionContent: {
        width: '-webkit-fill-available',
        boxShadow: '1px 2px 2px 0px rgba(0,0,0,0.2)',
        fontFamily: 'Helvetica Neue',
        borderRadius: '2px',
        minWidth: '33%'
      },
      extensionTitle: {
        fontSize: '18px',
        color: 'black',
        padding: '0 0 5px'
      },
      extensionVersion: {
        fontSize: '10px',
        color: '#a0a0a0'
      },
      extensionMain: {
        padding: '14px',
        textTransform: 'uppercase'
      },
      extensionFooter: {
        textAlign: 'right',
        padding: '15px'
      }
    }

    return (
      <Column theme={theme.extensionBox} size={4}>
        <section style={theme.extensionContent}>
          <header style={theme.extensionMain}>
            <TextLabel theme={theme.extensionTitle} text={this.props.name} />
            <TextLabel theme={theme.extensionVersion} text={`version: ${this.props.version}`} />
          </header>
          <footer style={theme.extensionFooter}>
            <PushButton color='secondary' onClick={this.uninstall}>Uninstall</PushButton>
            <PushButton color='primary' onClick={this.install}>Install</PushButton>
          </footer>
        </section>
      </Column>
    )
  }
}

module.exports = ExtensionStoreItem
