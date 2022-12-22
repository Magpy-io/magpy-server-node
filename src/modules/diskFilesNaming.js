// IMPORTS

function splitImageName(fullName) {
  const nameSplited = fullName.split(".");
  const format = nameSplited.pop();
  const name = nameSplited.join();
  return { name: name, format: format };
}

function createServerImageName(photo) {
  const { name, format } = splitImageName(photo.name);
  const date = photo.syncDate;
  const serverFileName = `Ants_${name}_${date}.${format}`;
  return serverFileName;
}

function createServerImageCroppedName(fullImagePath) {
  const { name, format } = splitImageName(fullImagePath);
  return name + "_cropped" + "." + format;
}

module.exports = {
  createServerImageName,
  createServerImageCroppedName,
};
