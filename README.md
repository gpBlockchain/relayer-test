# Relayer-Test

This repository contains a project for testing the relayer and verifier services using Docker Compose. It includes instructions for setting up the services, running integration tests, and maintaining the service images.

## Setup

To get started, make sure you have Docker Compose installed on your machine. You can download it from the official website: https://docs.docker.com/compose/install/

Once you have Docker Compose installed, follow these steps:

1. Clone this repository to your local machine.
2. Change into the cloned directory.
3. Run `npm i` to install the dependencies from `package.json`.
4. Navigate to the `build` directory.
5. Run the `prepare.sh` script to update the service images.
6. Return to the root directory of the repository.
7. Run `npm run setUp` to prepare the environment.
8. Run `npm run test` to execute the integration tests.

## Services

The two services included in this project are the `relayer` and `verifier`.

### relayer

The `relayer` service is responsible for synchronizing blocks and transactions from the Beacon Chain to the CKB blockchain. This service is implemented using Rust.

### verifier

The `verifier` service is responsible for verifying the correctness of transactions synchronized by the `relayer` service on the CKB blockchain. Specifically, it verifies the light client (i.e., the new cell) created by the `relayer` service on the CKB blockchain. This service is also implemented using Rust.

## Maintenance

Service image maintenance is handled through the `docker` directory. This directory contains the necessary files to build the service images used by Docker Compose.

To update the service images, navigate to the `build` directory and run the `prepare.sh` script. This script will create new service images based on the contents of the `docker` directory.

## Conclusion

This project provides a way to test the integration between the `relayer` and `verifier` services. By following the setup instructions, you should be able to run the integration tests and verify the functionality of the services.
