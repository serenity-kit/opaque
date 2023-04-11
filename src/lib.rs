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
use serde::{Deserialize, Serialize};
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

#[wasm_bindgen(js_name = serverSetup)]
pub fn server_setup() -> String {
    let mut rng: OsRng = OsRng;
    let setup = ServerSetup::<DefaultCipherSuite>::new(&mut rng);
    return BASE64.encode(setup.serialize().to_vec());
}

fn decode_server_setup(data: String) -> Result<ServerSetup<DefaultCipherSuite>, JsError> {
    return BASE64
        .decode(data)
        .map_err(|_| JsError::new("failed to base64 decode server setup state"))
        .and_then(|bytes| {
            ServerSetup::<DefaultCipherSuite>::deserialize(&bytes)
                .map_err(|_| JsError::new("failed to deserialize server setup state"))
        });
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
struct ServerRegistrationStartProps {
    server: String,
    username: String,
    registrationRequest: String,
}

#[wasm_bindgen(js_name = serverRegistrationStart)]
pub fn server_registration_start(props: JsValue) -> Result<JsValue, JsError> {
    let input: ServerRegistrationStartProps = serde_wasm_bindgen::from_value(props)?;

    let server_setup = decode_server_setup(input.server)?;

    let registration_request_bytes = BASE64.decode(input.registrationRequest)?;
    let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
        &server_setup,
        RegistrationRequest::deserialize(&registration_request_bytes)
            .map_err(|_| JsError::new("failed to deserialize registrationRequest"))?,
        input.username.as_bytes(),
    )
    .map_err(|_| JsError::new("failed to start server registration"))?;
    let registration_response_bytes = server_registration_start_result.message.serialize();
    return Ok(BASE64.encode(registration_response_bytes.to_vec()).into());
}

#[wasm_bindgen(js_name = serverRegistrationFinish)]
pub fn server_registration_finish(message: String) -> Result<JsValue, JsError> {
    let message_bytes = BASE64.decode(message)?;
    let password_file = ServerRegistration::finish(
        RegistrationUpload::<DefaultCipherSuite>::deserialize(&message_bytes)
            .map_err(|_| JsError::new("failed to deserialize message"))?,
    );
    Ok(BASE64.encode(password_file.serialize().to_vec()).into())
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
struct ServerLoginStartProps {
    server: String,
    username: String,
    passwordFile: String,
    credentialRequest: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
struct ServerLoginStartResult {
    state: String,
    credentialResponse: String,
}

#[wasm_bindgen(js_name = serverLoginStart)]
pub fn server_login_start(props: JsValue) -> Result<JsValue, JsError> {
    let input: ServerLoginStartProps = serde_wasm_bindgen::from_value(props)?;

    let server_setup = decode_server_setup(input.server)?;

    let password_file_bytes = BASE64.decode(input.passwordFile)?;
    let credential_request_bytes = BASE64.decode(input.credentialRequest)?;

    let mut rng: OsRng = OsRng;
    let password_file = ServerRegistration::<DefaultCipherSuite>::deserialize(&password_file_bytes)
        .map_err(|_| JsError::new("failed to deserialize passwordFile"))?;

    let server_login_start_result = ServerLogin::start(
        &mut rng,
        &server_setup,
        Some(password_file),
        CredentialRequest::deserialize(&credential_request_bytes)
            .map_err(|_| JsError::new("failed to deserialize credentialRequest"))?,
        input.username.as_bytes(),
        ServerLoginStartParameters::default(),
    )
    .map_err(|_| JsError::new("failed to start login"))?;

    let credential_response = BASE64.encode(server_login_start_result.message.serialize().to_vec());
    let start_state = BASE64.encode(server_login_start_result.state.serialize().to_vec());

    let result = ServerLoginStartResult {
        state: start_state,
        credentialResponse: credential_response,
    };

    return serde_wasm_bindgen::to_value(&result)
        .map_err(|_| JsError::new("failed to construct return value"));
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
struct ServerLoginFinishProps {
    state: String,
    credentialFinalization: String,
}

#[wasm_bindgen(js_name = serverLoginFinish)]
pub fn server_login_finish(props: JsValue) -> Result<JsValue, JsError> {
    let input: ServerLoginFinishProps = serde_wasm_bindgen::from_value(props)?;
    let credential_finalization_bytes = BASE64.decode(input.credentialFinalization)?;
    let state_bytes = BASE64.decode(input.state)?;
    let state = ServerLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(|_| JsError::new("failed to deserialize server login state"))?;
    let server_login_finish_result = state
        .finish(
            CredentialFinalization::deserialize(&credential_finalization_bytes)
                .map_err(|_| JsError::new("failed to deserialize credentialFinalization"))?,
        )
        .map_err(|_| JsError::new("failed to finish server login"))?;
    return Ok(BASE64
        .encode(server_login_finish_result.session_key.to_vec())
        .into());
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct ClientLoginStart {
    state: String,
    credentialRequest: String,
}

#[wasm_bindgen(js_name = clientLoginStart)]
pub fn client_login_start(password: String) -> Result<JsValue, JsError> {
    let mut client_rng = OsRng;
    let client_login_start_result =
        ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .map_err(|_| JsError::new("failed to start client login"))?;

    let result = ClientLoginStart {
        state: BASE64.encode(client_login_start_result.state.serialize()),
        credentialRequest: BASE64.encode(client_login_start_result.message.serialize().to_vec()),
    };
    return serde_wasm_bindgen::to_value(&result)
        .map_err(|_| JsError::new("failed to construct return value"));
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct ClientLoginFinishProps {
    state: String,
    credentialResponse: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct ClientLoginFinishResult {
    credentialFinalization: String,
    sessionKey: String,
}

#[wasm_bindgen(js_name = clientLoginFinish)]
pub fn client_login_finish(props: JsValue) -> Result<JsValue, JsError> {
    let input: ClientLoginFinishProps = serde_wasm_bindgen::from_value(props)?;
    let credential_response_bytes = BASE64.decode(input.credentialResponse)?;

    let state_bytes = BASE64.decode(input.state)?;
    let state = ClientLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(|_| JsError::new("failed to deserialize client login state"))?;
    let result = state.finish(
        input.password.as_bytes(),
        CredentialResponse::deserialize(&credential_response_bytes)
            .map_err(|_| JsError::new("failed to deserialize credentialResponse"))?,
        ClientLoginFinishParameters::default(),
    );

    if result.is_err() {
        // Client-detected login failure
        return Ok(JsValue::NULL);
    }
    let client_login_finish_result = result.unwrap();
    let session_key = client_login_finish_result.session_key;
    return serde_wasm_bindgen::to_value(&ClientLoginFinishResult {
        credentialFinalization: BASE64
            .encode(client_login_finish_result.message.serialize().to_vec()),
        sessionKey: BASE64.encode(session_key.to_vec()),
    })
    .map_err(|_| JsError::new("failed to construct return value"));
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct ClientRegistrationStartResult {
    state: String,
    registrationRequest: String,
}

#[wasm_bindgen(js_name = clientRegistrationStart)]
pub fn client_registration_start(password: String) -> Result<JsValue, JsError> {
    let mut client_rng = OsRng;

    let client_registration_start_result =
        ClientRegistration::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .map_err(|_| JsError::new("failed to start client registration"))?;

    let result = ClientRegistrationStartResult {
        state: BASE64.encode(client_registration_start_result.state.serialize()),
        registrationRequest: BASE64.encode(
            client_registration_start_result
                .message
                .serialize()
                .to_vec(),
        ),
    };
    return serde_wasm_bindgen::to_value(&result)
        .map_err(|_| JsError::new("failed to construct return value"));
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
struct ClientRegistrationFinishProps {
    password: String,
    registrationResponse: String,
    state: String,
}

#[wasm_bindgen(js_name = clientRegistrationFinish)]
pub fn client_registration_finish(props: JsValue) -> Result<JsValue, JsError> {
    let input: ClientRegistrationFinishProps = serde_wasm_bindgen::from_value(props)?;
    let registration_response_bytes = BASE64.decode(input.registrationResponse)?;
    let mut rng: OsRng = OsRng;
    let state = ClientRegistration::<DefaultCipherSuite>::deserialize(&BASE64.decode(input.state)?)
        .map_err(|_| JsError::new("failed to deserialize client registration state"))?;
    let client_finish_registration_result = state
        .finish(
            &mut rng,
            input.password.as_bytes(),
            RegistrationResponse::deserialize(&registration_response_bytes)
                .map_err(|_| JsError::new("failed to deserialize registrationResponse"))?,
            ClientRegistrationFinishParameters::default(),
        )
        .map_err(|_| JsError::new("failed to finish client registration"))?;
    let message_bytes = client_finish_registration_result.message.serialize();
    return Ok(BASE64.encode(message_bytes.to_vec()).into());
}
