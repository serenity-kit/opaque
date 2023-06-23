# @serenity-kit/opaque HTTP Spec

Client and server need to agree on a common base path below which opaque http endpoints are mounted.
This can be the root `/` or any other subdirectory i.e. `/api/auth/opaque`.

The opaque endpoints mounted below this path are:

- `/register/start`
- `/register/finish`
- `/login/start`
- `/login/finish`

All requests MUST use the `application/json` Content-Type and MUST use the `POST` HTTP verb.
In case of an error the server MUST respond with a JSON object containing an `error` key with a value of type `string`.

## register/start

### Request Body

- `userIdentifier` a non-empty string that should uniquely identify the user (application-defined, can be user id, email, username etc.)
- `registrationRequest` the registration request obtained from opaque (a non-empty string)

TDB ERROR RESPONSE IN CASE OF INVALID REQUEST BODY

Upon successful validation of the request body a registration response MUST be obtained by calling opaque.serverRegistrationStart with the provided data.

### Response Body

- `registrationResponse` the registration response from opaque (a non-empty string)

## register/finish

### Request Body

- `registrationUpload` the registration upload obtained from opaque (non-empty string)
- `userData` application-defined user data, can be of any type but is recommended to be an object and SHOULD contain at least the user identifier

### Response Body

- `payload` arbitrary application-defined data

## login/start

### Request Body

- `userIdentifier` a non-empty string that should uniquely identify the user (application-defined, can be user id, email, username etc.)
- `credentialRequest` the credential request obtained from opaque.clientLoginStart (a non-empty string)

### Response Body

- `credentialResponse` the credential response obtained from opaque.serverLoginStart

## login/finish

TBD
