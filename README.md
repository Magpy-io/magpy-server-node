# OpenCloud-server

## Installation

### Install node

```
Sudo apt install nodejs
```

### Install net-tools (to use ifconfig)

```
Sudo apt install net-tools
```

### Install yarn and run yarn install

```
sudo npm install --global yarn
yarn install
```

### Install dependecy for the `mdns` package.

```
sudo apt-get install libavahi-compat-libdnssd-dev
```

More information on the package main page.

## Configuration

Configure the path of your photos and your IP address. Edit these lines in the file Config/config.js

```
const rootPath = "PATH";
const host = "IP_ADDRESS";
```

Get your IP address using the command `ifconfig`

## Running the server

```
yarn start
```

## Clearing all images from server

```
yarn clean
```
