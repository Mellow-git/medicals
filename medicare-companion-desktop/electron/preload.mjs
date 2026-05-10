import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("medicareDesktop", {
  platform: process.platform,
});
