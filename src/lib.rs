mod utils;

use argon2::Argon2;
use opaque_ke::ciphersuite::CipherSuite;
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::{
    ClientLogin, ClientLoginFinishParameters, ClientRegistration,
    ClientRegistrationFinishParameters, CredentialFinalization, CredentialRequest,
    CredentialResponse, Identifiers, RegistrationRequest, RegistrationResponse, RegistrationUpload,
    ServerLogin, ServerLoginStartParameters, ServerRegistration, ServerSetup,
};

use base64::{engine::general_purpose as b64, Engine as _};
use serde::{Deserialize, Serialize};
use tsify::Tsify;
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

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomIdentifiers {
    client: Option<String>,
    server: Option<String>,
}

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

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ServerRegistrationStartParams {
    #[serde(rename = "serverSetup")]
    server_setup: String,
    username: String,
    #[serde(rename = "registrationRequest")]
    registration_request: String,
}

#[wasm_bindgen(js_name = serverRegistrationStart)]
pub fn server_registration_start(params: ServerRegistrationStartParams) -> Result<String, JsError> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let registration_request_bytes = BASE64.decode(params.registration_request)?;
    let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
        &server_setup,
        RegistrationRequest::deserialize(&registration_request_bytes)
            .map_err(|_| JsError::new("failed to deserialize registrationRequest"))?,
        params.username.as_bytes(),
    )
    .map_err(|_| JsError::new("failed to start server registration"))?;
    let registration_response_bytes = server_registration_start_result.message.serialize();
    return Ok(BASE64.encode(registration_response_bytes.to_vec()));
}

#[wasm_bindgen(js_name = serverRegistrationFinish)]
pub fn server_registration_finish(message: String) -> Result<String, JsError> {
    let message_bytes = BASE64.decode(message)?;
    let password_file = ServerRegistration::finish(
        RegistrationUpload::<DefaultCipherSuite>::deserialize(&message_bytes)
            .map_err(|_| JsError::new("failed to deserialize message"))?,
    );
    Ok(BASE64.encode(password_file.serialize().to_vec()))
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ServerLoginStartParams {
    #[serde(rename = "serverSetup")]
    server_setup: String,
    username: String,
    #[serde(rename = "passwordFile")]
    password_file: String,
    #[serde(rename = "credentialRequest")]
    credential_request: String,
    identifiers: Option<CustomIdentifiers>,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ServerLoginStartResult {
    #[serde(rename = "serverLogin")]
    server_login: String,
    #[serde(rename = "credentialResponse")]
    credential_response: String,
}

#[wasm_bindgen(js_name = serverLoginStart)]
pub fn server_login_start(
    params: ServerLoginStartParams,
) -> Result<ServerLoginStartResult, JsError> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let password_file_bytes = BASE64.decode(params.password_file)?;
    let credential_request_bytes = BASE64.decode(params.credential_request)?;

    let mut rng: OsRng = OsRng;
    let password_file = ServerRegistration::<DefaultCipherSuite>::deserialize(&password_file_bytes)
        .map_err(|_| JsError::new("failed to deserialize passwordFile"))?;

    let start_params = match params.identifiers.as_ref() {
        Some(idents) => ServerLoginStartParameters {
            identifiers: get_identifiers(idents),
            context: None,
        },
        None => ServerLoginStartParameters::default(),
    };

    let server_login_start_result = ServerLogin::start(
        &mut rng,
        &server_setup,
        Some(password_file),
        CredentialRequest::deserialize(&credential_request_bytes)
            .map_err(|_| JsError::new("failed to deserialize credentialRequest"))?,
        params.username.as_bytes(),
        start_params,
    )
    .map_err(|_| JsError::new("failed to start login"))?;

    let credential_response = BASE64.encode(server_login_start_result.message.serialize().to_vec());
    let server_login = BASE64.encode(server_login_start_result.state.serialize().to_vec());

    let result = ServerLoginStartResult {
        server_login,
        credential_response,
    };
    return Ok(result);
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ServerLoginFinishParams {
    #[serde(rename = "serverLogin")]
    server_login: String,
    #[serde(rename = "credentialFinalization")]
    credential_finalization: String,
}

#[wasm_bindgen(js_name = serverLoginFinish)]
pub fn server_login_finish(params: ServerLoginFinishParams) -> Result<String, JsError> {
    let credential_finalization_bytes = BASE64.decode(params.credential_finalization)?;
    let state_bytes = BASE64.decode(params.server_login)?;
    let state = ServerLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(|_| JsError::new("failed to deserialize server login state"))?;
    let server_login_finish_result = state
        .finish(
            CredentialFinalization::deserialize(&credential_finalization_bytes)
                .map_err(|_| JsError::new("failed to deserialize credentialFinalization"))?,
        )
        .map_err(|_| JsError::new("failed to finish server login"))?;
    return Ok(BASE64.encode(server_login_finish_result.session_key.to_vec()));
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientLoginStartResult {
    #[serde(rename = "clientLogin")]
    client_login: String,
    #[serde(rename = "credentialRequest")]
    credential_request: String,
}

#[wasm_bindgen(js_name = clientLoginStart)]
pub fn client_login_start(password: String) -> Result<ClientLoginStartResult, JsError> {
    let mut client_rng = OsRng;
    let client_login_start_result =
        ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .map_err(|_| JsError::new("failed to start client login"))?;

    let result = ClientLoginStartResult {
        client_login: BASE64.encode(client_login_start_result.state.serialize()),
        credential_request: BASE64.encode(client_login_start_result.message.serialize().to_vec()),
    };
    return Ok(result);
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientLoginFinishParams {
    #[serde(rename = "clientLogin")]
    client_login: String,
    #[serde(rename = "credentialResponse")]
    credential_response: String,
    password: String,
    identifiers: Option<CustomIdentifiers>,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientLoginFinishResult {
    #[serde(rename = "credentialFinalization")]
    credential_finalization: String,
    #[serde(rename = "sessionKey")]
    session_key: String,
}

#[wasm_bindgen(js_name = clientLoginFinish)]
pub fn client_login_finish(
    params: ClientLoginFinishParams,
) -> Result<Option<ClientLoginFinishResult>, JsError> {
    let credential_response_bytes = BASE64.decode(params.credential_response)?;
    let state_bytes = BASE64.decode(params.client_login)?;
    let state = ClientLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(|_| JsError::new("failed to deserialize client login state"))?;

    let finish_params = match params.identifiers.as_ref() {
        Some(idents) => ClientLoginFinishParameters::new(None, get_identifiers(idents), None),
        None => ClientLoginFinishParameters::default(),
    };

    let result = state.finish(
        params.password.as_bytes(),
        CredentialResponse::deserialize(&credential_response_bytes)
            .map_err(|_| JsError::new("failed to deserialize credentialResponse"))?,
        finish_params,
    );

    if result.is_err() {
        // Client-detected login failure
        return Ok(None);
    }
    let client_login_finish_result = result.unwrap();
    let session_key = client_login_finish_result.session_key;
    return Ok(Some(ClientLoginFinishResult {
        credential_finalization: BASE64
            .encode(client_login_finish_result.message.serialize().to_vec()),
        session_key: BASE64.encode(session_key.to_vec()),
    }));
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientRegistrationStartResult {
    #[serde(rename = "clientRegistration")]
    client_registration: String,
    #[serde(rename = "registrationRequest")]
    registration_request: String,
}

#[wasm_bindgen(js_name = clientRegistrationStart)]
pub fn client_registration_start(
    password: String,
) -> Result<ClientRegistrationStartResult, JsError> {
    let mut client_rng = OsRng;

    let client_registration_start_result =
        ClientRegistration::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .map_err(|_| JsError::new("failed to start client registration"))?;

    let result = ClientRegistrationStartResult {
        client_registration: BASE64.encode(client_registration_start_result.state.serialize()),
        registration_request: BASE64.encode(
            client_registration_start_result
                .message
                .serialize()
                .to_vec(),
        ),
    };
    return Ok(result);
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientRegistrationFinishParams {
    password: String,
    #[serde(rename = "registrationResponse")]
    registration_response: String,
    #[serde(rename = "clientRegistration")]
    client_registration: String,
    #[tsify(optional)]
    identifiers: Option<CustomIdentifiers>,
}

fn get_identifiers(idents: &CustomIdentifiers) -> Identifiers {
    let client = idents.client.as_ref().map(|val| val.as_bytes());
    let server = idents.server.as_ref().map(|val| val.as_bytes());
    Identifiers { client, server }
}

#[wasm_bindgen(js_name = clientRegistrationFinish)]
pub fn client_registration_finish(
    params: ClientRegistrationFinishParams,
) -> Result<String, JsError> {
    let registration_response_bytes = BASE64.decode(params.registration_response)?;
    let mut rng: OsRng = OsRng;
    let state = ClientRegistration::<DefaultCipherSuite>::deserialize(
        &BASE64.decode(params.client_registration)?,
    )
    .map_err(|_| JsError::new("failed to deserialize client registration state"))?;

    let finish_params: ClientRegistrationFinishParameters<DefaultCipherSuite> =
        match params.identifiers.as_ref() {
            Some(idents) => ClientRegistrationFinishParameters::new(get_identifiers(idents), None),
            None => ClientRegistrationFinishParameters::default(),
        };

    let client_finish_registration_result = state
        .finish(
            &mut rng,
            params.password.as_bytes(),
            RegistrationResponse::deserialize(&registration_response_bytes)
                .map_err(|_| JsError::new("failed to deserialize registrationResponse"))?,
            finish_params,
        )
        .map_err(|_| JsError::new("failed to finish client registration"))?;
    let message_bytes = client_finish_registration_result.message.serialize();
    return Ok(BASE64.encode(message_bytes.to_vec()).into());
}
