'use strict';

const React = require('react')
const { PushButton } = require('brave-ui')

class ExtensionStoreList extends React.Component {
  constructor (props) {
    super()
    this.state = {
      extensions: []
    }
  }

  render () {
    return <div>
      <div>{this.props.id}</div>
      <PushButton>Install me</PushButton>
    </div>
  }
}

module.exports = ExtensionStoreList
