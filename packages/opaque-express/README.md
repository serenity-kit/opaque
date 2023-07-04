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

Upon successful validation of the request body a registrationResponse message MUST be obtained by calling `opaque.server.createRegistrationResponse` with the provided data.

### Response Body

- `registrationResponse` the registrationResponse message from opaque (a non-empty string)

## register/finish

### Request Body

- `registrationRecord` the registrationRecord obtained from `opaque.client.finishRegistration` (non-empty string)
- `userData` application-defined user data, can be of any type but is recommended to be an object and SHOULD contain at least the user identifier

### Response Body

- `userData` arbitrary application-defined data

## login/start

### Request Body

- `userIdentifier` a non-empty string that should uniquely identify the user (application-defined, can be user id, email, username etc.)
- `startLoginRequest` the startLoginRequest message obtained from opaque.client.startLogin (a non-empty string)

### Response Body

- `loginResponse` the loginResponse message obtained from opaque.server.startLogin (non-empty string)

## login/finish

### Request Body

- `userIdentifier` a non-empty string that should uniquely identify the user (application-defined, can be user id, email, username etc.)
- finishLoginRequest
- customData

### Response Body

The response body is always `{"ok": true}` if the login was successful, otherwise an error response is sent.
