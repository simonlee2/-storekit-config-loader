# storekit-config-loader

`storekit-config-loader` is a Node.js CLI tool to generate StoreKit Configuration files through the AppStore Connect API. 

When syncing through Xcode doesn't work, this will.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)
- [License](#license)

## Installation

You can install `storekit-config-loader` globally using npm:

```sh
npm install -g storekit-config-loader
```

You can also install using yarn:

```sh
yarn global add storekit-config-loader
```

## Usage

To generate a StoreKit configuration file, use the `generate` command with the required options:

```sh
skconfig generate [options]
```

## Options

The following options are required to generate the StoreKit configuration:

- `--output`, `-o`: Output path for the configuration file
- `--app-id`, `-a`: App ID to generate the StoreKit configuration
- `--issuer-id`, `-i`: Issuer ID to generate the StoreKit configuration
- `--api-key`, `-k`: API Key to generate the StoreKit configuration
- `--private-key`, `-p`: Private Key to generate the StoreKit configuration

### Output

The output file path where the StoreKit configuration file will be saved. This option is required.

```sh
--output=./path/to/output/Config.storekit
```

### App ID

The App ID of the app for which you want to generate the StoreKit configuration. This option is required.

```sh
--app-id=YOUR_APP_ID
```

### Issuer ID

The Issuer ID required to access the AppStore Connect API. This option is required.

```sh
--issuer-id=YOUR_ISSUER_ID
```

### API Key

The API Key required to access the AppStore Connect API. This option is required.

```sh
--api-key=YOUR_API_KEY
```

### Private Key

The Private Key required to access the AppStore Connect API. This option is required.

```sh
--private-key=YOUR_PRIVATE_KEY
```

## Examples

Here's an example of how to use `storekit-config-loader`:

```sh
skconfig generate \
  --output=Config.storekit \
  --app-id=1234567890 \
  --issuer-id=1234567890 \
  --api-key=ABCDEFGHIJKLMN \
  --private-key="-----BEGIN PRIVATE KEY-----\nMIIEv...Pjw/\n-----END PRIVATE KEY-----"
```

## License

`storekit-config-loader` is released under the [MIT License](LICENSE).
