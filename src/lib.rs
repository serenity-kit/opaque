use argon2::{Algorithm, Argon2, ParamsBuilder, Version};
use opaque_ke::ciphersuite::CipherSuite;
use opaque_ke::errors::{InternalError, ProtocolError};
use opaque_ke::ksf::Ksf;
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::{
    ClientLogin, ClientLoginFinishParameters, ClientRegistration,
    ClientRegistrationFinishParameters, CredentialFinalization, CredentialRequest,
    CredentialResponse, Identifiers, RegistrationRequest, RegistrationResponse, ServerLogin,
    ServerLoginStartParameters, ServerRegistration, ServerSetup,
};

use base64::{engine::general_purpose as b64, Engine as _};
use generic_array::{ArrayLength, GenericArray};
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
    Internal {
        context: &'static str,
        error: InternalError,
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
            Error::Internal { context, error } => {
                format!("Internal error at \"{}\"; {}", context, error)
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
    type Ksf = CustomKsf;
}

#[cfg(feature = "p256")]
impl CipherSuite for DefaultCipherSuite {
    type OprfCs = p256::NistP256;
    type KeGroup = p256::NistP256;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;
    type Ksf = CustomKsf;
}

const BASE64: b64::GeneralPurpose = b64::URL_SAFE_NO_PAD;

type JsResult<T> = Result<T, Error>;

#[derive(Default)]
struct CustomKsf {
    argon: Argon2<'static>,
}

impl Ksf for CustomKsf {
    fn hash<L: ArrayLength<u8>>(
        &self,
        input: GenericArray<u8, L>,
    ) -> Result<GenericArray<u8, L>, InternalError> {
        let mut output = GenericArray::default();
        self.argon
            .hash_password_into(&input, &[0; argon2::RECOMMENDED_SALT_LEN], &mut output)
            .map_err(|_| InternalError::KsfError)?;
        Ok(output)
    }
}

fn build_argon2_ksf(
    t_cost: u32,
    m_cost: u32,
    parallelism: u32,
) -> Result<Option<CustomKsf>, Error> {
    let mut param_builder = ParamsBuilder::default();
    param_builder.t_cost(t_cost);
    param_builder.m_cost(m_cost);
    param_builder.p_cost(parallelism);

    if let Ok(params) = param_builder.build() {
        let argon = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
        return Ok(Some(CustomKsf { argon }));
    }

    Err(Error::Internal {
        context: "Invalid keyStretching (argon2id) combination",
        error: InternalError::KsfError,
    })
}

fn get_custom_ksf(
    ksf_config: Option<KeyStretchingFunctionConfig>,
) -> Result<Option<CustomKsf>, Error> {
    let config = ksf_config.unwrap_or(KeyStretchingFunctionConfig::Recommended);

    match config {
        // https://www.ietf.org/archive/id/draft-irtf-cfrg-opaque-17.html#name-configurations
        // using the recommended parameters for Argon2id except we due 2^21-1 since 2^21 crashes in browsers
        KeyStretchingFunctionConfig::Recommended => build_argon2_ksf(1, u32::pow(2, 21) - 1, 4),
        // https://www.rfc-editor.org/rfc/rfc9106.html#name-recommendations
        KeyStretchingFunctionConfig::MemoryConstrained => build_argon2_ksf(3, u32::pow(2, 16), 4),
        KeyStretchingFunctionConfig::Custom {
            iterations,
            memory,
            parallelism,
        } => build_argon2_ksf(iterations, memory, parallelism),
    }
}
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

#[wasm_bindgen(js_name = getServerPublicKey)]
pub fn get_server_public_key(data: String) -> Result<String, JsError> {
    let server_setup = decode_server_setup(data)?;
    let pub_key = server_setup.keypair().public().serialize();
    Ok(BASE64.encode(pub_key))
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
enum KeyStretchingFunctionConfig {
    #[serde(rename = "recommended")]
    Recommended,
    #[serde(rename = "memory-constrained")]
    MemoryConstrained,
    #[serde(rename = "argon2id-custom")]
    Custom {
        #[serde(rename = "iterations")]
        iterations: u32,
        #[serde(rename = "memory")]
        memory: u32,
        #[serde(rename = "parallelism")]
        parallelism: u32,
    },
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct CreateServerRegistrationResponseParams {
    #[serde(rename = "serverSetup")]
    server_setup: String,
    #[serde(rename = "userIdentifier")]
    user_identifier: String,
    #[serde(rename = "registrationRequest")]
    registration_request: String,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct CreateServerRegistrationResponseResult {
    #[serde(rename = "registrationResponse")]
    registration_response: String,
}

#[wasm_bindgen(js_name = createServerRegistrationResponse)]
pub fn create_server_registration_response(
    params: CreateServerRegistrationResponseParams,
) -> Result<CreateServerRegistrationResponseResult, JsError> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let registration_request_bytes =
        base64_decode("registrationRequest", params.registration_request)?;
    let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
        &server_setup,
        RegistrationRequest::deserialize(&registration_request_bytes)
            .map_err(from_protocol_error("deserialize registrationRequest"))?,
        params.user_identifier.as_bytes(),
    )
    .map_err(from_protocol_error("start server registration"))?;
    let registration_response_bytes = server_registration_start_result.message.serialize();

    Ok(CreateServerRegistrationResponseResult {
        registration_response: BASE64.encode(registration_response_bytes),
    })
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StartServerLoginParams {
    #[serde(rename = "serverSetup")]
    server_setup: String,
    #[serde(rename = "registrationRecord")]
    #[tsify(type = "string | null | undefined")]
    registration_record: Option<String>,
    #[serde(rename = "startLoginRequest")]
    start_login_request: String,
    #[serde(rename = "userIdentifier")]
    user_identifier: String,
    #[tsify(optional)]
    identifiers: Option<CustomIdentifiers>,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StartServerLoginResult {
    #[serde(rename = "serverLoginState")]
    server_login_state: String,
    #[serde(rename = "loginResponse")]
    login_response: String,
}

#[wasm_bindgen(js_name = startServerLogin)]
pub fn start_server_login(
    params: StartServerLoginParams,
) -> Result<StartServerLoginResult, JsError> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let registration_record_bytes = match params.registration_record {
        Some(pw) => base64_decode("registrationRecord", pw).map(Some),
        None => Ok(None),
    }?;
    let credential_request_bytes = base64_decode("startLoginRequest", params.start_login_request)?;

    let mut rng: OsRng = OsRng;

    let registration_record = match registration_record_bytes.as_ref() {
        Some(bytes) => Some(
            ServerRegistration::<DefaultCipherSuite>::deserialize(bytes)
                .map_err(from_protocol_error("deserialize registrationRecord"))?,
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
        registration_record,
        CredentialRequest::deserialize(&credential_request_bytes)
            .map_err(from_protocol_error("deserialize startLoginRequest"))?,
        params.user_identifier.as_bytes(),
        start_params,
    )
    .map_err(from_protocol_error("start server login"))?;

    let login_response = BASE64.encode(server_login_start_result.message.serialize());
    let server_login_state = BASE64.encode(server_login_start_result.state.serialize());

    let result = StartServerLoginResult {
        server_login_state,
        login_response,
    };
    Ok(result)
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct FinishServerLoginParams {
    #[serde(rename = "serverLoginState")]
    server_login_state: String,
    #[serde(rename = "finishLoginRequest")]
    finish_login_request: String,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct FinishServerLoginResult {
    #[serde(rename = "sessionKey")]
    session_key: String,
}

#[wasm_bindgen(js_name = finishServerLogin)]
pub fn finish_server_login(
    params: FinishServerLoginParams,
) -> Result<FinishServerLoginResult, JsError> {
    let credential_finalization_bytes =
        base64_decode("finishLoginRequest", params.finish_login_request)?;
    let state_bytes = base64_decode("serverLoginState", params.server_login_state)?;
    let state = ServerLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize serverLoginState"))?;
    let server_login_finish_result = state
        .finish(
            CredentialFinalization::deserialize(&credential_finalization_bytes)
                .map_err(from_protocol_error("deserialize finishLoginRequest"))?,
        )
        .map_err(from_protocol_error("finish server login"))?;
    Ok(FinishServerLoginResult {
        session_key: BASE64.encode(server_login_finish_result.session_key),
    })
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StartClientLoginParams {
    password: String,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StartClientLoginResult {
    #[serde(rename = "clientLoginState")]
    client_login_state: String,
    #[serde(rename = "startLoginRequest")]
    start_login_request: String,
}

#[wasm_bindgen(js_name = startClientLogin)]
pub fn start_client_login(
    params: StartClientLoginParams,
) -> Result<StartClientLoginResult, JsError> {
    let mut client_rng = OsRng;
    let client_login_start_result =
        ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, params.password.as_bytes())
            .map_err(from_protocol_error("start client login"))?;

    let result = StartClientLoginResult {
        client_login_state: BASE64.encode(client_login_start_result.state.serialize()),
        start_login_request: BASE64.encode(client_login_start_result.message.serialize()),
    };
    Ok(result)
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct FinishClientLoginParams {
    #[serde(rename = "clientLoginState")]
    client_login_state: String,
    #[serde(rename = "loginResponse")]
    login_response: String,
    password: String,
    #[tsify(optional)]
    identifiers: Option<CustomIdentifiers>,
    #[tsify(optional)]
    #[serde(rename = "keyStretching")]
    key_stretching_function_config: Option<KeyStretchingFunctionConfig>,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct FinishClientLoginResult {
    #[serde(rename = "finishLoginRequest")]
    finish_login_request: String,
    #[serde(rename = "sessionKey")]
    session_key: String,
    #[serde(rename = "exportKey")]
    export_key: String,
    #[serde(rename = "serverStaticPublicKey")]
    server_static_public_key: String,
}

#[wasm_bindgen(js_name = finishClientLogin)]
pub fn finish_client_login(
    params: FinishClientLoginParams,
) -> Result<Option<FinishClientLoginResult>, JsError> {
    let custom_ksf = get_custom_ksf(params.key_stretching_function_config)?;

    let credential_response_bytes = base64_decode("loginResponse", params.login_response)?;
    let state_bytes = base64_decode("clientLoginState", params.client_login_state)?;
    let state = ClientLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize clientLoginState"))?;

    let finish_params = ClientLoginFinishParameters::new(
        None,
        get_identifiers(&params.identifiers),
        custom_ksf.as_ref(),
    );

    let result = state.finish(
        params.password.as_bytes(),
        CredentialResponse::deserialize(&credential_response_bytes)
            .map_err(from_protocol_error("deserialize loginResponse"))?,
        finish_params,
    );

    if result.is_err() {
        // Client-detected login failure
        return Ok(None);
    }
    let client_login_finish_result = result.unwrap();

    Ok(Some(FinishClientLoginResult {
        finish_login_request: BASE64.encode(client_login_finish_result.message.serialize()),
        session_key: BASE64.encode(client_login_finish_result.session_key),
        export_key: BASE64.encode(client_login_finish_result.export_key),
        server_static_public_key: BASE64.encode(client_login_finish_result.server_s_pk.serialize()),
    }))
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StartClientRegistrationParams {
    password: String,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StartClientRegistrationResult {
    #[serde(rename = "clientRegistrationState")]
    client_registration_state: String,
    #[serde(rename = "registrationRequest")]
    registration_request: String,
}

#[wasm_bindgen(js_name = startClientRegistration)]
pub fn start_client_registration(
    params: StartClientRegistrationParams,
) -> Result<StartClientRegistrationResult, JsError> {
    let mut client_rng = OsRng;

    let client_registration_start_result = ClientRegistration::<DefaultCipherSuite>::start(
        &mut client_rng,
        params.password.as_bytes(),
    )
    .map_err(from_protocol_error("start client registration"))?;

    let result = StartClientRegistrationResult {
        client_registration_state: BASE64
            .encode(client_registration_start_result.state.serialize()),
        registration_request: BASE64.encode(client_registration_start_result.message.serialize()),
    };
    Ok(result)
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct FinishClientRegistrationParams {
    password: String,
    #[serde(rename = "registrationResponse")]
    registration_response: String,
    #[serde(rename = "clientRegistrationState")]
    client_registration_state: String,
    #[tsify(optional)]
    identifiers: Option<CustomIdentifiers>,
    #[tsify(optional)]
    #[serde(rename = "keyStretching")]
    key_stretching_function_config: Option<KeyStretchingFunctionConfig>,
}

#[derive(Debug, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct FinishClientRegistrationResult {
    #[serde(rename = "registrationRecord")]
    registration_record: String,
    #[serde(rename = "exportKey")]
    export_key: String,
    #[serde(rename = "serverStaticPublicKey")]
    server_static_public_key: String,
}

#[wasm_bindgen(js_name = finishClientRegistration)]
pub fn finish_client_registration(
    params: FinishClientRegistrationParams,
) -> Result<FinishClientRegistrationResult, JsError> {
    let custom_ksf = get_custom_ksf(params.key_stretching_function_config)?;

    let registration_response_bytes =
        base64_decode("registrationResponse", params.registration_response)?;
    let mut rng: OsRng = OsRng;
    let client_registration =
        base64_decode("clientRegistrationState", params.client_registration_state)?;
    let state = ClientRegistration::<DefaultCipherSuite>::deserialize(&client_registration)
        .map_err(from_protocol_error("deserialize clientRegistrationState"))?;

    let finish_params = ClientRegistrationFinishParameters::new(
        get_identifiers(&params.identifiers),
        custom_ksf.as_ref(),
    );

    let client_finish_registration_result = state
        .finish(
            &mut rng,
            params.password.as_bytes(),
            RegistrationResponse::deserialize(&registration_response_bytes)
                .map_err(from_protocol_error("deserialize registrationResponse"))?,
            finish_params,
        )
        .map_err(from_protocol_error("finish client registration"))?;

    let registration_record_bytes = client_finish_registration_result.message.serialize();
    let result = FinishClientRegistrationResult {
        registration_record: BASE64.encode(registration_record_bytes),
        export_key: BASE64.encode(client_finish_registration_result.export_key),
        server_static_public_key: BASE64
            .encode(client_finish_registration_result.server_s_pk.serialize()),
    };
    Ok(result)
}
