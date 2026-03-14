# Icarus Agent Integration Guide

## Overview

This document provides a comprehensive guide for integrating the Icarus Agent into the web application. The Icarus Agent is a powerful AI assistant that can be used to automate tasks and provide intelligent insights. The integration is achieved through a Weilliptic Applet, which is a smart contract that runs on the WeilChain.

## Prerequisites

Before you begin, ensure you have the following tools and technologies installed:

*   [Rust](https://www.rust-lang.org/tools/install)
*   [Node.js](https://nodejs.org/en/download/)
*   [WADK CLI](https://docs.weilliptic.ai/docs/how-tos/cli)

## Building the Applet

To build the Icarus Agent applet, navigate to the `wadk_unzipped/wadk-main/applets/rust/icarus_agent` directory and run the following command:

```bash
cargo build --target wasm32-unknown-unknown --release
```

This will compile the applet to a WASM module and place it in the `target/wasm32-unknown-unknown/release` directory.

## Deploying the Applet

To deploy the applet, you will need to use the `deploy.sh` script. This script will deploy the applet to the `asia-south` pod.

Before you run the script, you will need to replace `<asia-south-pod-id>` with the actual ID of your `asia-south` pod.

```bash
./deploy.sh
```

## Upgrading the Applet

To upgrade the applet, you will need to use the `upgrade.sh` script. This script will upgrade the existing applet with a new version of the WASM file.

Before you run the script, you will need to replace `<contract_address>` with the address of your deployed Icarus Agent applet.

```bash
./upgrade.sh
```

## Configuring the Frontend

To configure the frontend to communicate with the applet, you will need to modify the `src/components/BountiesTerminal.tsx` file. You will need to replace the following placeholder values with your actual values:

*   `<your-pod-id>`: The ID of your `asia-south` pod.
*   `<your-api-key>`: Your Weilliptic API key.
*   `<your-wallet-seed>`: Your wallet seed.
*   `<your-contract-address>`: The address of your deployed Icarus Agent applet.

## Troubleshooting

*   **`cargo` command not found**: This error occurs when the Rust development environment is not configured correctly. Ensure that the `~/.cargo/bin` directory is in your system's PATH.
*   **Failed to deploy applet**: This error can occur for a variety of reasons. Check the output of the `wadk` CLI for more information.
