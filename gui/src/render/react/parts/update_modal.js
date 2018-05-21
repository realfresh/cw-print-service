import React from 'react';
import { connect } from 'react-redux';
import { ReduxCtrl } from '../../index';
import ProModal from '../components/ProModal';
import FormGroup from '../components/form/formGroup';
const shell = require('electron').shell;

class UpdateInstructions extends React.Component {

  constructor(props) {
    super(props);
  }

  openLink() {
    shell.openExternal("https://us-central1-pushprinter.cloudfunctions.net/latest-download-link-by-platform?platform=win32");
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
            <h3>Update Available</h3>
          </FormGroup>

          <FormGroup>
            <p>
              Download the latest version of PushPrinter from <a onClick={this.openLink}>here</a>
            </p>
          </FormGroup>

        </div>
      </ProModal>
    );
  }

}

export default connect(state => ({
  active: state.app.modal == 'update-available'
}))(UpdateInstructions)