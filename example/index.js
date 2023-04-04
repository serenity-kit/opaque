import * as opaque from "opaque";
window.opaque = opaque;
// opaque.greet();

const clientStart = opaque.clientRegisterStart("password");
console.log(clientStart);

// client side
// let client = new opaque.ClientRegistration();
// const registrationMessage = client.start("password");

// let response = await fetch("/register/start", {
//   body: JSON.stringify({ registrationMessage }),
// });

// let registationResult = client.finish("password", response);

// let response2 = await fetch("/register/finish", {
//   body: JSON.stringify({ registrationResult }),
// });

// // server side
// let server = new opaque.ServerRegistration({ privateKey: "..." });
// function handlePost(payload) {
//   server.start({
//     userName: payload.userName,
//     message: payload.message,
//   });
// }
