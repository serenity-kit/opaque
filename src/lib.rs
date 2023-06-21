use argon2::Argon2;
use js_sys::JsString;
use opaque_ke::ciphersuite::CipherSuite;
use opaque_ke::errors::ProtocolError;
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

enum Error {
    Protocol {
        context: &'static str,
        error: ProtocolError,
    },
    Base64 {
        context: &'static str,
        error: base64::DecodeError,
    },
}

fn from_base64_error(context: &'static str) -> impl Fn(base64::DecodeError) -> Error {
    move |error| Error::Base64 { context, error }
}

fn from_protocol_error(context: &'static str) -> impl Fn(ProtocolError) -> Error {
    move |error| Error::Protocol { context, error }
}

impl From<Error> for JsError {
    fn from(err: Error) -> Self {
        let msg = match err {
            Error::Protocol { context, error } => {
                format!("opaque protocol error at \"{}\"; {}", context, error)
            }
            Error::Base64 { context, error } => {
                format!("base64 decoding failed at \"{}\"; {}", context, error)
            }
        };
        JsError::new(&msg)
    }
}

struct DefaultCipherSuite;

#[cfg(not(feature = "p256"))]
impl CipherSuite for DefaultCipherSuite {
    type OprfCs = opaque_ke::Ristretto255;
    type KeGroup = opaque_ke::Ristretto255;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;
    type Ksf = Argon2<'static>;
}

#[cfg(feature = "p256")]
impl CipherSuite for DefaultCipherSuite {
    type OprfCs = p256::NistP256;
    type KeGroup = p256::NistP256;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;
    type Ksf = Argon2<'static>;
}

const BASE64: b64::GeneralPurpose = b64::URL_SAFE_NO_PAD;

type JsResult<T> = Result<T, Error>;

fn base64_decode<T: AsRef<[u8]>>(context: &'static str, input: T) -> JsResult<Vec<u8>> {
    BASE64.decode(input).map_err(from_base64_error(context))
}

#[wasm_bindgen(js_name = createServerSetup)]
pub fn create_server_setup() -> String {
    let mut rng: OsRng = OsRng;
    let setup = ServerSetup::<DefaultCipherSuite>::new(&mut rng);
    BASE64.encode(setup.serialize())
}

fn decode_server_setup(data: String) -> JsResult<ServerSetup<DefaultCipherSuite>> {
    base64_decode("serverSetup", data).and_then(|bytes| {
        ServerSetup::<DefaultCipherSuite>::deserialize(&bytes)
            .map_err(from_protocol_error("deserialize serverSetup"))
    })
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
pub struct CustomIdentifiers {
    #[tsify(optional)]
    client: Option<String>,
    #[tsify(optional)]
    server: Option<String>,
}

fn get_identifiers(idents: &Option<CustomIdentifiers>) -> Identifiers {
    Identifiers {
        client: idents
            .as_ref()
            .and_then(|idents| idents.client.as_ref().map(|val| val.as_bytes())),
        server: idents
            .as_ref()
            .and_then(|idents| idents.server.as_ref().map(|val| val.as_bytes())),
    }
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ServerRegistrationStartParams {
    #[serde(rename = "serverSetup")]
    server_setup: String,
    #[serde(rename = "userIdentifier")]
    user_identifier: String,
    #[serde(rename = "registrationRequest")]
    registration_request: String,
}

#[wasm_bindgen(js_name = serverRegistrationStart)]
pub fn server_registration_start(params: ServerRegistrationStartParams) -> Result<String, JsError> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let registration_request_bytes =
        base64_decode("registrationRequest", params.registration_request)?;
    let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
        &server_setup,
        RegistrationRequest::deserialize(&registration_request_bytes)
            .map_err(from_protocol_error("deserialize registrationRequest"))?,
        params.user_identifier.as_bytes(),
    )
    .map_err(from_protocol_error("start serverRegistration"))?;
    let registration_response_bytes = server_registration_start_result.message.serialize();
    Ok(BASE64.encode(registration_response_bytes))
}

#[wasm_bindgen(js_name = serverRegistrationFinish)]
pub fn server_registration_finish(message: JsString) -> Result<String, JsError> {
    let message_bytes = base64_decode(
        "message",
        message
            .as_string()
            .ok_or(JsError::new("message must be a string"))?,
    )?;
    let password_file = ServerRegistration::finish(
        RegistrationUpload::<DefaultCipherSuite>::deserialize(&message_bytes)
            .map_err(from_protocol_error("deserialize message"))?,
    );
    Ok(BASE64.encode(password_file.serialize()))
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ServerLoginStartParams {
    #[serde(rename = "serverSetup")]
    server_setup: String,
    #[serde(rename = "passwordFile")]
    #[tsify(type = "string | null | undefined")]
    password_file: Option<String>,
    #[serde(rename = "credentialRequest")]
    credential_request: String,
    #[serde(rename = "userIdentifier")]
    user_identifier: String,
    #[tsify(optional)]
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
    let password_file_bytes = match params.password_file {
        Some(pw) => base64_decode("passwordFile", pw).map(Some),
        None => Ok(None),
    }?;
    let credential_request_bytes = base64_decode("credentialRequest", params.credential_request)?;

    let mut rng: OsRng = OsRng;

    let password_file = match password_file_bytes.as_ref() {
        Some(bytes) => Some(
            ServerRegistration::<DefaultCipherSuite>::deserialize(bytes)
                .map_err(from_protocol_error("deserialize passwordFile"))?,
        ),
        None => None,
    };

    let start_params = ServerLoginStartParameters {
        identifiers: get_identifiers(&params.identifiers),
        context: None,
    };

    let server_login_start_result = ServerLogin::start(
        &mut rng,
        &server_setup,
        password_file,
        CredentialRequest::deserialize(&credential_request_bytes)
            .map_err(from_protocol_error("deserialize credentialRequest"))?,
        params.user_identifier.as_bytes(),
        start_params,
    )
    .map_err(from_protocol_error("start serverLogin"))?;

    let credential_response = BASE64.encode(server_login_start_result.message.serialize());
    let server_login = BASE64.encode(server_login_start_result.state.serialize());

    let result = ServerLoginStartResult {
        server_login,
        credential_response,
    };
    Ok(result)
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
    let credential_finalization_bytes =
        base64_decode("credentialFinalization", params.credential_finalization)?;
    let state_bytes = base64_decode("serverLogin", params.server_login)?;
    let state = ServerLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize serverLogin"))?;
    let server_login_finish_result = state
        .finish(
            CredentialFinalization::deserialize(&credential_finalization_bytes)
                .map_err(from_protocol_error("deserialize credentialFinalization"))?,
        )
        .map_err(from_protocol_error("finish serverLogin"))?;
    Ok(BASE64.encode(server_login_finish_result.session_key))
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
pub fn client_login_start(password: JsString) -> Result<ClientLoginStartResult, JsError> {
    let mut client_rng = OsRng;
    let client_login_start_result = ClientLogin::<DefaultCipherSuite>::start(
        &mut client_rng,
        password
            .as_string()
            .ok_or(JsError::new("password must be a string"))?
            .as_bytes(),
    )
    .map_err(from_protocol_error("start clientLogin"))?;

    let result = ClientLoginStartResult {
        client_login: BASE64.encode(client_login_start_result.state.serialize()),
        credential_request: BASE64.encode(client_login_start_result.message.serialize()),
    };
    Ok(result)
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientLoginFinishParams {
    #[serde(rename = "clientLogin")]
    client_login: String,
    #[serde(rename = "credentialResponse")]
    credential_response: String,
    password: String,
    #[tsify(optional)]
    identifiers: Option<CustomIdentifiers>,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientLoginFinishResult {
    #[serde(rename = "credentialFinalization")]
    credential_finalization: String,
    #[serde(rename = "sessionKey")]
    session_key: String,
    #[serde(rename = "exportKey")]
    export_key: String,
    #[serde(rename = "serverStaticPublicKey")]
    server_static_public_key: String,
}

#[wasm_bindgen(js_name = clientLoginFinish)]
pub fn client_login_finish(
    params: ClientLoginFinishParams,
) -> Result<Option<ClientLoginFinishResult>, JsError> {
    let credential_response_bytes =
        base64_decode("credentialResponse", params.credential_response)?;
    let state_bytes = base64_decode("clientLogin", params.client_login)?;
    let state = ClientLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize clientLogin"))?;

    let finish_params =
        ClientLoginFinishParameters::new(None, get_identifiers(&params.identifiers), None);

    let result = state.finish(
        params.password.as_bytes(),
        CredentialResponse::deserialize(&credential_response_bytes)
            .map_err(from_protocol_error("deserialize credentialResponse"))?,
        finish_params,
    );

    if result.is_err() {
        // Client-detected login failure
        return Ok(None);
    }
    let client_login_finish_result = result.unwrap();

    Ok(Some(ClientLoginFinishResult {
        credential_finalization: BASE64.encode(client_login_finish_result.message.serialize()),
        session_key: BASE64.encode(client_login_finish_result.session_key),
        export_key: BASE64.encode(client_login_finish_result.export_key),
        server_static_public_key: BASE64.encode(client_login_finish_result.server_s_pk.serialize()),
    }))
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
    password: JsString,
) -> Result<ClientRegistrationStartResult, JsError> {
    let mut client_rng = OsRng;

    let client_registration_start_result = ClientRegistration::<DefaultCipherSuite>::start(
        &mut client_rng,
        password
            .as_string()
            .ok_or(JsError::new("password must be a string"))?
            .as_bytes(),
    )
    .map_err(from_protocol_error("start clientRegistration"))?;

    let result = ClientRegistrationStartResult {
        client_registration: BASE64.encode(client_registration_start_result.state.serialize()),
        registration_request: BASE64.encode(client_registration_start_result.message.serialize()),
    };
    Ok(result)
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

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ClientRegistrationFinishResult {
    #[serde(rename = "registrationUpload")]
    registration_upload: String,
    #[serde(rename = "exportKey")]
    export_key: String,
    #[serde(rename = "serverStaticPublicKey")]
    server_static_public_key: String,
}

#[wasm_bindgen(js_name = clientRegistrationFinish)]
pub fn client_registration_finish(
    params: ClientRegistrationFinishParams,
) -> Result<ClientRegistrationFinishResult, JsError> {
    let registration_response_bytes =
        base64_decode("registrationResponse", params.registration_response)?;
    let mut rng: OsRng = OsRng;
    let client_registration = base64_decode("clientRegistration", params.client_registration)?;
    let state = ClientRegistration::<DefaultCipherSuite>::deserialize(&client_registration)
        .map_err(from_protocol_error("deserialize clientRegistration"))?;

    let finish_params =
        ClientRegistrationFinishParameters::new(get_identifiers(&params.identifiers), None);

    let client_finish_registration_result = state
        .finish(
            &mut rng,
            params.password.as_bytes(),
            RegistrationResponse::deserialize(&registration_response_bytes)
                .map_err(from_protocol_error("deserialize registrationResponse"))?,
            finish_params,
        )
        .map_err(from_protocol_error("finish clientRegistration"))?;

    let message_bytes = client_finish_registration_result.message.serialize();
    let result = ClientRegistrationFinishResult {
        registration_upload: BASE64.encode(message_bytes),
        export_key: BASE64.encode(client_finish_registration_result.export_key),
        server_static_public_key: BASE64
            .encode(client_finish_registration_result.server_s_pk.serialize()),
    };
    Ok(result)
}
