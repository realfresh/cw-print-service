import React from 'react';
import FormGroup from './formGroup';
import InputGroup from './inputGroup';
import Switch from './switch';

export default ({ fields, values, handleChange }) => {
  return Object.keys(fields).map( key => {
    const field = fields[key];
    return (
      <FormGroup key={key} title={field.name} help={field.help || null}>
        <InputGroup icon={field.icon || null}>
          { field.type == 'switch' &&
            <Switch id={`${key}-switch`} name={key} value={values[key] || false} onChange={handleChange}/>
          }
          { !field.type &&
            <input type="text" name={key} value={values[key] || ""} className="input-ctrl" onChange={handleChange} placeholder={field.placeholder || ""} required={field.required || false}/>
          }
          { field.type == 'select' &&
            <select name={key} value={values[key] || ""} className="input-ctrl" onChange={handleChange} required={field.required || false}>
              <option value="">{fields.placeholder || ""}</option>
              { field.options.map((o, i) => {
                return <option key={i} value={o.value}>{o.name}</option>
              })}
            </select>
          }
        </InputGroup>
      </FormGroup>
    )
  })
}