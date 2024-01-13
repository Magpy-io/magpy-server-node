import { Express } from "express";
import { SetPath } from "@src/api/export/exportedTypes/PathManager";
import { setApp } from "./axios";

export async function setupAxiosMock(p: Express) {
  SetPath("testPath");
  setApp(p);
}
