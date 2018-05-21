import autobind from 'class-autobind';
import React from 'react';
import { connect } from 'react-redux';
import { ReduxCtrl } from '../index';
import TabButton from './components/tabs/TabButton';
import TabContent from './components/tabs/TabContent';
import Settings from './parts/settings';
import Loading from './parts/loading';
import GhostscriptModal from './parts/ghostscript_modal';
import UpdateModal from './parts/update_modal';
import ControlButton from './parts/control_button';
import ipc from '../ipc';
import GN from 'g-notifications';
import Raven from 'raven-js';
import axios from 'axios';
const compareVersions = require('compare-versions');

class App extends React.Component {

  constructor(props) {
    super(props);
    autobind(this);
    this.state = {
      activeKey: "1"
    }
  }

  componentDidMount() {
    this.sync();
    this.app_version_check();
    this.service_updates();
    this.service_updates_status();
    this.service_updates_print_job();
  }

  async sync() {
    try {
      await ReduxCtrl.config_sync();
      await ReduxCtrl.app_printers_sync();
    }
    catch(e) {
      console.log(e);
      GN.add({
        type: "error",
        message: `Failed to load config and/or printers`,
        duration: 5000,
      });
      Raven.captureException(e);
    }
  }
  service_updates() {
    const eventName = "service:updates";
    ipc.on(eventName, data => {
      console.log(eventName, data);
      if (data == "started" || data == "stopped") {
        ReduxCtrl.app_update({ service_status: data });
      }
      else if (data == "auth-error") {
        GN.add({
          type: "error",
          duration: 7000,
          message: "Error authenticating, check your internet or try again soon",
        });
      }
      else if (data == "token-error") {
        GN.add({
          type: "error",
          duration: 3000,
          message: "Invalid API Key",
        });
      }
    });
  }
  service_updates_status() {
    const eventName = "service:updates:status";
    ipc.on(eventName, data => {
      console.log(eventName, data);
      ReduxCtrl.app_update({ connection_status: data });
    });
  }
  service_updates_print_job() {
    ipc.on("service:updates:print-job", ({ event, data }) => {
      console.log("service:updates:print-job", event, data);
    });
  }

  async app_version_check() {
    try {
      const ipcRes = await ipc.service_get_version();
      const currentVersion = ipcRes.data;
      ReduxCtrl.app_update({ version: currentVersion });
      const serverRes = await axios.post("https://us-central1-pushprinter.cloudfunctions.net/auto-update-version-check", { version: currentVersion });
      const availableVersion = serverRes.data.latestVersion;
      const shouldUpdate = compareVersions(availableVersion, currentVersion) == 1;
      if (shouldUpdate) {
        ReduxCtrl.app_update({ modal: 'update-available' })
      }
    }
    catch(e) {
      console.log(e);
      Raven.captureException(e);
    }
  }

  setTab(activeKey) {
    this.setState({activeKey})
  }
  tabs() {
    const tabProps = {
      col: 3,
      activeKey: this.state.activeKey,
      setTab: this.setTab,
    };
    return (
      <div className="flex-grid-simple">
        <TabButton tabKey={1} value={"Settings"} {...tabProps}/>
        <TabButton tabKey={2} value={"Test Print"} {...tabProps}/>
        <TabButton tabKey={3} value={"Logs"} {...tabProps}/>
      </div>
    )
  }
  content() {
    const { activeKey } = this.state;
    return (
      <div>
        <TabContent tabKey={1} activeKey={activeKey}>
          <Settings/>
        </TabContent>
      </div>
    )
  }

  header() {
    const icon = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDI5MCAyOTAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI5MCAyOTA7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4Ij4KPGc+Cgk8cGF0aCBpZD0icmVjdDE1MjMzIiBkPSJNNTUsMEM0MS4yMzYsMCwzMCwxMS4yMzcsMzAsMjV2NzVoLTVjLTEzLjc2NCwwLTI1LDExLjIzNi0yNSwyNXY5MGMwLDEzLjc2NCwxMS4yMzYsMjUsMjUsMjVoMTEuMDk2ICAgbC01Ljk0NywyMy43ODdDMzAuMDUsMjY0LjE4NCwzMCwyNjQuNTkxLDMwLDI2NWMwLDEzLjc2NCwxMS4yMzYsMjUsMjUsMjVoMTgwYzYuOTMyLDAsMTMuNjI4LTIuNzM2LDE4LjU1OS03LjI5OSAgIHM4LjEyOS0xMS41NjksNi4yOTMtMTguOTE0TDI1My45MDQsMjQwSDI2NWMxMy43NjQsMCwyNS0xMS4yMzYsMjUtMjV2LTkwYzAtMTMuNzY0LTExLjIzNi0yNS0yNS0yNWgtNVY3NSAgIGMwLTEuMjYyLTAuNDc3LTIuNDc3LTEuMzM2LTMuNDAybC02NS03MEMxOTIuNzE4LDAuNTc5LDE5MS4zOSwwLDE5MCwwSDU1eiBNNTUsMTBoMTI1djY1YzAsMi43NjEsMi4yMzksNSw1LDVoNjV2MjBINDBWMjUgICBDNDAsMTYuNjA0LDQ2LjYwNCwxMCw1NSwxMHogTTE5MCwxMi4zNDhMMjQzLjUzNSw3MEgxOTBWMTIuMzQ4eiBNNTAsMTcuNWMtMS4zODEsMC0yLjUsMS4xMTktMi41LDIuNXY1NSAgIGMtMC4wMiwxLjM4MSwxLjA4NCwyLjUxNiwyLjQ2NSwyLjUzNWMxLjM4MSwwLjAyLDIuNTE2LTEuMDg0LDIuNTM1LTIuNDY1YzAtMC4wMjQsMC0wLjA0NywwLTAuMDcxVjIyLjVIODUgICBjMS4zODEsMC4wMiwyLjUxNi0xLjA4NCwyLjUzNS0yLjQ2NWMwLjAyLTEuMzgxLTEuMDg0LTIuNTE2LTIuNDY1LTIuNTM1Yy0wLjAyNCwwLTAuMDQ3LDAtMC4wNzEsMEg1MHogTTI1LDExMGgyNDAgICBjOC4zOTYsMCwxNSw2LjYwNCwxNSwxNXY5MGMwLDguMzk2LTYuNjA0LDE1LTE1LDE1aC0xMy41OTZsLTExLjU1My00Ni4yMTNDMjM5LjI5NSwxODEuNTYxLDIzNy4yOTUsMTgwLDIzNSwxODBINTUgICBjLTIuMjk1LDAtNC4yOTUsMS41NjEtNC44NTIsMy43ODdMMzguNTk2LDIzMEgyNWMtOC4zOTYsMC0xNS02LjYwNC0xNS0xNXYtOTBDMTAsMTE2LjYwNCwxNi42MDQsMTEwLDI1LDExMHogTTQ1LDE0MCAgIGMtMi43NjEtMC4wMzktNS4wMzIsMi4xNjgtNS4wNzEsNC45MjljLTAuMDM5LDIuNzYxLDIuMTY4LDUuMDMyLDQuOTI5LDUuMDcxYzAuMDQ3LDAuMDAxLDAuMDk0LDAuMDAxLDAuMTQxLDBoMTUwICAgYzIuNzYxLDAuMDM5LDUuMDMyLTIuMTY4LDUuMDcxLTQuOTI5YzAuMDM5LTIuNzYxLTIuMTY4LTUuMDMyLTQuOTI5LTUuMDcxYy0wLjA0Ny0wLjAwMS0wLjA5NC0wLjAwMS0wLjE0MSwwSDQ1eiBNMjE1LDE0MCAgIGMtMi43NjEsMC01LDIuMjM5LTUsNXMyLjIzOSw1LDUsNXM1LTIuMjM5LDUtNVMyMTcuNzYxLDE0MCwyMTUsMTQweiBNMjMwLDE0MGMtMi43NjEsMC01LDIuMjM5LTUsNXMyLjIzOSw1LDUsNXM1LTIuMjM5LDUtNSAgIFMyMzIuNzYxLDE0MCwyMzAsMTQweiBNMjQ1LDE0MGMtMi43NjEsMC01LDIuMjM5LTUsNXMyLjIzOSw1LDUsNXM1LTIuMjM5LDUtNVMyNDcuNzYxLDE0MCwyNDUsMTQweiBNNTguOTA0LDE5MGgxNzIuMTkxICAgbDE5LjA1Myw3Ni4yMTNjMC44NTEsMy40MDQtMC40MDksNi4zOTgtMy4zODEsOS4xNDhTMjM5LjE0OCwyODAsMjM1LDI4MEg1NWMtOC4yNDQsMC0xNC43MjMtNi4zNzgtMTQuOTU3LTE0LjU1N0w1OC45MDQsMTkweiAgICBNMTA1LDIxMi41Yy0xLjM4MS0wLjAyLTIuNTE2LDEuMDg0LTIuNTM1LDIuNDY1Yy0wLjAyLDEuMzgxLDEuMDg0LDIuNTE2LDIuNDY1LDIuNTM1YzAuMDI0LDAsMC4wNDcsMCwwLjA3MSwwaDgwICAgYzEuMzgxLDAuMDIsMi41MTYtMS4wODQsMi41MzUtMi40NjVjMC4wMi0xLjM4MS0xLjA4NC0yLjUxNi0yLjQ2NS0yLjUzNWMtMC4wMjQsMC0wLjA0NywwLTAuMDcxLDBIMTA1eiBNODUsMjM3LjUgICBjLTEuMzgxLTAuMDItMi41MTYsMS4wODQtMi41MzUsMi40NjVjLTAuMDIsMS4zODEsMS4wODQsMi41MTYsMi40NjUsMi41MzVjMC4wMjQsMCwwLjA0NywwLDAuMDcxLDBoMTIwICAgYzEuMzgxLDAuMDIsMi41MTYtMS4wODQsMi41MzUtMi40NjVjMC4wMi0xLjM4MS0xLjA4NC0yLjUxNi0yLjQ2NS0yLjUzNWMtMC4wMjQsMC0wLjA0NywwLTAuMDcxLDBIODV6IE03NSwyNjIuNSAgIGMtMS4zODEtMC4wMi0yLjUxNiwxLjA4NC0yLjUzNSwyLjQ2NWMtMC4wMiwxLjM4MSwxLjA4NCwyLjUxNiwyLjQ2NSwyLjUzNWMwLjAyNCwwLDAuMDQ3LDAsMC4wNzEsMGgxNDAgICBjMS4zODEsMC4wMiwyLjUxNi0xLjA4NCwyLjUzNS0yLjQ2NXMtMS4wODQtMi41MTYtMi40NjUtMi41MzVjLTAuMDI0LDAtMC4wNDcsMC0wLjA3MSwwSDc1eiIgZmlsbD0iI0ZGRkZGRiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=";
    return (
      <div className="primary-bg light-text p-3 flex-line centered content-centered">
        <img className="m-r-3" src={icon}/>
        <h1 className="">PushPrinter</h1>
        { this.props.version && <small className="m-l-3 small">v{this.props.version}</small> }
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.header()}
        <Settings/>
        <ControlButton/>
        <GhostscriptModal/>
        <UpdateModal/>
        <Loading/>
      </div>
    )
  }


}

export default connect(state => ({
  version: state.app.version,
}))(App)