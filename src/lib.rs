mod utils;

use argon2::Argon2;
use opaque_ke::ciphersuite::CipherSuite;
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::{
    ClientLogin, ClientLoginFinishParameters, ClientRegistration,
    ClientRegistrationFinishParameters, CredentialFinalization, CredentialRequest,
    CredentialResponse, RegistrationRequest, RegistrationResponse, RegistrationUpload, ServerLogin,
    ServerLoginStartParameters, ServerRegistration, ServerSetup,
};

use base64::{engine::general_purpose as b64, Engine as _};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// #[wasm_bindgen]
// extern "C" {
//     fn alert(s: &str);
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(s: &str);
// }

// macro_rules! console_log {
//     // Note that this is using the `log` function imported above during
//     // `bare_bones`
//     ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
// }

struct DefaultCipherSuite;

impl CipherSuite for DefaultCipherSuite {
    type OprfCs = opaque_ke::Ristretto255;
    type KeGroup = opaque_ke::Ristretto255;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;

    type Ksf = Argon2<'static>;
}

const BASE64: b64::GeneralPurpose = b64::URL_SAFE_NO_PAD;

#[wasm_bindgen]
pub struct Server {
    setup: ServerSetup<DefaultCipherSuite>,
}

#[wasm_bindgen]
impl Server {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Server {
        let mut rng: OsRng = OsRng;
        Server {
            setup: ServerSetup::<DefaultCipherSuite>::new(&mut rng),
        }
    }

    pub fn serialize(&self) -> String {
        return BASE64.encode(self.setup.serialize());
    }

    pub fn deserialize(encoded_bytes: String) -> Self {
        return Server {
            setup: ServerSetup::<DefaultCipherSuite>::deserialize(
                &BASE64.decode(encoded_bytes).unwrap(),
            )
            .unwrap(),
        };
    }

    #[allow(non_snake_case)]
    pub fn startLogin(
        &self,
        username: String,
        password_file: String,
        credential_request: String,
    ) -> ServerLoginStart {
        let password_file_bytes = BASE64.decode(password_file).unwrap();
        let credential_request_bytes = BASE64.decode(credential_request).unwrap();
        let mut rng: OsRng = OsRng;
        let password_file =
            ServerRegistration::<DefaultCipherSuite>::deserialize(&password_file_bytes).unwrap();

        let server_login_start_result = ServerLogin::start(
            &mut rng,
            &self.setup,
            Some(password_file),
            CredentialRequest::deserialize(&credential_request_bytes).unwrap(),
            username.as_bytes(),
            ServerLoginStartParameters::default(),
        )
        .unwrap();

        ServerLoginStart {
            state: server_login_start_result.state,
            credentialResponse: BASE64
                .encode(server_login_start_result.message.serialize().to_vec()),
        }
    }

    #[allow(non_snake_case)]
    pub fn startRegistration(&self, username: String, registration_request: String) -> String {
        let registration_request_bytes = BASE64.decode(registration_request).unwrap();
        let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
            &self.setup,
            RegistrationRequest::deserialize(&registration_request_bytes).unwrap(),
            username.as_bytes(),
        )
        .unwrap();
        let registration_response_bytes = server_registration_start_result.message.serialize();
        return BASE64.encode(registration_response_bytes.to_vec());
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub struct ServerLoginStart {
    state: ServerLogin<DefaultCipherSuite>,
    credentialResponse: String,
}

#[wasm_bindgen]
impl ServerLoginStart {
    #[allow(non_snake_case)]
    pub fn getCredentialResponse(&self) -> String {
        return self.credentialResponse.clone();
    }

    pub fn finish(&self, credential_finalization: String) -> String {
        let credential_finalization_bytes = BASE64.decode(credential_finalization).unwrap();
        let server_login_finish_result = self
            .state
            .clone()
            .finish(CredentialFinalization::deserialize(&credential_finalization_bytes).unwrap())
            .unwrap();
        return BASE64.encode(server_login_finish_result.session_key.to_vec());
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn clientLoginStart(password: String) -> ClientLoginStart {
    let mut client_rng = OsRng;
    let client_login_start_result =
        ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes()).unwrap();

    return ClientLoginStart {
        state: client_login_start_result.state,
        credentialRequest: BASE64.encode(client_login_start_result.message.serialize().to_vec()),
    };
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub struct ClientLoginStart {
    state: ClientLogin<DefaultCipherSuite>,
    credentialRequest: String,
}

#[wasm_bindgen]
impl ClientLoginStart {
    #[allow(non_snake_case)]
    pub fn getCredentialRequest(&self) -> String {
        return self.credentialRequest.clone();
    }

    pub fn finish(
        &self,
        password: String,
        credential_response: String,
    ) -> Option<ClientLoginResult> {
        let credential_response_bytes = BASE64.decode(credential_response).unwrap();
        let result = self.state.clone().finish(
            password.as_bytes(),
            CredentialResponse::deserialize(&credential_response_bytes).unwrap(),
            ClientLoginFinishParameters::default(),
        );

        if result.is_err() {
            // Client-detected login failure
            return None;
        }
        let client_login_finish_result = result.unwrap();
        let session_key = client_login_finish_result.session_key;
        return Some(ClientLoginResult {
            credentialFinalization: BASE64
                .encode(client_login_finish_result.message.serialize().to_vec()),
            sessionKey: BASE64.encode(session_key.to_vec()),
        });
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub struct ClientLoginResult {
    credentialFinalization: String,
    sessionKey: String,
}

#[wasm_bindgen]
#[allow(non_snake_case)]
impl ClientLoginResult {
    pub fn getCredentialFinalization(&self) -> String {
        return self.credentialFinalization.clone();
    }

    pub fn getSessionKey(&self) -> String {
        return self.sessionKey.clone();
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn serverRegisterFinish(message: String) -> String {
    let message_bytes = BASE64.decode(message).unwrap();
    let password_file = ServerRegistration::finish(
        RegistrationUpload::<DefaultCipherSuite>::deserialize(&message_bytes).unwrap(),
    );
    BASE64.encode(password_file.serialize().to_vec())
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn clientRegisterStart(password: String) -> ClientRegisterStart {
    let mut client_rng = OsRng;

    let client_registration_start_result =
        ClientRegistration::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .unwrap();

    return ClientRegisterStart {
        state: client_registration_start_result.state,
        registrationRequest: BASE64.encode(
            client_registration_start_result
                .message
                .serialize()
                .to_vec(),
        ),
    };
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub struct ClientRegisterStart {
    state: ClientRegistration<DefaultCipherSuite>,
    registrationRequest: String,
}

#[wasm_bindgen]
impl ClientRegisterStart {
    #[allow(non_snake_case)]
    pub fn getRegistrationRequest(&self) -> String {
        return self.registrationRequest.clone();
    }

    pub fn finish(&self, password: String, registration_response: String) -> String {
        let registration_response_bytes = BASE64.decode(registration_response).unwrap();
        let mut rng: OsRng = OsRng;
        let client_finish_registration_result = self
            .state
            .clone()
            .finish(
                &mut rng,
                password.as_bytes(),
                RegistrationResponse::deserialize(&registration_response_bytes).unwrap(),
                ClientRegistrationFinishParameters::default(),
            )
            .unwrap();
        let message_bytes = client_finish_registration_result.message.serialize();
        return BASE64.encode(message_bytes.to_vec());
    }
}
