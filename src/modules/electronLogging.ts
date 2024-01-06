import log from "electron-log";

export function setupElectronLogging() {
  log.transports.file.level = "debug";
  console.log = log.debug;
  console.error = (message: string) => {
    log.info("#Error Log: " + message);
  };
}
