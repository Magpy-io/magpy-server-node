import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  addNPhotos,
  addPhoto,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
  getPhotoFromDb,
  deletePhotoFromDisk,
  testWarning,
  defaultPhoto,
  expectToBeOk,
  getDataFromRet,
  addPhotoWithMultiplePaths,
  testPhotoMetaAndIdWithAdditionalPaths,
  defaultPhotoSecondPath,
} from "@tests/helpers/functions";
import { PhotoTypes } from "@src/api/export/exportedTypes";

describe("Test 'getPhotosByPath' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n photos all existing after adding $n photos and requesting $n photo paths",
    async (testData: { n: number }) => {
      const addedPhotosData = await addNPhotos(testData.n);

      const photosAdded = await Promise.all(
        addedPhotosData.map((photoData) => {
          return getPhotoFromDb(photoData.id);
        })
      );
      const photosData = photosAdded.map((photo) => {
        return {
          path: photo.clientPaths[0].path,
          size: photo.fileSize,
          date: photo.date.toJSON(),
        };
      });

      const ret = await exportedTypes.GetPhotosByPathPost({
        photosData: photosData,
        photoType: "data",
        deviceUniqueId: defaultPhoto.deviceUniqueId,
      });

      console.log("ret:", JSON.stringify(ret));

      expectToBeOk(ret);
      expect(ret.warning).toBe(false);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(testData.n);
      expect(data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(data.photos[i].path).toBe(photosData[i].path);
        expect(data.photos[i].exists).toBe(true);
      }
    }
  );

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n photos all not existing after adding no photos and requesting $n photo paths",
    async (testData: { n: number }) => {
      const photosData = Array(testData.n)
        .fill("")
        .map((_, i) => {
          return { path: "path" + i.toString(), size: 0, date: "" };
        });

      const ret = await exportedTypes.GetPhotosByPathPost({
        photosData: photosData,
        photoType: "data",
        deviceUniqueId: defaultPhoto.deviceUniqueId,
      });

      console.log(ret);
      expectToBeOk(ret);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(testData.n);
      expect(data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(data.photos[i].path).toBe(photosData[i].path);
        expect(data.photos[i].exists).toBe(false);
      }
    }
  );

  it("Should return 2 photos, the first exists and the second does not, after adding 1 photo and requesting 2", async () => {
    const photoAddedData = await addPhoto();

    const dbPhoto = await getPhotoFromDb(photoAddedData.id);

    const photosData = [
      {
        path: photoAddedData.path,
        size: dbPhoto.fileSize,
        date: dbPhoto.date.toJSON(),
      },
      { path: "path2", size: 0, date: "" },
    ];

    const ret = await exportedTypes.GetPhotosByPathPost({
      photosData: photosData,
      photoType: "data",
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToBeOk(ret);
    const data = getDataFromRet(ret);

    expect(data.number).toBe(2);
    expect(data.photos.length).toBe(2);

    expect(data.photos[0].path).toBe(photosData[0].path);
    expect(data.photos[0].exists).toBe(true);

    expect(data.photos[1].path).toBe(photosData[1].path);
    expect(data.photos[1].exists).toBe(false);
  });

  const testDataArrayPhotoTypeTestFunction: Array<{
    photoType: PhotoTypes;
    testFunction: (...args: any[]) => any;
  }> = [
    { photoType: "original", testFunction: testPhotoOriginal },
    { photoType: "compressed", testFunction: testPhotoCompressed },
    { photoType: "thumbnail", testFunction: testPhotoThumbnail },
    { photoType: "data", testFunction: testPhotoData },
  ];

  it.each(testDataArrayPhotoTypeTestFunction)(
    "Should return the image added in the quality $photoType",
    async (testData) => {
      const photoAddedData = await addPhoto();

      const dbPhoto = await getPhotoFromDb(photoAddedData.id);

      const photosData = [
        {
          path: photoAddedData.path,
          size: dbPhoto.fileSize,
          date: dbPhoto.date.toJSON(),
        },
      ];

      const ret = await exportedTypes.GetPhotosByPathPost({
        photosData: photosData,
        photoType: testData.photoType,
        deviceUniqueId: defaultPhoto.deviceUniqueId,
      });

      expectToBeOk(ret);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(1);
      expect(data.photos.length).toBe(1);

      expect(data.photos[0].path).toBe(photoAddedData.path);
      expect(data.photos[0].exists).toBe(true);

      if (!data.photos[0].exists) {
        throw new Error();
      }

      testData.testFunction(data.photos[0].photo, {
        path: photoAddedData.path,
        id: photoAddedData.id,
      });
    }
  );

  const testDataArrayPhotoType: Array<{ photoType: PhotoTypes }> = [
    { photoType: "thumbnail" },
    { photoType: "compressed" },
    { photoType: "original" },
  ];

  it.each(testDataArrayPhotoType)(
    "Should return photo does not exist if a photo exists on db but its $photoType is not on disk",
    async (testData: { photoType: PhotoTypes }) => {
      const addedPhotoData = await addPhoto();

      const photo = await getPhotoFromDb(addedPhotoData.id);

      await deletePhotoFromDisk(photo, testData.photoType);

      const photosData = [
        {
          path: addedPhotoData.path,
          size: photo.fileSize,
          date: photo.date.toJSON(),
        },
      ];

      const ret = await exportedTypes.GetPhotosByPathPost({
        photosData: photosData,
        photoType: "data",
        deviceUniqueId: defaultPhoto.deviceUniqueId,
      });

      expectToBeOk(ret);
      expect(ret.warning).toBe(true);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(1);
      expect(data.photos.length).toBe(1);

      expect(data.photos[0].path).toBe(addedPhotoData.path);
      expect(data.photos[0].exists).toBe(false);

      testWarning(photo);
    }
  );

  it("Should return a photo with multiple paths when requested photo has multiple paths", async () => {
    const addedPhotoData = await addPhotoWithMultiplePaths();

    const photo = await getPhotoFromDb(addedPhotoData.id);

    const photosData = [
      {
        path: addedPhotoData.path,
        size: photo.fileSize,
        date: photo.date.toJSON(),
      },
    ];

    const ret = await exportedTypes.GetPhotosByPathPost({
      photosData: photosData,
      photoType: "data",
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data.photos[0].exists).toBe(true);
    expect(data.photos[0].path).toBe(photosData[0].path);

    if (!data.photos[0].exists) {
      throw new Error();
    }

    testPhotoMetaAndIdWithAdditionalPaths(data.photos[0].photo, [
      defaultPhotoSecondPath,
    ]);
  });
});
