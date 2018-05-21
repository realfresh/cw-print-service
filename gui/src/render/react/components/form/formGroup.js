import React from 'react';
import classNames from 'classnames';

export default class FormGroup extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.hide)
      return null;
    return (
      <div className={classNames("form-group", this.props.class)}>
        { this.props.title && <label>{this.props.title}</label> }
        <div className="content" style={this.props.contentStyle || {}}>
          {this.props.children}
          { this.props.help && <span className="input-help">{this.props.help}</span> }
        </div>
      </div>
    );
  }
}
