import React from 'react';
import autobind from 'class-autobind';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { ReduxCtrl } from '../../index';
import classNames from 'classnames';
import FormGroup from '../components/form/formGroup';
import InputGroup from '../components/form/inputGroup';
import Services from '../../services';
const { dialog } = require('electron').remote;
import GN from 'g-notifications';

class Settings extends React.Component {

  constructor(props) {
    super(props);
    autobind(this);
  }

  printer_add() {
    const printers = [ ...this.props.printers ];
    printers.push("");
    ReduxCtrl.config_update({ printers });
  }
  printer_remove() {
    const printers = [ ...this.props.printers ];
    printers.splice((printers.length - 1), 1);
    ReduxCtrl.config_update({ printers });
  }
  async printers_sync() {
    await ReduxCtrl.app_printers_sync();
    GN.add({
      type: "success",
      message: `Printers refreshed`,
      duration: 2500,
    });
  }

  ghostscript_dialog(e) {
    e.preventDefault();
    console.log("SHOW DIALOG");
    dialog.showOpenDialog({
        filters: [{ name: "Executable", extensions: "exe" }],
        properties: ['openFile']},
      (filePaths) => {
        if (!filePaths)
          return null;
        const path = filePaths[0];
        if (path.indexOf("gswin32c.exe") == -1 && path.indexOf("gswin64c.exe") == -1) {
          GN.add({
            type: "error",
            message: "Select either gswin32c.exe or gswin64c.exe",
            duration: 4000,
          });
        }
        else {
          console.log(path);
          ReduxCtrl.config_update({ ghostscript_path: path })
        }
      })
  }

  render() {

    const {
      api_key,
      printers,
      ghostscript_path,
      system_printers,
      service_status,
    } = this.props;

    const disableFields = service_status == "started";

    return (
      <div className="p-4">
        <form onSubmit={ e => e.preventDefault() }>

          <FormGroup title="API Key">
            <InputGroup>
              <input
                disabled={disableFields}
                value={api_key || ""}
                name="api_key"
                className="input-ctrl"
                onChange={ e => {
                  ReduxCtrl.config_update({ api_key: e.target.value })
                }}/>
            </InputGroup>
          </FormGroup>

          <FormGroup
            title="Ghostscript Path"
            help={(
              <span>
                Ghostscript is a free program that is used to print files.
                Follow these <a onClick={() => ReduxCtrl.app_update({modal:"ghostscript"})}>instructions</a> to download it.
              </span>
            )}>
            <InputGroup>
              <input
                disabled={disableFields}
                value={ghostscript_path || ""}
                readOnly={true}
                placeholder={"Select the gswin32c.exe or gswin64c.exe file"}
                name="ghostscript_path"
                className="input-ctrl cursor"
                onClick={this.ghostscript_dialog}
              />
            </InputGroup>
          </FormGroup>

          { printers.map(( printer, i ) => (
            <FormGroup
              key={i}
              title={`Printer${i > 0 ? ` - ${i + 1}` : ""}`}>
              <InputGroup>
                <select
                  disabled={disableFields}
                  value={printer || ""}
                  className="input-ctrl"
                  onChange={(e) => {
                    const newPrinters = [ ...printers ];
                    newPrinters[i] = e.target.value;
                    ReduxCtrl.config_update({ printers: newPrinters });
                  }}>
                  <option value="">Select your printer</option>
                  { system_printers.map((printer, index) => (
                    <option key={index} value={printer.name}>{printer.name}</option>
                  ))}
                </select>
              </InputGroup>
            </FormGroup>
          ))}

          <FormGroup hide={disableFields}>
            <a onClick={this.printers_sync} className="button button-sm primary-inverse font-semi-bold round-sm m-r-2">Refresh Printers</a>
            <a onClick={this.printer_add} className="button button-sm primary-inverse font-semi-bold round-sm m-r-2">Add Printer</a>
            { printers.length > 1 && <a onClick={this.printer_remove} className="button button-sm primary-inverse font-semi-bold round-sm">Remove Printer</a> }
          </FormGroup>

        </form>
      </div>
    );

  }

}

export default connect(state => ({
  api_key: state.config.api_key,
  printers: state.config.printers,
  ghostscript_path: state.config.ghostscript_path,
  system_printers: state.app.system_printers,
  service_status: state.app.service_status,
}))(Settings)