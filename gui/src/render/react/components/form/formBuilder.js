import React from 'react';
import classNames from 'classnames'

/*
  text = { _id, type: text }
  select = { _id, type: select, values=[{_id, display}]

*/

class InputContainer extends React.Component {
  render() {
    return (
      <div className="form-group">
        <label>{this.props.title}</label>
        <div className="content">
          {this.props.children}
          { this.props.help && <span className="input-help">{this.props.help}</span> }
        </div>
      </div>
    );
  }
}
class InputContainerIcon extends React.Component {
  render() {
    return (
      <div className="form-group">
        <label>{this.props.title}</label>
        <div className="content">
          <div className="input-group flex-line-no-wrap">
            <div className="input-group-icon"><i className={this.props.icon}/></div>
            {this.props.children}
          </div>
          { this.props.help && <span className="input-help">{this.props.help}</span> }
        </div>
      </div>
    );
  }
}

export default class FormBuilder extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    props.fields.forEach((f,i) => {
      this.state[f._id] = f.prefill || ''
    });
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    nextProps.fields.forEach((f,i) => {
      let val = f.prefill || this.state[f._id];
      if (val) {
        let update = {};
        update[f._id] = val;
        this.setState(update);
      }
    });
  }

  handleChange(e, fn) {
    let change = {};
    change[e.target.name] = e.target.value;
    this.setState(change);
    if (fn) fn(e);
  }

  render() {
    let formFields = this.props.fields.map( (f, i) => {
      let input;
      if (f.type == 'text') {
        input = <input type="text" name={f._id} value={this.state[f._id]} onChange={this.handleChange} required={f.required} className="input-ctrl"/>
      }
      if (f.type == 'number') {
        input = <input type="number" name={f._id} value={this.state[f._id]} onChange={this.handleChange} required={f.required} className="input-ctrl"/>
      }
      if (f.type == 'select') {
        input = (
            <select name={f._id} className="input-ctrl" style={{width:'100%'}} value={this.state[f._id]} onChange={(e) => this.handleChange(e, f.onChange)}>
              { f.nullValue && <option value="">{f.nullValue}</option> }
              { f.values.map( (v,k) => <option key={`${v._id}${k}`} value={v._id}>{v.display}</option>)}
            </select>
        );
      }
      if (f.type == 'button') {
        input = <a className="button button-sm primary-bg light-text round-sm" onClick={f.onClick || null}>{f.buttonText}</a>
      }
      if (f.icon) {
        return (
          <InputContainerIcon
            key={f._id}
            title={f.display}
            icon={f.icon}
            help={f.help}>
            {input}
          </InputContainerIcon>
        )
      }
      else {
        return (
          <InputContainer
            key={f._id}
            title={f.display}
            help={f.help}>
            {input}
          </InputContainer>
        )
      }
    });
    return (
      <form>
        {formFields}
        { this.props.submit && <button type="submit" className="button full-width primary-bg light-text text-center round-sm"><i className={this.props.submitIcon}/>{this.props.submit}</button> }
      </form>
    );
  }
}
