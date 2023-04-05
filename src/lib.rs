mod utils;

use argon2::Argon2;
use opaque_ke::ciphersuite::CipherSuite;
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::{
    ClientLogin, ClientLoginFinishParameters, ClientLoginStartResult, ClientRegistration,
    ClientRegistrationFinishParameters, ClientRegistrationStartResult, CredentialFinalization,
    CredentialRequest, CredentialResponse, RegistrationRequest, RegistrationResponse,
    RegistrationUpload, ServerLogin, ServerLoginStartParameters, ServerLoginStartResult,
    ServerRegistration, ServerSetup,
};

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[allow(dead_code)]
struct DefaultCipherSuite;

impl CipherSuite for DefaultCipherSuite {
    type OprfCs = opaque_ke::Ristretto255;
    type KeGroup = opaque_ke::Ristretto255;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;

    type Ksf = Argon2<'static>;
}

macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// fn account_login(
//     server_setup: &ServerSetup<DefaultCipherSuite>,
//     username: &String,
//     password: &String,
//     password_file_bytes: &[u8],
// ) -> bool {
//     let mut client_rng = OsRng;
//     let client_login_start_result =
//         ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes()).unwrap();
//     let credential_request_bytes = client_login_start_result.message.serialize();

//     // Client sends credential_request_bytes to server

//     let password_file =
//         ServerRegistration::<DefaultCipherSuite>::deserialize(password_file_bytes).unwrap();
//     let mut server_rng = OsRng;
//     let server_login_start_result = ServerLogin::start(
//         &mut server_rng,
//         server_setup,
//         Some(password_file),
//         CredentialRequest::deserialize(&credential_request_bytes).unwrap(),
//         username.as_bytes(),
//         ServerLoginStartParameters::default(),
//     )
//     .unwrap();
//     let credential_response_bytes = server_login_start_result.message.serialize();

//     // Server sends credential_response_bytes to client

//     let result = client_login_start_result.state.finish(
//         password.as_bytes(),
//         CredentialResponse::deserialize(&credential_response_bytes).unwrap(),
//         ClientLoginFinishParameters::default(),
//     );

//     if result.is_err() {
//         // Client-detected login failure
//         return false;
//     }
//     let client_login_finish_result = result.unwrap();
//     let credential_finalization_bytes = client_login_finish_result.message.serialize();

//     // Client sends credential_finalization_bytes to server

//     let server_login_finish_result = server_login_start_result
//         .state
//         .finish(CredentialFinalization::deserialize(&credential_finalization_bytes).unwrap())
//         .unwrap();

//     client_login_finish_result.session_key == server_login_finish_result.session_key
// }

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn serverLoginStart(
    username: String,
    password_file_bytes: Vec<u8>,
    credential_request_bytes: Vec<u8>,
) -> ServerLoginStart {
    let mut rng: OsRng = OsRng;
    let server_setup = ServerSetup::<DefaultCipherSuite>::new(&mut rng);
    let password_file =
        ServerRegistration::<DefaultCipherSuite>::deserialize(&password_file_bytes).unwrap();

    let server_login_start_result = ServerLogin::start(
        &mut rng,
        &server_setup,
        Some(password_file),
        CredentialRequest::deserialize(&credential_request_bytes).unwrap(),
        username.as_bytes(),
        ServerLoginStartParameters::default(),
    )
    .unwrap();

    ServerLoginStart {
        start_result: server_login_start_result,
    }
}

#[wasm_bindgen]
pub struct ServerLoginStart {
    start_result: ServerLoginStartResult<DefaultCipherSuite>,
}

#[wasm_bindgen]
impl ServerLoginStart {
    #[allow(non_snake_case)]
    pub fn getCredentialResponseBytes(&self) -> Vec<u8> {
        return self.start_result.message.serialize().to_vec();
    }

    pub fn finish(&self, credential_finalization_bytes: Vec<u8>) -> Vec<u8> {
        let server_login_finish_result = self
            .start_result
            .clone()
            .state
            .finish(CredentialFinalization::deserialize(&credential_finalization_bytes).unwrap())
            .unwrap();
        return server_login_finish_result.session_key.to_vec();
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn clientLoginStart(password: String) -> ClientLoginStart {
    let mut client_rng = OsRng;
    let client_login_start_result =
        ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes()).unwrap();

    return ClientLoginStart {
        start_result: client_login_start_result,
    };
}

#[wasm_bindgen]
pub struct ClientLoginStart {
    start_result: ClientLoginStartResult<DefaultCipherSuite>,
}

#[wasm_bindgen]
impl ClientLoginStart {
    #[allow(non_snake_case)]
    pub fn getMessageBytes(&self) -> Vec<u8> {
        return self.start_result.message.serialize().to_vec();
    }

    pub fn finish(&self, password: String, credential_response_bytes: Vec<u8>) -> Option<Vec<u8>> {
        let result = self.start_result.clone().state.finish(
            password.as_bytes(),
            CredentialResponse::deserialize(&credential_response_bytes).unwrap(),
            ClientLoginFinishParameters::default(),
        );

        if result.is_err() {
            // Client-detected login failure
            return None;
        }
        let client_login_finish_result = result.unwrap();
        return Some(client_login_finish_result.message.serialize().to_vec());
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn serverRegisterStart(username: String, registration_request_bytes: Vec<u8>) -> Vec<u8> {
    let mut rng: OsRng = OsRng;
    let server_setup = ServerSetup::<DefaultCipherSuite>::new(&mut rng);
    let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
        &server_setup,
        RegistrationRequest::deserialize(&registration_request_bytes).unwrap(),
        username.as_bytes(),
    )
    .unwrap();
    let registration_response_bytes = server_registration_start_result.message.serialize();
    return registration_response_bytes.to_vec();
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn serverRegisterFinish(message_bytes: Vec<u8>) -> Vec<u8> {
    let password_file = ServerRegistration::finish(
        RegistrationUpload::<DefaultCipherSuite>::deserialize(&message_bytes).unwrap(),
    );
    password_file.serialize().to_vec()
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn clientRegisterStart(password: String) -> ClientRegisterStart {
    let mut client_rng = OsRng;

    let client_registration_start_result =
        ClientRegistration::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .unwrap();

    return ClientRegisterStart {
        start_result: client_registration_start_result,
    };
}

#[wasm_bindgen]
pub struct ClientRegisterStart {
    start_result: ClientRegistrationStartResult<DefaultCipherSuite>,
}

#[wasm_bindgen]
impl ClientRegisterStart {
    #[allow(non_snake_case)]
    pub fn getRegistrationRequestBytes(&self) -> Vec<u8> {
        let registration_request_bytes = self.start_result.message.serialize();
        return registration_request_bytes.to_vec();
    }

    pub fn finish(&self, password: String, registration_response_bytes: Vec<u8>) -> Vec<u8> {
        let mut rng: OsRng = OsRng;
        let client_finish_registration_result = self
            .start_result
            .clone()
            .state
            .finish(
                &mut rng,
                password.as_bytes(),
                RegistrationResponse::deserialize(&registration_response_bytes).unwrap(),
                ClientRegistrationFinishParameters::default(),
            )
            .unwrap();
        let message_bytes = client_finish_registration_result.message.serialize();
        return message_bytes.to_vec();
    }
}
