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
sudo npm install
yarn install
```

### Install dependecy for the `mdns` package.

```
sudo apt-get install libavahi-compat-libdnssd-dev
```

More information on the package main page.

## Configuration

Configure the path of your photos. Edit these lines in the file Config/config.js

```
const rootPath = "PATH";
```

## Running the server

```
yarn start
```

## Clearing all images from server

```
yarn clean
```

## Testing the server

```
yarn test
```

## mDNS Debugging

To check if mdns discovery is running correctly, use the following command :

```
avahi-browse -r -t _http._tcp
```
