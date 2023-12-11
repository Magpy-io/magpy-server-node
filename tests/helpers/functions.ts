import request from "supertest";
import { Express } from "express";

import { photoImage64 } from "@tests/helpers/imageBase64";

async function addPhoto(
  app: Express,
  path: string,
  name?: string,
  fileSize?: string,
  width?: number,
  height?: number,
  date?: string,
  image64?: string
) {
  await request(app)
    .post("/addPhoto")
    .send({
      name: name ?? "image122.jpg",
      fileSize: fileSize ?? 1000,
      width: width ?? 1500,
      height: height ?? 1000,
      path: path,
      date: date ?? new Date(Date.now()).toISOString(),
      image64: image64 ?? photoImage64,
    });
}

export { addPhoto };
