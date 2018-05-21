import React from 'react';
import { Collapse } from 'react-collapse';

export default class FormGroup extends React.Component {

  constructor(props) {
    super(props);
    this.state = { error: null };
    this.last_value = props.value;
  }

  calculateStateFromProps(props) {
    const test = props.test;
    const value = props.value;
    if (!value) {
      this.setState({ error: null })
    }
    else if (this.last_value !== props.value) {
      if (test(value)) {
        this.setState({ error: null })
      }
      else {
        this.setState({ error: props.error_text || "Invalid value" })
      }
    }
    this.last_value = value;
  }

  componentWillReceiveProps(props) {
    this.calculateStateFromProps(props)
  }

  render() {
    return (
      <Collapse isOpened={!!this.state.error}>
        <p className="error-text p-t-3"><i className="fa fa-exclamation-triangle m-r-2"/> {this.state.error} </p>
      </Collapse>
    );
  }
}
