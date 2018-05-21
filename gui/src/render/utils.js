import ipc from './ipc';

export const unhandledPromiseReject = () => {
  window.addEventListener("unhandledrejection", function(err, promise) {
    console.log("UNHANDLED PROMISE", err, promise);
  });
};
export const openDevToolsF12 = () => {
  document.addEventListener("keydown", function (e) {
    if (e.which === 123) {
      ipc.service_dev_tools();
    } else if (e.which === 116) {
      location.reload();
    }
  });
};

