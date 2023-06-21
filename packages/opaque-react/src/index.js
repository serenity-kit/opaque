import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

/**
 * @typedef {Object} OpaqueConfig
 * @prop {string} basePath
 * @prop {typeof import('@serenity-kit/opaque')} opaque
 * @prop {typeof fetch} [fetch]
 * @prop {HeadersInit} [headers]
 */

/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegister(config) {
  const ref = useRef(config);
  useLayoutEffect(() => {
    ref.current = config;
  }, [config]);

  const register = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
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
          userIdentifier,
          registrationUpload,
        }),
      });

      if (!res.ok) {
        const info = await res.json();
        throw new Error(
          "error" in info ? info.error : "ERR_UNKNOWN_SERVER_RESPONSE"
        );
      }
      return true;
    },
    []
  );

  return register;
}

/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueLogin(config) {
  const ref = useRef(config);
  useLayoutEffect(() => {
    ref.current = config;
  }, [config]);

  const login = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
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
        }),
      });
      return res.ok ? sessionKey : null;
    },
    []
  );

  return login;
}

/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegisterRequest(config) {
  const doRegister = useOpaqueRegister(config);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(/** @returns {unknown|null} */ () => null);
  const register = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
      try {
        setLoading(true);
        const success = await doRegister(userIdentifier, password);
        setLoading(false);
        setError(null);
        return success;
      } catch (err) {
        setError(err);
        setLoading(false);
        return false;
      }
    },
    [doRegister]
  );
  return { register, isLoading, error };
}

/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueLoginRequest(config) {
  const doLogin = useOpaqueLogin(config);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(/** @returns {unknown|null} */ () => null);
  const [sessionKey, setSessionKey] = useState(
    /** @returns {string|null} **/ () => null
  );
  const login = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
      try {
        setLoading(true);
        setSessionKey(null);
        const sessionKey = await doLogin(userIdentifier, password);
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
