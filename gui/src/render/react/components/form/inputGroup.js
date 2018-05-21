import React from 'react';

export default class InputGroup extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="input-group flex-line-no-wrap">
        { this.props.base64 && <div className="input-group-icon" style={this.props.style || {}}><img src={this.props.base64}/></div> }
        { this.props.icon && <div className="input-group-icon" style={this.props.style || {}}><i className={`fa ${this.props.icon}`}/></div> }
        { this.props.iconHtml && <div className="input-group-icon" style={this.props.style || {}}>{this.props.iconHtml}</div> }
        {this.props.children}
      </div>
    );
  }
}
