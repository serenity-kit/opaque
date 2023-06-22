import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

/**
 * @typedef {Object} OpaqueConfig
 * @prop {string} basePath
 * @prop {typeof import('@serenity-kit/opaque')} opaque
 * @prop {typeof fetch} [fetch]
 * @prop {HeadersInit} [headers]
 */

/**
 * @template [UserResponse=unknown]
 * @template [UserData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegister(config) {
  const ref = useRef(config);
  useLayoutEffect(() => {
    ref.current = config;
  }, [config]);

  const register = useCallback(
    /**
     * @param {string} userIdentifier
     * @param {string} password
     * @param {UserData} userData
     * @returns {Promise<UserResponse>}
     */
    async (userIdentifier, password, userData) => {
      const { fetch = window.fetch, opaque, basePath } = ref.current;
      const { clientRegistration, registrationRequest } =
        opaque.clientRegistrationStart(password);
      const { registrationResponse } = await fetch(
        `${basePath}/register/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...ref.current.headers,
          },
          body: JSON.stringify({
            userIdentifier,
            registrationRequest,
          }),
        }
      ).then((res) => res.json());

      const { registrationUpload } = opaque.clientRegistrationFinish({
        clientRegistration,
        registrationResponse,
        password,
      });

      const res = await fetch(`${basePath}/register/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ref.current.headers,
        },
        body: JSON.stringify({
          userData,
          registrationUpload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          "error" in data ? data.error : "ERR_UNKNOWN_SERVER_RESPONSE"
        );
      }
      if ("payload" in data) {
        return data.payload;
      } else {
        throw new Error("ERR_UNKNOWN_SERVER_RESPONSE");
      }
    },
    []
  );

  return register;
}

/**
 * @template [CustomData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueLogin(config) {
  const ref = useRef(config);
  useLayoutEffect(() => {
    ref.current = config;
  }, [config]);

  const login = useCallback(
    /**
     * @param {string} userIdentifier
     * @param {string} password
     * @param {CustomData} [customData]
     */
    async (userIdentifier, password, customData) => {
      const { fetch = window.fetch, opaque, basePath } = ref.current;

      const { clientLogin, credentialRequest } =
        opaque.clientLoginStart(password);

      let res = await fetch(`${basePath}/login/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ref.current.headers,
        },
        body: JSON.stringify({
          userIdentifier,
          credentialRequest,
        }),
      });

      if (!res.ok) {
        const info = await res.json();
        throw new Error(
          "error" in info ? info.error : "ERR_UNKNOWN_SERVER_RESPONSE"
        );
      }

      const { credentialResponse } = await res.json();

      const loginResult = opaque.clientLoginFinish({
        clientLogin,
        credentialResponse,
        password,
      });

      if (!loginResult) {
        throw new Error("ERR_CREDENTIALS_INVALID");
      }
      const { sessionKey, credentialFinalization } = loginResult;

      res = await fetch(`${basePath}/login/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ref.current.headers,
        },
        body: JSON.stringify({
          userIdentifier,
          credentialFinalization,
          customData,
        }),
      });
      return res.ok ? sessionKey : null;
    },
    []
  );

  return login;
}

/**
 * @template [UserResponse=unknown]
 * @template [UserData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegisterState(config) {
  /** @type {(userIdent: string, password: string, userData: UserData) => Promise<UserResponse>} */
  const doRegister = useOpaqueRegister(config);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(/** @returns {unknown|null} */ () => null);
  const register = useCallback(
    /**
     * @param {string} userIdentifier
     * @param {string} password
     * @param {UserData} userData
     * @returns {Promise<UserResponse|null>}
     */
    async (userIdentifier, password, userData) => {
      try {
        setLoading(true);
        const result = await doRegister(userIdentifier, password, userData);
        setLoading(false);
        setError(null);
        return result;
      } catch (err) {
        setError(err);
        setLoading(false);
        return null;
      }
    },
    [doRegister]
  );
  return { register, isLoading, error };
}

/**
 * @template [CustomData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueLoginState(config) {
  const doLogin = useOpaqueLogin(config);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(/** @returns {unknown|null} */ () => null);
  const [sessionKey, setSessionKey] = useState(
    /** @returns {string|null} **/ () => null
  );
  const login = useCallback(
    /**
     * @param {string} userIdentifier
     * @param {string} password
     * @param {CustomData} [customData]
     */
    async (userIdentifier, password, customData) => {
      try {
        setLoading(true);
        setSessionKey(null);
        const sessionKey = await doLogin(userIdentifier, password, customData);
        setLoading(false);
        setSessionKey(sessionKey);
        setError(null);
        return sessionKey;
      } catch (err) {
        setError(err);
        console.error(err);
        setLoading(false);
        return null;
      }
    },
    [doLogin]
  );
  return { login, isLoading, error, sessionKey };
}
