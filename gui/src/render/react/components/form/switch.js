import React from 'react';
import classNames from 'classnames';



export default ({ id, name, value, onChange=(() => {}), className, onClick }) => (
  <div className={classNames("switch", className)} onClick={ e => e.stopPropagation() }>
    <input className="cmn-toggle cmn-toggle-round-flat" type="checkbox" id={id}  name={name} checked={value} onChange={onChange} onClick={ onClick || (e => e.stopPropagation()) }/>
    <label htmlFor={id}/>
  </div>
)