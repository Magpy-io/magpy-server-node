import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";
import { setApp } from "./axios";

export async function setupAxiosMock(p: Express) {
  exportedTypes.SetPath("testPath");
  setApp(p);
}
