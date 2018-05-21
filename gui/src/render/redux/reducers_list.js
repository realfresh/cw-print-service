export default {
  app: {
    initial_state: {
      service_status: "stopped", // started, stopped
      connection_status: "closed", // connected, connecting, disconnected,
      system_printers: [],
      modal: null,
    }
  },
  config: {
    initial_state: {
      api_key: "",
      ghostscript_path: "",
      printers: [""],
    }
  },
  loader: {
    initial_state: {
      on: false,
      msg: "Loading",
      opacity: 0.75,
    }
  }
};
