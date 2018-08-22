/* global XMLHttpRequest */

'use strict'

const React = require('react')
// const { Grid, Column, TitleHeading, ButtonPrimary } = require('brave-ui')
// const ExtensionStoreItem = require('./ExtensionStoreItem')
// const spinnerImage = require('./i/ajax-loader.gif')

class extensionDetail extends React.Component {
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

  render () {
    return <div>not done yet</div>
    // const detailTheme = {
    //   extensionsWrapper: {
    //     flexDirection: 'column',
    //     justifyContent: 'center'
    //   },
    //   extensions: {
    //     maxWidth: '1200px',
    //     justifyContent: 'center',
    //     gridGap: '15px'
    //   },
    //   extensionBox: {
    //     backgroundColor: '#fff',
    //     maxWidth: '1000px',
    //     flexDirection: 'column',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     padding: '15px'
    //   },
    //   extensionContent: {
    //     width: '-webkit-fill-available',
    //     boxShadow: '1px 2px 2px 0px rgba(0,0,0,0.2)',
    //     fontFamily: 'Helvetica Neue',
    //     borderRadius: '5px',
    //     minWidth: '33%'
    //   },
    //   extensionTitle: {
    //     fontSize: '18px',
    //     color: 'black',
    //     padding: '0 0 5px'
    //   },
    //   extensionVersion: {
    //     fontSize: '12px',
    //     color: '#a0a0a0'
    //   },
    //   extensionMain: {
    //     padding: '14px',
    //     textTransform: 'uppercase'
    //   },
    //   extensionFooter: {
    //     textAlign: 'right',
    //     padding: '15px'
    //   }
    // }

    // return <Grid theme={theme.detailTheme}>
    //   <Column>
    //     <TitleHeading
    //       text={extension[3]}
    //     />
    //   </Column>
    //   <Column theme={theme.extensionsWrapper}>
    //     <Grid theme={theme.extensionBox}>
    //       {
    //         this.state.loading
    //           ? <div><img src={spinnerImage} /> Loading...</div>
    //           : this.state.extensions.map((extension) => {
    //             return <ExtensionStoreItem
    //               id={extension[0]}
    //               version={extension[1]}
    //               description={extension[2]}
    //               name={extension[3]}
    //             />
    //           })
    //       }
    //     </Grid>
    //   </Column>
    //   <Column>
    //     <footer>
    //       <ButtonPrimary color='brand' size='medium' onClick={this.fetchExtensions}>
    //     Close
    //       </ButtonPrimary>

    //       <div id='messages' />
    //     </footer>
    //   </Column>
    // </Grid>
  }
}

module.exports = extensionDetail
