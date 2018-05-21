import React from 'react';
import { connect } from 'react-redux';
import { ReduxCtrl } from '../../index';
import ProModal from '../components/ProModal';
import FormGroup from '../components/form/formGroup';
const shell = require('electron').shell;

class GhostscriptInstructions extends React.Component {

  constructor(props) {
    super(props);
  }

  openLink() {
    shell.openExternal("https://www.ghostscript.com/download/gsdnld.html");
  }

  render() {
    const { active } = this.props;
    return (
      <ProModal
        contentClass="item-modal-content m-tb-8 white-bg bs-2 round"
        innerClass="p-4"
        active={active}
        onClickOut={() => ReduxCtrl.app_update({ modal: null })}>
        <div className="p-4">

          <FormGroup>
            <p className="font-bold">Ghostscript Installation Instructions</p>
          </FormGroup>

          <FormGroup>
            <p>
              Ghostscript is a free program that is used to print files.
              Visit the <a onClick={this.openLink}>download page</a> and download the correct "GNU Affero General Public License" version for your PC.
              After installing it, select the file <span className="font-semi-bold">gswin32c.exe</span> or <span className="font-semi-bold">gswin64c.exe</span> from bin folder where you installed the program
            </p>
          </FormGroup>

        </div>
      </ProModal>
    );
  }

}

export default connect(state => ({
  active: state.app.modal == 'ghostscript'
}))(GhostscriptInstructions)