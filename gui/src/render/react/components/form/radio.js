import React from 'react';
import shortid from 'shortid';

export default class Radio extends React.Component {

  constructor(props) {
    super(props);
    this.id = this.props.id || shortid.generate()
  }

  render() {
    let classN = this.props.small ? 'sm-radio-ctrl' : 'radio-ctrl';
    let title = this.props.small ? <small className="m-l-1">{this.props.title}</small> : this.props.title;
    return (
      <div className={`radio-ctrl-div ${this.props.class}`}>
        <input
          id={this.id}
          type="radio"
          className={classN}
          name={this.props.name}
          onChange={this.props.onChange}
          checked={this.props.checked}
          value={this.props.value}
          required={this.props.required}/>
        <label htmlFor={this.id} className="checkbox-label">{title}</label>
      </div>
    );
  }
}
