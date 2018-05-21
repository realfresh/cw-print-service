import React from 'react';
import classNames from 'classnames';

export default (props) => {
  const checkboxClass = props.small ? 'sm-checkbox-ctrl' : 'checkbox-ctrl';
  const title = props.small ? <small className="m-l-1">{props.title}</small> : props.title;
  const labelClass = classNames('checkbox-label', !props.title ? 'p-0 m-0' : null);
  return (
    <div className={classNames("checkbox-ctrl-div", props.class)}>
      { !props.label_only && <input id={props.id} type="checkbox" className={checkboxClass} name={props.name} onChange={props.onChange} checked={props.checked} required={props.required}/> }
      <label htmlFor={props.id} className={labelClass}>{title}</label>
    </div>
  );
}