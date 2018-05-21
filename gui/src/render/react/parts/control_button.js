import autobind from 'class-autobind';
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { ReduxCtrl } from '../../index';
import ipc from '../../ipc';
import GN from 'g-notifications';

class ControlButton extends React.Component {

  constructor(props) {
    super(props);
    autobind(this);
  }

  start_stop() {
    const { service_status, api_key, ghostscript_path } = this.props;
    if (service_status == "stopped") {
      if (!api_key) {
        GN.add({
          type: "error",
          duration: 3500,
          message: "API key required"
        })
      }
      else if (!ghostscript_path) {
        GN.add({
          type: "error",
          duration: 5000,
          message: "Ghostscript program path required"
        })
      }
      else {
        ipc.service_start();
      }
    }
    else {
      ipc.service_stop();
    }
  }

  render() {

    const {
      service_status,
      connection_status
    } = this.props;

    const style = {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0
    };

    const service_status_class = classNames('button button-big full-width primary');

    const connection_status_class = classNames({
      "warning-bg": (connection_status == "initialized" || connection_status == "connecting"),
      "success-bg": connection_status == "connected",
      "error-bg": (
        connection_status == "disconnected" ||
        connection_status == "suspended" ||
        connection_status == "closing" ||
        connection_status == "closed" ||
        connection_status == "failed"
      ),
    });

    const CONNECTION_STATUSES = {
      initialized: "Initialized",
      connected: "Connected",
      connecting: "Connecting",
      disconnected: "Disconnected",
      suspended: "Suspended",
      closing: "Closing",
      closed: "Closed",
      failed: "Failed",
    };

    const connection_status_display = CONNECTION_STATUSES[connection_status];

    return (
      <div style={style} className="bs-3 white-bg shade2">
        <div className={service_status_class} onClick={this.start_stop}>
          { service_status == "stopped" ? "Start Service" : "Stop Service" }
        </div>
        <div className={classNames("p-lr-2 text-center")}>
          <p className="small p-tb-1">
            <span className={classNames("indicator", connection_status_class)}/>
            <span className="m-l-2">Connection: {connection_status_display}</span>
          </p>
        </div>
      </div>
    )
  }

}

export default connect(state => ({
  service_status: state.app.service_status,
  connection_status: state.app.connection_status,
  api_key: state.config.api_key,
  ghostscript_path: state.config.ghostscript_path,
}))(ControlButton)