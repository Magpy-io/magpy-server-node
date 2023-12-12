import request from "supertest";
import { expect } from "@jest/globals";
import { Express } from "express";
import { validate } from "uuid";

import { photoImage64 } from "@tests/helpers/imageBase64";

async function addPhoto(
  app: Express,
  data?: {
    path?: string;
    name?: string;
    fileSize?: string;
    width?: number;
    height?: number;
    date?: string;
    image64?: string;
  }
) {
  const ret = await request(app)
    .post("/addPhoto")
    .send({
      name: data?.name ?? "image122.jpg",
      fileSize: data?.fileSize ?? 1000,
      width: data?.width ?? 1500,
      height: data?.height ?? 1000,
      path: data?.path ?? "/path/to/image.jpg",
      date: data?.date ?? "2022-12-11T17:05:21.396Z",
      image64: data?.image64 ?? photoImage64,
    });

  if (!ret.body.ok) {
    throw "Error adding photo";
  }

  return {
    id: ret.body.data.photo.id,
    path: data?.path ?? "/path/to/image.jpg",
  };
}

async function addNPhotos(app: Express, n: number) {
  const ids: { id: string; path: string }[] = [];
  for (let i = 0; i < n; i++) {
    const photoAddedData = await addPhoto(app, {
      path: "/path/to/image" + i.toString() + ".jpg",
    });
    ids.push(photoAddedData);
  }
  return ids;
}

function testPhotoMetaAndId(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: string;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  }
) {
  const validID = validate(photo.id);
  expect(validID).toBe(true);

  if (data?.id) {
    expect(photo.id).toBe(data.id);
  }

  expect(photo.meta.clientPath).toBe(data?.path ?? "/path/to/image.jpg");
  expect(photo.meta.name).toBe(data?.name ?? "image122.jpg");
  expect(photo.meta.fileSize).toBe(data?.fileSize ?? 1000);
  expect(photo.meta.width).toBe(data?.width ?? 1500);
  expect(photo.meta.height).toBe(data?.height ?? 1000);
  expect(photo.meta.date).toBe(data?.date ?? "2022-12-11T17:05:21.396Z");

  // Less than 10 seconds since photo added
  const sync = new Date(photo.meta.syncDate);
  expect(Date.now() - sync.getTime()).toBeLessThan(10000);
}

function testPhotoOriginal(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: string;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  },
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe(image64 ?? photoImage64);
}

function testPhotoCompressed(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: string;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  },
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoThumbnail(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: string;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  },
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoData(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: string;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  }
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe("");
}

async function checkPhotoExists(app: Express, id: string) {
  const ret = await request(app)
    .post("/getPhotosById")
    .send({
      ids: [id],
      photoType: "data",
    });

  if (!ret.body.ok) {
    throw "Error checking photo exists";
  }

  return ret.body.data.photos[0].exists;
}

async function getPhotoById(app: Express, id: string, photoType?: string) {
  const ret = await request(app)
    .post("/getPhotosById")
    .send({ ids: [id], photoType: photoType ?? "data" });

  if (!ret.body.ok) {
    throw "Error checking photo exists";
  }

  if (!ret.body.data.photos[0].exists) {
    return false;
  }

  return ret.body.data.photos[0].photo;
}

export {
  addPhoto,
  addNPhotos,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
  checkPhotoExists,
  getPhotoById,
};
