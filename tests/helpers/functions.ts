import request from "supertest";
import { expect } from "@jest/globals";
import { Express } from "express";
import { validate } from "uuid";

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
      date: date ?? "2022-12-11T17:05:21.396Z",
      image64: image64 ?? photoImage64,
    });
}

async function addNPhotos(app: Express, n: number) {
  for (let i = 0; i < n; i++) {
    await addPhoto(app, "/path/to/image" + i.toString() + ".jpg");
  }
}

function testPhotoMetaAndId(
  photo: any,
  path: string,
  name?: string,
  fileSize?: string,
  width?: number,
  height?: number,
  date?: string,
  id?: string
) {
  const validID = validate(photo.id);
  expect(validID).toBe(true);

  if (id) {
    expect(photo.id).toBe(id);
  }

  expect(photo.meta.clientPath).toBe(path);
  expect(photo.meta.name).toBe(name ?? "image122.jpg");
  expect(photo.meta.fileSize).toBe(fileSize ?? 1000);
  expect(photo.meta.width).toBe(width ?? 1500);
  expect(photo.meta.height).toBe(height ?? 1000);
  expect(photo.meta.date).toBe(date ?? "2022-12-11T17:05:21.396Z");

  // Less than 10 seconds since photo added
  const sync = new Date(photo.meta.syncDate);
  expect(Date.now() - sync.getTime()).toBeLessThan(10000);
}

function testPhotoOriginal(
  photo: any,
  path: string,
  name?: string,
  fileSize?: string,
  width?: number,
  height?: number,
  date?: string,
  image64?: string,
  id?: string
) {
  testPhotoMetaAndId(photo, path, name, fileSize, width, height, date, id);

  expect(photo.image64).toBe(image64 ?? photoImage64);
}

function testPhotoCompressed(
  photo: any,
  path: string,
  name?: string,
  fileSize?: string,
  width?: number,
  height?: number,
  date?: string,
  image64?: string,
  id?: string
) {
  testPhotoMetaAndId(photo, path, name, fileSize, width, height, date, id);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoThumbnail(
  photo: any,
  path: string,
  name?: string,
  fileSize?: string,
  width?: number,
  height?: number,
  date?: string,
  image64?: string,
  id?: string
) {
  testPhotoMetaAndId(photo, path, name, fileSize, width, height, date, id);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoData(
  photo: any,
  path: string,
  name?: string,
  fileSize?: string,
  width?: number,
  height?: number,
  date?: string,
  id?: string
) {
  testPhotoMetaAndId(photo, path, name, fileSize, width, height, date, id);

  expect(photo.image64).toBe("");
}

export {
  addPhoto,
  addNPhotos,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
};
